import {node,button,showSheet} from './ui.js';
import {timeAgo,seatOf} from './presentation.mjs';
import {createMoveHistoryCache,moveHistoryRows} from './move-history.mjs';

export function createMoveHistory({api,getUser,getGame,getMoves,isPreview,stopMotion,replay,canReplay}){
  const cache=createMoveHistoryCache(api);
  function warm(){
    const actor=getUser()?.id,game=getGame();if(!actor||!game||isPreview())return;
    const state=cache.seed(actor,game,getMoves());
    if(state.needsTop&&!state.attempted)void cache.load(actor,game.id).catch(()=>{});
  }
  function show(){
    stopMotion();
    const actor=getUser()?.id,game=getGame(),id=game.id,names=[...game.names],seat=seatOf(game,actor);
    const content=node('div',undefined,'history-sheet'),table=node('table',undefined,'history-table'),head=node('thead'),heading=node('tr'),body=node('tbody');
    const labels=['Move','Word','Length','Castles','Total'];
    labels.forEach((label,i)=>{const th=node('th',label);th.scope='col';if(i===2)th.setAttribute('aria-label','Length bonus');heading.append(th);});head.append(heading);table.append(head,body);
    const note=node('p',undefined,'menu-note');note.setAttribute('role','status');note.hidden=true;
    const more=button('Older moves',()=>void load(true),'secondary full','history');more.hidden=true;
    let state=isPreview()?{moves:getMoves(),needsTop:false,hasMore:false}:cache.seed(actor,game,getMoves());
    function render(){
      body.replaceChildren();
      for(const move of state.moves)for(const row of moveHistoryRows(move)){
        const tr=node('tr',undefined,`history-${row.kind} side-${row.player}`),identity=node('th');identity.scope='row';
        identity.append(node('strong',row.label),node('small',`${row.player===seat?'You':names[row.player-1]}${row.kind==='move'?' · '+timeAgo(row.at):''}`));
        tr.append(identity);
        for(const field of ['word','bonus','castles','total'])tr.append(node('td',row[field]===0?'—':row[field]<0?'−'+Math.abs(row[field]):'+'+row[field],field==='total'?'history-total':undefined));
        body.append(tr);
      }
      more.hidden=!state.hasMore&&!state.needsTop;
      table.hidden=!state.moves.length;
      if(!state.moves.length&&!state.needsTop){note.hidden=false;note.textContent='No moves yet.';}
    }
    const current=()=>content.isConnected&&actor===getUser()?.id&&id===getGame()?.id;
    async function load(older=false){
      if(more.disabled)return;more.disabled=true;note.hidden=false;note.textContent='Loading moves…';
      try{const result=await cache.load(actor,id,{older});if(!current()||!result)return;state=result;note.hidden=true;render();more.replaceChildren(node('span','Older moves'));}
      catch{if(current()){note.hidden=false;note.textContent='Could not load moves.';more.hidden=false;more.replaceChildren(node('span','Retry'));}}
      finally{more.disabled=false;}
    }
    render();content.append(table,note,more);
    if(canReplay())content.append(button('Replay points',replay,'text-button full history-replay','refresh'));
    showSheet('Move history',content);
    if(!isPreview()&&state.needsTop)void load();
  }
  return {warm,show,reset:()=>cache.reset()};
}
