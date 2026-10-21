// Presentation only: every section settles to the server receipt's exact totals.
export function scoreSections(plan){
  const sections=[],totals=[...plan.totalsBefore];
  for(const event of plan.events){
    const kind=event.kind==='loss'||event.kind==='final-territory'?'territory':event.kind;
    let section=sections.at(-1);
    if(section?.kind!==kind){section={kind,events:[],totalsBefore:[...totals]};sections.push(section);}
    section.events.push(event);totals[event.player-1]+=event.amount;section.totalsAfter=[...totals];
  }
  if(plan.castleCaptures?.length&&!sections.some(s=>s.kind==='castles')){
    const index=sections.findIndex(s=>s.kind==='territory'),at=index<0?sections.length:index;
    const before=at?sections[at-1].totalsAfter:plan.totalsBefore;
    sections.splice(at,0,{kind:'castles',events:[],totalsBefore:[...before],totalsAfter:[...before]});
  }
  return sections;
}

export function createScorePlayback({render,settle,complete}){
  let run=null;
  function cancel(){const old=run;run=null;old?.controller?.abort();}
  function finish(){if(!run)return;cancel();complete();}
  async function play(plan){
    cancel();const current={controller:null};run=current;
    try{
      for(const [index,section] of scoreSections(plan).entries()){
        if(run!==current)return;
        const controller=new AbortController();current.controller=controller;
        try{await render(section,controller.signal,index);}
        catch(error){if(!controller.signal.aborted)throw error;}
        if(run!==current)return;
        settle(section);
      }
      if(run===current)finish();
    }catch{if(run===current)finish();} // Saved state also wins after presentation errors.
  }
  return{play,cancel,skipSection:()=>run?.controller?.abort(),skipAll:finish};
}

export const DOUBLE_TAP_MS=400;
export function createScoreTap({section,all,now=()=>performance.now()}){
  let last=-Infinity;
  return{
    tap(){const time=now(),double=time-last<=DOUBLE_TAP_MS;last=time;if(double)all();else section();},
    get remaining(){return Math.max(0,DOUBLE_TAP_MS-(now()-last));}
  };
}
