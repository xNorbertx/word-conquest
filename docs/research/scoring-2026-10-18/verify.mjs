import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root='docs/research/scoring-2026-10-18',read=f=>JSON.parse(fs.readFileSync(`${root}/${f}`)),data=read('results.json');
const games=JSON.parse(zlib.gunzipSync(fs.readFileSync(`${root}/games.json.gz`))),replays=read('replays.json'),decisions=read('decisions.json'),audit=read('letter-audit.json');
assert.equal(games.length,4800);assert.equal(games.reduce((n,g)=>n+g.turns,0),data.turns);assert.equal(data.turns,115790);assert.equal(data.cutoffs,0);assert.equal(data.continuations,1536);assert.equal(replays.length,8);
const seen=new Set();
for(const g of games){const id=[g.stage,g.variant,g.seed,g.flip,g.seats.join(':')].join('/');assert.ok(!seen.has(id));seen.add(id);assert.equal(g.moves.length,g.turns);assert.equal(g.turns%2,0);assert.ok(g.moves.at(-1).lettersUsed>=120);
 assert.equal(g.combined.total,g.scores[0]+g.scores[1]);assert.equal(g.combined.total,['letters','bonus','ordinary','castleValue','sideIncome','centreIncome'].reduce((n,k)=>n+g.combined[k],0));
 if(g.variant!=='current')assert.ok(g.moves.every(m=>m.delta.every(x=>x>=0)));if(g.variant==='castles_only')assert.equal(g.combined.ordinary,0);
}
for(const d of data.datasets){assert.ok(Math.abs(Object.values(d.shares).reduce((n,x)=>n+x,0)-1)<1e-10);const matching=games.filter(g=>g.stage===d.stage&&g.variant===d.id&&g.seats.join(':')===d.matchup);assert.equal(matching.length,d.games);const first=matching.reduce((n,g)=>n+(g.winner===0?.5:g.winner===g.starter?1:0),0)/matching.length;assert.equal(first,d.firstWin);}
for(const g of replays){assert.equal(g.states.length,g.row.turns+1);assert.equal(g.states[0].tiles.length,69);assert.equal(g.states[0].tiles.filter(t=>t.letter==='?').length,6);assert.equal(g.states[0].tiles.filter(t=>t.castle).length,5);assert.ok(g.states.at(-1).over);}
assert.equal(decisions.reduce((n,r)=>n+r.cases.length,0),32);for(const r of decisions)for(const c of r.cases){assert.equal(c.outcomes.length,24);assert.ok(c.chosen.points<=c.alternative.wordPoints-2);assert.ok(c.lettersUsed>=24&&c.lettersUsed<=84);}
assert.equal(audit.reduce((n,a)=>n+a.checkedGames,0),2048);for(const a of audit)assert.equal(a.rows.length,512);
for(const [path,hash]of Object.entries(data.sourceHashes)){const current=crypto.createHash('sha256').update(fs.readFileSync(path,'utf8').replaceAll('\r\n','\n')).digest('hex');assert.equal(current,hash,'Source hash '+path);}
const html=fs.readFileSync(`${root}/index.html`,'utf8');assert.ok(html.includes('width=device-width'));assert.ok(html.includes('physical-phone rendering remains unverified'));
for(const [,file]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|\.\.\/)/.test(file))assert.ok(fs.existsSync(`${root}/${file}`),'Missing report asset '+file);}
assert.ok(!html.includes('service_role'));assert.ok(!html.includes('BEGIN PRIVATE KEY'));
console.log('Verified 4,800 complete games, score conservation, zero deductions in new rules, 32 decision comparisons, 2,048 deterministic audits, source hashes and report assets.');
