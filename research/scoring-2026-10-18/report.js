(()=>{'use strict';
const data=window.STUDY,$=id=>document.getElementById(id),p=n=>(100*n).toFixed(1)+'%',f=n=>n.toFixed(1),names=Object.fromEntries(data.variants.map(v=>[v.id,v.name]));
const kinds=[['letters','Letter values','#46624d','white'],['bonus','Length bonus','#a4b591','#342a24'],['ordinary','Ordinary territory','#9b7558','white'],['castleValue','Castle value','#583c2b','white'],['sideIncome','Side income','#c29442','#342a24'],['centreIncome','Centre income','#e3c983','#342a24']];
const notes={main:'512 games per setup · 256 board seeds, each with both starting orders. Twelve sampled familiar words per move.',sparse:'128 games per setup. Eight sampled word choices with a stronger preference for short words. A limited-attention sensitivity, not measured human cognition.',exhaustive:'128 games per setup. All legal paths from the familiar-word vocabulary, up to 12 letters. This is a strong search model, not a typical human player.',planner:'48 games per setup. Each player tests up to four candidate paths against two sampled replacements and one reply. This is shallow planning, not optimal play.'};
function table(id,headers,rows){$(id).innerHTML='<thead><tr>'+headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((c,i)=>i?'<td>'+c+'</td>':'<th scope="row">'+c+'</th>').join('')+'</tr>').join('')+'</tbody>';}
function render(){
 const model=$('model').value,rows=data.datasets.filter(d=>d.stage===model);$('model-note').textContent=notes[model];
 $('legend').innerHTML=kinds.map(([,name,color])=>'<span><i class="swatch" style="background:'+color+'"></i>'+name+'</span>').join('');
 $('distribution').innerHTML=rows.map(r=>'<article><div class="dist-top"><h3>'+names[r.id]+'</h3><span>'+f(r.points.total)+' average total points</span></div><div class="bar" role="img" aria-label="'+names[r.id]+': '+kinds.map(([k,label])=>label+' '+p(r.shares[k])).join(',')+'">'+kinds.filter(([k])=>r.shares[k]>0).map(([k,label,color,ink])=>'<span class="segment" style="width:'+100*r.shares[k]+'%;background:'+color+';color:'+ink+'" title="'+label+': '+p(r.shares[k])+'">'+(r.shares[k]>=.06?p(r.shares[k]):'')+'</span>').join('')+'</div><div class="dist-summary"><span><b>'+p(r.shares.letters+r.shares.bonus)+'</b> words</span><span><b>'+p(r.territory)+'</b> territory & castles</span><span>'+f(r.averageLength)+' letters per word</span></div></article>').join('');
 table('points-table',['Rules',...kinds.map(k=>k[1]),'Total'],rows.map(r=>[names[r.id],...kinds.map(([k])=>f(r.points[k])+' ('+p(r.shares[k])+')'),f(r.points.total)]));
}
table('gameplay',['Main comparison','Current','Proposal','First claim','Words + castles'],[
 ['Attacking word turns',...data.datasets.filter(r=>r.stage==='main').map(r=>p(r.attackRate))],
 ['Castle ownership changes / game',...data.datasets.filter(r=>r.stage==='main').map(r=>f(r.castleFlips))],
 ['Spatial sacrifices',...data.datasets.filter(r=>r.stage==='main').map(r=>p(r.spatialSacrificeRate))],
 ['Halfway leader eventually wins',...data.datasets.filter(r=>r.stage==='main').map(r=>p(r.halfLeaderWin))],
 ['Words of 6+ letters',...data.datasets.filter(r=>r.stage==='main').map(r=>p(r.longWordRate))]
]);
table('opponents',['Balanced bot against…','Current','Proposal','First claim','Words + castles'],['words','castle','tempo'].map(policy=>[({words:'Words first',castle:'Castle first',tempo:'Score per letter'})[policy],...data.variants.map(v=>{const r=data.datasets.find(d=>d.id===v.id&&d.stage==='styles'&&d.matchup==='balanced:'+policy);return p(r.balancedWin)+' ['+r.balancedWinInterval.map(p).join('–')+']';})]));
$('model').addEventListener('change',render);render();
for(const v of data.variants)for(const flip of [false,true]){const option=document.createElement('option');option.value=v.id+'/'+flip;option.textContent=v.name+(flip?' · alternate starter':' · original starter');$('replay-choice').append(option);}
let replays=null,active=null;
async function load(){
 const button=$('load-replay');button.disabled=true;button.textContent='Loading…';
 try{if(!replays){const response=await fetch('replays.json');if(!response.ok)throw Error('Replay download failed');replays=await response.json();}
  const [id,flip]=$('replay-choice').value.split('/');active=replays.find(r=>r.id===id&&String(r.row.flip)===flip);if(!active)throw Error('Replay missing');
  $('turn').max=active.row.moves.length;$('turn').value=0;$('replay-content').hidden=false;draw();button.textContent='Restart replay';
 }catch(error){button.textContent='Retry loading replay';$('move-text').textContent=error.message;$('replay-content').hidden=false;}finally{button.disabled=false;}
}
function draw(){if(!active)return;const turn=Number($('turn').value),s=active.states[turn],previous=turn?active.states[turn-1]:s,m=turn?active.row.moves[turn-1]:null;
 const score=m?m.scores:(active.id==='castles_only'?[0,0]:[3,3]);$('replay-score').innerHTML=score.map((n,i)=>'<span><small>Player '+(i+1)+'</small><strong>'+n+'</strong></span>').join('');
 const path=m?.path||[],letters=new Map(path.map((pos,j)=>[pos,previous.tiles[pos].letter==='?'?m.word[j].toUpperCase():previous.tiles[pos].letter]));
 const fills=['#fffdf7','#a9b99a','#b68c6d'];
 let svg=s.tiles.map((t,i)=>{const x=t.q*52,y=t.r*52,points=Array.from({length:8},(_,j)=>{const a=(j*45+22.5)*Math.PI/180;return(x+25*Math.cos(a))+','+(y+25*Math.sin(a));}).join(' ');return '<g><polygon points="'+points+'" fill="'+fills[t.owner]+'" stroke="'+(path.includes(i)?'#342a24':'#d4ccbc')+'" stroke-width="'+(path.includes(i)?2.5:1)+'"/>'+(t.castle?'<rect x="'+(x-20)+'" y="'+(y-20)+'" width="40" height="40" rx="3" fill="none" stroke="#916c28" stroke-width="2.8"/>':'')+'<text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#342a24">'+(letters.get(i)||(t.letter==='?'?'':t.letter))+'</text></g>';}).join('');
 if(path.length)svg+='<polyline points="'+path.map(i=>s.tiles[i].q*52+','+s.tiles[i].r*52).join(' ')+'" fill="none" stroke="#342a24" stroke-width="3" opacity=".35" stroke-linecap="round" stroke-linejoin="round"/>';
 $('board').innerHTML=svg;$('board').setAttribute('aria-label','Board after move '+turn+(m?' — '+m.word:''));
 $('move-text').textContent=m?'Move '+turn+' / '+active.row.moves.length+' · Player '+m.player+' · '+(m.word?m.word.toUpperCase()+' · '+m.wordPoints+' word points':'Refresh')+' · Score changes: '+m.delta.map((x,i)=>'P'+(i+1)+' '+(x>=0?'+':'')+x).join(', ')+(s.over?' · Finished.':''):'Opening · Player '+s.startingPlayer+' starts.';
 $('previous').disabled=turn===0;$('next').disabled=turn===active.row.moves.length;
}
$('load-replay').addEventListener('click',load);$('replay-choice').addEventListener('change',()=>{if(replays)void load();});$('turn').addEventListener('input',draw);
$('previous').addEventListener('click',()=>{$('turn').value=Math.max(0,Number($('turn').value)-1);draw();});$('next').addEventListener('click',()=>{$('turn').value=Math.min(active?.row.moves.length||0,Number($('turn').value)+1);draw();});
})();
