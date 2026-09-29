// Run only to establish a NEW release snapshot; never overwrite an existing one.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), dest = path.join(root, 'server/versions');
fs.mkdirSync(dest, {recursive:true});
function create(name, text) { const p=path.join(dest,name); if(!fs.existsSync(p)) fs.writeFileSync(p,text); }
create('engine-v1.mjs', fs.readFileSync(path.join(root,'engine.js'),'utf8')+'\nexport default WordConquest;\n');
create('rules-v1.mjs', fs.readFileSync(path.join(root,'config.js'),'utf8')+'\nexport default GAME_CONFIG;\n');
const words = require('an-array-of-english-words').filter(w => /^[a-z]{3,69}$/.test(w));
const content = JSON.stringify([...new Set(words)].sort());
const hash = crypto.createHash('sha256').update(content).digest('hex');
create('dictionary-v1.json', content);
create('dictionary-v1.meta.json', JSON.stringify({version:'english-letterpress-v1-'+hash.slice(0,12),sha256:hash,words:words.length,source:'an-array-of-english-words@2.0.0',policy:'Exact lowercase ASCII entries, 3–69 letters. Inflections and slang accepted only when listed. No runtime stemming or additions. May contain offensive and archaic words; no family-safe claim.'},null,2));
const pkg=path.dirname(require.resolve('an-array-of-english-words/package.json'));
create('DICTIONARY-LICENSE.txt',fs.readFileSync(path.join(pkg,'license'),'utf8'));
console.log('Pinned version files are present. Existing snapshots were not overwritten.');
