import fs from 'node:fs';import {variants,rng} from './lab.mjs';
const mean=a=>a.length?a.reduce((a,b)=>a+b,0)/a.length:null;
export function summarize(games){
 const metric={games:games.length,seeds:new Set(games.map(g=>g.seed)).size};
 for(const key of ['turns','refreshRate','averageLength','averageWord','averageOptions','lowOptions','tradeoffRate','sacrificeRate','territorialSacrificeRate','attackRate','enemyCaptures','firstContact','jokerUse','multiJokerUse','farmRate','repeatRate','incomeShare','wordShare','landShare','normalizedMargin','reentries'])metric[key]=mean(games.map(g=>g[key]));
 metric.firstPlayerWin=mean(games.map(g=>g.winner===1?1:g.winner===0?.5:0));metric.noContact=mean(games.map(g=>+g.noContact));metric.earlyLeaderWon=mean(games.filter(g=>g.earlyLeaderWon!==null).map(g=>+g.earlyLeaderWon));
 const trailing=games.filter(g=>g.halfLead>=10);metric.comeback10=mean(trailing.map(g=>+g.comeback));metric.comeback10N=trailing.length;metric.cutoffs=games.reduce((n,g)=>n+g.cutoffs,0);
 metric.policy={};for(const p of ['words','balanced','land']){const mixed=games.filter(g=>g.seats[0]!==g.seats[1]&&g.seats.includes(p));metric.policy[p]={games:mixed.length,win:mean(mixed.map(g=>g.winnerPolicy===p?1:g.winnerPolicy==='draw'?.5:0))};}
 return metric;
}
export function intervalBySeed(games,key){const groups=new Map();for(const g of games){if(!groups.has(g.seed))groups.set(g.seed,[]);groups.get(g.seed).push(g[key]);}const means=[...groups.values()].map(mean),random=rng(159),samples=[];for(let i=0;i<1000;i++)samples.push(mean(means.map(()=>means[Math.floor(random()*means.length)])));samples.sort((a,b)=>a-b);return [samples[25],samples[974]];}
if(process.argv[1]?.endsWith('summarize.mjs')){
 const dir=process.argv[2]||'work/balance/screen',rows=[];for(const v of variants){const f=dir+'/'+v.id+'.json';if(!fs.existsSync(f))continue;const data=JSON.parse(fs.readFileSync(f));rows.push({id:v.id,name:v.name,...summarize(data.results)});}
 fs.writeFileSync(dir+'/summary.json',JSON.stringify(rows,null,2));console.table(rows.map(r=>({id:r.id,g:r.games,trade:Math.round(r.tradeoffRate*100),choose:Math.round(r.territorialSacrificeRate*100),attack:Math.round(r.attackRate*100),contact:r.firstContact.toFixed(1),length:r.averageLength.toFixed(1),rounds:(r.turns/2).toFixed(1),P1:Math.round(r.firstPlayerWin*100),margin:Math.round(r.normalizedMargin*100),comeback:Math.round(r.comeback10*100),income:Math.round(r.incomeShare*100),multiJ:Math.round(r.multiJokerUse*100),farm:Math.round(r.farmRate*100),refresh:Math.round(r.refreshRate*100),cut:r.cutoffs})));
}
