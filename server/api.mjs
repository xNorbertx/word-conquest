import {applyCommand,checkCommand,commandKey,configFor,Engine,Fault,LEGACY_RULES_VERSION,statistics,uuid} from './domain.mjs';
import words from './versions/dictionary-v1.json' with {type:'json'};
import metadata from './versions/dictionary-v1.meta.json' with {type:'json'};
import {normalizeUsername,validUsername,usernameHint} from '../online/username.mjs';
const dictionary = new Set(words);
const serverRandom=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
function unwrap(result) {
  if (result.error) {
    if(result.error.code==='23505'&&result.error.message.includes('profiles_username_key'))throw new Fault('username_taken','That username is already taken. Try another.',409);
    const code = ['username_required','invalid_username','friend_stale','friend_unavailable','friend_cooldown','friend_limit','invitation_pending','stale','idempotency_conflict','ended','forbidden','invitation_unavailable','cannot_accept_own_invitation','game_limit','account_deleting']
      .find(c => result.error.message.includes(c));
    if (code) throw new Fault(code, code.replaceAll('_',' '), code==='forbidden'?403:409);
    throw new Fault('service_unavailable','The service could not complete this request. Retry with the same operation.',503);
  }
  return result.data;
}
async function readBody(req) {
  if (Number(req.headers.get('content-length'))>16384) throw new Fault('too_large','Request too large.',413);
  const reader=req.body?.getReader(); if(!reader) return {};
  const chunks=[]; let total=0;
  try { while(true) {const {done,value}=await reader.read(); if(done)break; total+=value.length;
    if(total>16384){await reader.cancel();throw new Fault('too_large','Request too large.',413);} chunks.push(value);}
    const bytes=new Uint8Array(total); let offset=0; for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    const parsed=JSON.parse(new TextDecoder().decode(bytes));
    if(!parsed || typeof parsed!=='object' || Array.isArray(parsed))throw new Fault('invalid_json','Expected an action object.');
    return parsed;
  } catch(e) {if(e instanceof Fault)throw e;throw new Fault('invalid_json','Invalid request.');}
}
export function createHandler(db, settings={}) {
  return async req => {
    const requestId=crypto.randomUUID(), origin=req.headers.get('origin');
    const allowed=(settings.origins || []).includes(origin);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Request-Id':requestId,'Vary':'Origin',
      ...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    try {
      if (origin && !allowed) throw new Fault('origin','This app origin is not enabled.',403);
      if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
      if(req.method!=='POST') throw new Fault('method','Use POST.',405);
      const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
      if(!token)throw new Fault('unauthorized','Sign in to continue.',401);
      const {data:auth,error:authError}=await db.auth.getUser(token);
      if(authError || !auth?.user)throw new Fault('unauthorized','Sign in again to continue.',401);
      const actor=auth.user.id;
      const input=await readBody(req);
      // Older APKs only understand v1. Never let them silently play a different ruleset.
      const supported=Array.isArray(input.supportedRules)?input.supportedRules:[LEGACY_RULES_VERSION];
      const requireRules=game=>{
        if(!configFor(game.rules_version))throw new Fault('version_unavailable','This game needs its original rules and dictionary.',503);
        if(!supported.includes(game.rules_version))throw new Fault('client_update_required','Update Word Conquest or open the latest web app to play this game.',409);
      };
      const wakePush=()=>{try{settings.wakePush?.();}catch{/* Cron retries the durable queue. */}};
      if(!unwrap(await db.rpc('wc_rate_limit',{p_actor:actor}))) throw new Fault('rate_limit','Please wait a minute before trying again.',429);
      const profile=unwrap(await db.from('profiles').select('*').eq('id',actor).single());
      if(profile.deleting && input.action!=='delete_account')throw new Fault('account_deleting','Account deletion is in progress. Retry deletion.',409);
      const gameForActor=async id=>{
        if(!uuid(id))throw new Fault('invalid_game','Invalid game link.');
        const g=unwrap(await db.from('games').select('*').eq('id',id).contains('players',[actor]).maybeSingle());
        if(!g)throw new Fault('not_found','Game unavailable.',404); return g;
      };
      const decorate=async g=>{
        const ids=g.players.filter(Boolean);
        const names=unwrap(await db.from('profiles').select('id,display_name').in('id',ids));
        return {...g,names:g.players.map(id=>names.find(p=>p.id===id)?.display_name || 'Deleted player')};
      };
      switch(input.action) {
        case 'home': {
          const games=unwrap(await db.from('games').select('*').contains('players',[actor]).order('updated_at',{ascending:false}).limit(200));
          const notifications=unwrap(await db.from('notifications').select('id,game_id,kind,read_at,created_at').eq('user_id',actor).order('created_at',{ascending:false}).limit(50));
          const social=unwrap(await db.rpc('wc_friends',{p_actor:actor}));
          return reply({profile,games:await Promise.all(games.map(decorate)),notifications,social});
        }
        case 'game': {
          if(uuid(input.gameId)){
            const addressed=unwrap(await db.from('invitations').select('token').eq('game_id',input.gameId).eq('recipient',actor).maybeSingle());
            if(addressed){
              const invitation=unwrap(await db.rpc('wc_invitation',{p_actor:actor,p_token:addressed.token,p_action:'preview'}));
              if(invitation.status==='invited'){
                if(input.supportsFriends!==true)throw new Fault('client_update_required','Update Word Conquest to open this friend invitation.',409);
                return reply({invitation:{...invitation,token:addressed.token}});
              }
            }
          }
          const game=await gameForActor(input.gameId);requireRules(game);
          const history=unwrap(await db.from('operations').select('revision,recap').eq('game_id',game.id).order('revision',{ascending:false}).limit(100));
          const invitation=game.status==='invited' && game.players[0]===actor
            ? unwrap(await db.from('invitations').select('token,expires_at,recipient').eq('game_id',game.id).maybeSingle()) : null;
          if(invitation?.recipient){const p=unwrap(await db.from('profiles').select('display_name').eq('id',invitation.recipient).maybeSingle());invitation.recipient_name=p?.display_name||'Your friend';}
          return reply({game:await decorate(game),history,invitation});
        }
        case 'create': {
          if(!uuid(input.gameId))throw new Fault('invalid_id','A saved game ID is required.');
          const version=input.rulesVersion??LEGACY_RULES_VERSION,config=configFor(version);
          if(!config)throw new Fault('invalid_rules','Choose a supported game ruleset.');
          requireRules({rules_version:version});
          // New board is computed here; a retried create returns its original stored board.
          if(input.friendId!==undefined&&!uuid(input.friendId))throw new Fault('invalid_friend','Choose a friend.');
          const game=unwrap(await db.rpc(input.friendId?'wc_create_friend':'wc_create',{p_actor:actor,...(input.friendId?{p_friend:input.friendId}:{}),p_id:input.gameId,p_token:crypto.randomUUID(),
            p_state:Engine.newGame(config,serverRandom),p_rules:version,p_dictionary:metadata.version}));
          requireRules(game);if(input.friendId)wakePush();return reply({game:await decorate(game)});
        }
        case 'invitation': {
          if(!uuid(input.token))throw new Fault('invalid_invite','Invalid invitation code.');
          if(!['preview','accept','decline','cancel'].includes(input.choice))throw new Fault('invalid_action','Choose an invitation action.');
          if(input.choice==='preview'||input.choice==='accept'){
            const invitation=unwrap(await db.rpc('wc_invitation',{p_actor:actor,p_token:input.token,p_action:'preview'}));
            const invited=unwrap(await db.from('games').select('rules_version').eq('id',invitation.id).single());
            if(input.choice==='preview')return reply({invitation:{...invitation,rulesVersion:invited.rules_version}});
            requireRules(invited);
          }
          const result=unwrap(await db.rpc('wc_invitation',{p_actor:actor,p_token:input.token,p_action:input.choice}));
          if(input.choice!=='preview')wakePush();
          return reply(input.choice==='preview'?{invitation:result}:{game:result});
        }
        case 'turn': {
          checkCommand(input.command);
          const game=await gameForActor(input.gameId), fingerprint=commandKey(input.command);requireRules(game);
          const receipt=unwrap(await db.from('operations').select('*').eq('game_id',game.id).eq('operation_id',input.command.operationId).maybeSingle());
          if(receipt) {
            if(receipt.actor!==actor || receipt.fingerprint!==fingerprint)throw new Fault('idempotency_conflict','This retry ID belongs to a different action.',409);
            return reply({game:await decorate(game),acceptedRevision:receipt.revision,replayed:true,recap:receipt.recap});
          }
          const {next,recap}=applyCommand(game,actor,input.command,dictionary,metadata.version,serverRandom);
          const result=unwrap(await db.rpc('wc_commit',{p_actor:actor,p_game:game.id,p_operation:input.command.operationId,
            p_fingerprint:fingerprint,p_expected:input.command.revision,p_next:next,p_recap:recap}));
          wakePush();result.game=await decorate(result.game);return reply(result);
        }
        case 'push_device': {
          if(!uuid(input.deviceId) || typeof input.enabled!=='boolean')throw new Fault('invalid_device','Invalid device registration.');
          if(input.enabled && (typeof input.token!=='string' || input.token.length<20 || input.token.length>4096 || !/^[A-Za-z0-9_:\-]+$/.test(input.token)))throw new Fault('invalid_token','Invalid notification registration.');
          unwrap(await db.rpc('wc_push_register',{p_actor:actor,p_device:input.deviceId,p_token:input.enabled?input.token:'',p_enabled:input.enabled}));
          return reply({ok:true});
        }
        case 'push_test': {
          if(!uuid(input.deviceId))throw new Fault('invalid_device','Invalid device registration.');
          const device=unwrap(await db.from('push_devices').select('id,token,enabled').eq('id',input.deviceId).eq('user_id',actor).maybeSingle());
          if(!device?.enabled)throw new Fault('push_not_connected','Connect notifications on this phone first.',409);
          if(!settings.sendTestPush)throw new Fault('push_unavailable','Notification testing is temporarily unavailable.',503);
          const outcome=await settings.sendTestPush({token:device.token,kind:'test',notification_id:crypto.randomUUID()});
          if(outcome==='invalid_token')throw new Fault('push_reconnect','Reconnect notifications on this phone and try again.',409);
          if(outcome!=='sent')throw new Fault('push_unavailable','The notification service could not send the test. Please retry.',503);
          return reply({accepted:true});
        }
        case 'friends': return reply({social:unwrap(await db.rpc('wc_friends',{p_actor:actor})),profile});
        case 'friend_search': {
          const query=typeof input.query==='string'?input.query.trim():'';
          if(!query||query.length>64)throw new Fault('invalid_search','Enter a username or friend code.');
          return reply({people:unwrap(await db.rpc('wc_friend_search',{p_actor:actor,p_query:query}))});
        }
        case 'friend_action': {
          if(!uuid(input.friendId)||!uuid(input.operationId)||!['request','accept','decline','cancel','remove','block','unblock'].includes(input.choice)||input.requestId!=null&&!uuid(input.requestId))throw new Fault('invalid_friend','Invalid friend action.');
          unwrap(await db.rpc('wc_friend_action',{p_actor:actor,p_target:input.friendId,p_action:input.choice,p_operation:input.operationId,p_request:input.requestId||null}));
          return reply({social:unwrap(await db.rpc('wc_friends',{p_actor:actor}))});
        }
        case 'profile': {
          const name=normalizeUsername(input.username??input.name);
          if(!validUsername(name))throw new Fault('invalid_username',usernameHint);
          unwrap(await db.from('profiles').update({username:name,email_notifications:input.emailNotifications===true}).eq('id',actor));
          return reply({ok:true,username:name});
        }
        case 'read_notifications': {
          unwrap(await db.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',actor).is('read_at',null));
          return reply({ok:true});
        }
        case 'stats': case 'export': {
          const all=[]; for(let from=0;;from+=100) {
            const page=unwrap(await db.from('games').select('*').contains('players',[actor]).order('id').range(from,from+99));
            all.push(...page);if(page.length<100)break;
          }
          return reply(input.action==='stats'?{statistics:statistics(all,actor)}:{profile,games:all,social:unwrap(await db.rpc('wc_friends',{p_actor:actor})),email:auth.user.email});
        }
        case 'delete_account': {
          if(input.confirmation!=='DELETE')throw new Fault('confirmation','Type DELETE to confirm account deletion.');
          // Require a recent authentication, not merely a freshly refreshed access token.
          const last=Date.parse(auth.user.last_sign_in_at || '');
          if(!Number.isFinite(last) || Date.now()-last>10*60000)throw new Fault('reauthenticate','Sign out and sign in again before deleting your account.',401);
          unwrap(await db.rpc('wc_delete_account',{p_actor:actor}));
          unwrap(await db.auth.admin.deleteUser(actor));
          return reply({ok:true});
        }
        default: throw new Fault('invalid_action','Unknown request.');
      }
    } catch(e) {
      const known=e instanceof Fault;
      // Never log JWTs, email addresses, request bodies, dictionary words or game state.
      console.error(JSON.stringify({requestId,code:known?e.code:'internal'}));
      return reply({error:known?e.message:'The service is unavailable. Your action may still be pending; retry safely.',code:known?e.code:'internal',requestId},known?e.status:503);
    }
  };
}
