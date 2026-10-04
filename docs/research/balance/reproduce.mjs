import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const source=JSON.parse(fs.readFileSync('docs/research/balance-2026-10-04.json')),stages=new Map(source.datasets.map(d=>[d.stage,d.manifest]));
for(const [stage,m]of stages){const args=[`--stage=${stage}`,`--variants=${m.chosen.join(',')}`,`--seeds=${m.seeds}`,`--seedStart=${m.seedStart}`,`--frequency=${m.minFrequency}`,`--length=${m.maxLength}`,`--noticed=${m.noticed}`,`--jobs=4`,`--matchups=${m.matchups.map(p=>p.join(':')).join(',')}`];execFileSync(process.execPath,['docs/research/balance/run.mjs',...args],{stdio:'inherit'});}
for(const script of ['counterfactual.mjs','endgame-examples.mjs','prepare-report.mjs','render-report.mjs'])execFileSync(process.execPath,['docs/research/balance/'+script],{stdio:'inherit'});
