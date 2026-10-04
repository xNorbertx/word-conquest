import fs from 'node:fs';
const template=fs.readFileSync('docs/research/balance/report-template.html','utf8'),data=fs.readFileSync('docs/research/balance-2026-10-04.json','utf8');
fs.writeFileSync('docs/research/balance-2026-10-04.html',template.replace('__DATA__',data.replaceAll('<','\\u003c')));
console.log('Standalone report generated.');
