import {$,icon,node,button,showSheet,closeSheet,ask,emptyState} from './ui.js';

export const formatFriendCode=code=>(code||'').match(/.{1,4}/g)?.join('-')||'';

export function createFriends({api,getUser,getData,setData,run,status,invite,openGame,editProfile}){
  let searchVersion=0,loadVersion=0,searchResults=null,searchQuery='',mutating=false;
  const act=(label,fn,style='secondary',symbol)=>button(label,()=>run(fn),style,symbol);
  const data=()=>getData()?.social||{people:[],invitations:[],outgoing:[],blocked:[]};
  const avatar=name=>node('span',(name||'?').slice(0,1).toUpperCase(),'avatar sage');
  const group=(title,items)=>{if(!items.length)return;const heading=node('div',undefined,'section-label');heading.append(node('h2',title),node('span',items.length,'small-note'));$('friend-list').append(heading,...items);};
  async function action(person,choice){
    if(mutating)return;mutating=true;++loadVersion;++searchVersion;const actor=getUser()?.id;
    const key=`wc-friend:${actor}:${person.id}:${choice}:${person.request_id||''}`;
    const operationId=localStorage.getItem(key)||crypto.randomUUID();localStorage.setItem(key,operationId);
    render();
    try{
      const {social}=await api({action:'friend_action',friendId:person.id,choice,requestId:person.request_id,operationId});
      localStorage.removeItem(key);if(getUser()?.id!==actor)return;
      ++loadVersion;setData({social});searchResults=null;searchQuery='';$('friend-search-input').value='';$('friend-search-submit').disabled=false;$('friend-search-status').textContent='';closeSheet();
      status(({request:'Friend request sent.',accept:'You are now friends.',decline:'Request declined.',cancel:'Request cancelled.',remove:'Friend removed.',block:'Player blocked.',unblock:'Player unblocked.'})[choice]);
    }finally{mutating=false;render();}
  }
  function options(person){
    const content=[node('p',formatFriendCode(person.friend_code),'friend-code')];
    if(person.status==='accepted')content.push(act('Remove friend',async()=>{if(await ask({title:`Remove ${person.display_name}?`,message:'Your games will stay. You can add each other again later.',label:'Remove friend',cancel:'Keep friend'}))await action(person,'remove');},'secondary full','user'));
    if(person.status==='pending'&&person.requested_by===getUser()?.id)content.push(act('Cancel request',()=>action(person,'cancel'),'secondary full','close'));
    content.push(act('Block player',async()=>{if(await ask({title:`Block ${person.display_name}?`,message:'They cannot find you or send you new friend or game invitations. Existing active games stay available; you can leave them from Game options.',label:'Block player',cancel:'Go back',danger:true,symbol:'shield'}))await action(person,'block');},'text-button danger full','shield'));
    showSheet(person.display_name,content);
  }
  function personRow(person,search=false){
    const box=node('div',undefined,'friend-row'),copy=node('div',undefined,'friend-copy');copy.append(node('strong',person.display_name));
    const incoming=person.status==='pending'&&person.requested_by!==getUser()?.id;
    if(search||person.status!=='accepted')copy.append(node('small',search?formatFriendCode(person.friend_code):incoming?'Wants to be your friend':'Request sent'));
    box.append(avatar(person.display_name),copy);let primary;
    if(person.status==='accepted'){
      const waiting=data().outgoing?.find(i=>i.recipient===person.id);
      primary=act(waiting?'Invited':'Invite',async()=>{if(waiting)await openGame(waiting.id);else {await invite(person);await refresh();}},waiting?'secondary friend-action':'primary friend-action',waiting?'check':'plus');
    }else if(incoming){
      primary=act('Accept',()=>action(person,'accept'),'primary friend-action','check');
      const decline=act('',()=>action(person,'decline'),'icon-button','close');decline.setAttribute('aria-label',`Decline ${person.display_name}'s friend request`);decline.disabled=mutating;box.append(decline);
    }else if(person.status==='pending')primary=act('Sent',()=>options(person),'secondary friend-action','check');
    else primary=act('Add',()=>action(person,'request'),'primary friend-action','user-plus');
    primary.disabled=mutating;box.append(primary);
    const more=act('',()=>options(person),'icon-button friend-more','more');more.setAttribute('aria-label',`Options for ${person.display_name}`);more.disabled=mutating;box.append(more);return box;
  }
  function render(){
    const {people}=data(),incoming=people.filter(p=>p.status==='pending'&&p.requested_by!==getUser()?.id);
    const badge=$('friends-badge'),count=incoming.length;badge.hidden=!count;badge.textContent=count>9?'9+':String(count);
    $('friend-list').replaceChildren();
    if(searchResults!==null){
      $('friend-search-results').replaceChildren(node('p',`Results for “${searchQuery}”`,'small-note'),...searchResults.map(p=>personRow(p,true)));
      if(!searchResults.length)$('friend-search-results').append(node('p','No players found. Check their display name or try their friend code.','friend-empty-note'));
      $('clear-friend-search').hidden=false;
    }else{$('friend-search-results').replaceChildren();$('clear-friend-search').hidden=true;}
    group('Requests',incoming.map(p=>personRow(p)));
    const friends=people.filter(p=>p.status==='accepted');group('Your friends',friends.map(p=>personRow(p)));
    if(!friends.length&&!incoming.length)$('friend-list').append(emptyState('Good words. Better company.','Find a friend above or share your friend code.','friends'));
    group('Sent requests',people.filter(p=>p.status==='pending'&&p.requested_by===getUser()?.id).map(p=>personRow(p)));
  }
  async function refresh(){if(mutating)return;const ticket=++loadVersion,actor=getUser()?.id,{social,profile}=await api({action:'friends'});if(getUser()?.id!==actor||ticket!==loadVersion)return;setData({social,profile});render();}
  async function search(){
    const query=$('friend-search-input').value.trim(),ticket=++searchVersion,actor=getUser()?.id;
    if(query.length<3){searchResults=null;render();status('Enter at least 3 letters or a friend code.',true);return;}
    $('friend-search-submit').disabled=true;$('friend-search-status').textContent='Searching…';
    try{const {people}=await api({action:'friend_search',query});if(ticket!==searchVersion||getUser()?.id!==actor)return;searchResults=people;searchQuery=query;render();}
    finally{if(ticket===searchVersion){$('friend-search-submit').disabled=false;$('friend-search-status').textContent='';}}
  }
  function showCode(){
    const profile=getData().profile,code=formatFriendCode(profile.friend_code),content=[node('p','Share this code so a friend can find you.'),node('p',code,'friend-code friend-code-large'),act('Copy friend code',async()=>{await navigator.clipboard.writeText(code);status('Friend code copied.');},'primary full','copy')];
    content.push(node('p',`Friends can search for “${profile.display_name}”. Your code helps them pick the right person when names match.`,'field-hint'));
    content.push(act('Edit display name',editProfile,'text-button full','edit'));
    if(data().blocked.length)content.push(act('Blocked players',()=>showSheet('Blocked players.',data().blocked.map(p=>{const b=node('div',undefined,'friend-row');b.append(node('strong',p.display_name),act('Unblock',()=>action(p,'unblock'),'secondary friend-action'));return b;})),'text-button full','shield'));
    showSheet('Your friend code.',content);
  }
  $('friend-search').onsubmit=e=>{e.preventDefault();void run(search);};
  $('clear-friend-search').onclick=()=>{++searchVersion;searchResults=null;searchQuery='';$('friend-search-input').value='';$('friend-search-status').textContent='';$('friend-search-submit').disabled=false;render();$('friend-search-input').focus();};
  $('friend-code-button').onclick=showCode;
  function reset(){++searchVersion;++loadVersion;searchResults=null;searchQuery='';$('friend-search-input').value='';$('friend-search-submit').disabled=false;$('friend-search-status').textContent='';}
  return {render,refresh,reset};
}
