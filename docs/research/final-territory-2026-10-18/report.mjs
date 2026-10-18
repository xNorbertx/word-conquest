import fs from 'node:fs';
const root='docs/research/final-territory-2026-10-18',r=JSON.parse(fs.readFileSync(`${root}/results.json`)),a=JSON.parse(fs.readFileSync(`${root}/audit.json`));
const p=x=>(100*x).toFixed(1)+'%',f=x=>x.toFixed(1),rows=r.datasets.filter(x=>x.stage==='main');
const names={no_territory:'No territory bonus',final_territory:'+1 per final owned tile'};
const points=rows.map(x=>[names[x.id],p(x.shares.letters+x.shares.bonus),p(x.shares.sideIncome+x.shares.centreIncome),p(x.shares.finalTerritory)]);
const metrics=[['Word turns taking enemy land','attackRate',p],['Attacks in the final quarter','lateAttackRate',p],['Late spatial sacrifices','lateSpatialSacrificeRate',p],['Average word length','averageLength',f],['Castle ownership changes / game','castleFlips',f],['Halfway leader eventually wins','halfLeaderWon',p],['Last-move lead reversal','lastMoveReversal',p],['Starting player win share','firstWin',p]];
const gameplay=metrics.map(([label,k,format])=>[label,...rows.map(x=>format(x[k]))]);
const table=(heads,body)=>'<thead><tr>'+heads.map(h=>`<th scope="col">${h}</th>`).join('')+'</tr></thead><tbody>'+body.map(row=>'<tr>'+row.map((c,i)=>i?`<td>${c}</td>`:`<th scope="row">${c}</th>`).join('')+'</tr>').join('')+'</tbody>';
const mdTable=(heads,body)=>'| '+heads.join(' | ')+' |\n| '+heads.map((_,i)=>i?'---:':'---').join(' | ')+' |\n'+body.map(row=>'| '+row.join(' | ')+' |').join('\n');
const ex=a.find(x=>x.id==='final_territory').examples.find(x=>x.seed===30006),ep=ex.player-1,op=1-ep;
if(ex.chosen.word!=='titan'||ex.alternative.word!=='dish')throw Error('Illustrative example changed');
const exampleRows=[['Word points',ex.chosen.wordPoints,ex.alternative.wordPoints],['Your final territory',ex.chosen.parts[ep].finalTerritory,ex.alternative.parts[ep].finalTerritory],['Opponent final territory',ex.chosen.parts[op].finalTerritory,ex.alternative.parts[op].finalTerritory],['Final score (you : opponent)',ex.chosen.scores.join(' : '),ex.alternative.scores.join(' : ')],['Winning margin',ex.chosen.scores[ep]-ex.chosen.scores[op],ex.alternative.scores[ep]-ex.alternative.scores[op]]];
const styles=['words','castle','tempo'].map(policy=>[({words:'Words first',castle:'Castles first',tempo:'Score per letter'})[policy],...r.variants.map(v=>p(r.datasets.find(d=>d.id===v.id&&d.stage==='styles'&&d.matchup==='balanced:'+policy).balancedWin))]);
const findings=`# A point for the land you keep — 18 October 2026

**My recommendation: keep the final +1 per owned tile on the shortlist, and
prefer it over no territory bonus for the next human test.** It gives ordinary
land a simple purpose without letting territorial points dominate. The main
cost is a sharper, more swingy endgame. This is a design judgment from automated
play, not proof that humans will enjoy it more or that it fixes starting order.

Completed **${r.games.toLocaleString('en-US')} distinct full English games /
${r.turns.toLocaleString('en-US')} turns**. There were ${r.executions.toLocaleString('en-US')}
executions, including ${r.repeatedControls} deliberate repeated controls excluded
from that headline. All 1,024 main games were replayed exactly in a separate audit;
eight controls reproduce the prior harness. Nine research tests pass, no search
was truncated. No live app, APK, account, backend or saved-game changes.

## The only difference

Both setups score words with the proposed 1–5 letter tiers and small length
bonus. Side castles pay 2 and the centre 4 only after surviving an opponent's
turn. Refreshes count as turns. There are no castle capture points, special final
castle values, capture rewards or midgame deductions. Both start at zero.

The extra rule is **at the finish, add 1 for every tile you own**. Ordinary tiles,
castles, jokers and starting tiles all count equally. Neutral tiles give nothing.
The tally is paid once, not after each round. This study tests natural endings
under the existing shared 120-letter budget and equal-turn finishing rule.

## Where the points come from

512 main games per setup: 256 identical board seeds, each with both starters.
Mean of each game's share of both players' combined score. Rounded shares may
sum to 99.9 or 100.1. These are new seeds, so the baseline differs slightly from
the previous study; the underlying no-territory rules are the same.

${mdTable(['Setup','Words','Defended castles','Final territory'],points)}

With the bonus, the average combined totals are 166.7 word points, 73.8 castle
income and 44.5 final territory, or 285.0 in all. About 22.2 territory points per
player on average. Without it: 173.5 word points and 76.6 castle income, total
250.1. The difference is not simply +44.5: players choose different moves.
Only about 44.5 of the 69 tiles end owned; neutral tiles do not enter the tally.

The final territory share is 15.6%, with a 95% seed interval of 15.5–15.8%.
Across sparse-word, exhaustive familiar-word, reply-planning and alternate land
valuation models it stays between 13.7% and 15.7%. That robustness is useful;
the much narrower main interval does not describe uncertainty about human play.

## What changes in play

${mdTable(['Main comparison','No bonus','Final territory'],gameplay)}

Attacks rise by 12.3 percentage points (paired 95% interval +10.9 to +13.6).
Late attacks rise by 23.4 points (+20.7 to +25.9). Late choices that sacrifice
at least two available word points for greater land/castle opportunity rise
from 13.8% to 29.7%. These are decisions by land-aware heuristics, not independent
proof of enjoyment. Mean word length barely changes, and castle exchanges do
not clearly increase: +0.17/game, interval −0.17 to +0.50.

The final tally changes the winner/draw outcome in 9.0% of bonus games when
removed from the same played line. This is accounting, not a replay of what
players would have done without the rule. Last-move reversals rise from 3.7%
to 9.7% among non-tied pre-final positions, even when current territory is
included in the projected leader before that move. The swing is not just a
hidden tally finally becoming visible.

## An exact trade-off at the finish

Seed 30006, alternate starter, player 1. Both candidate moves end the game.
These are actual engine-applied alternatives, with no simulated future needed.

${mdTable(['Outcome','TITAN','DISH'],exampleRows)}

TITAN gives up four word points but improves the ownership margin by seven,
so the final winning margin is three points better. Both moves still win.
The low word values reflect the actual joker tiles on these paths; jokers score
zero. This example is selected from the first eight qualifying final choices,
not a claim that all territorial sacrifices are good. All sixteen saved choices
across both setups, paths and starting states are in audit.json.

## The awkward parts

**A final enemy steal is effectively a two-point swing.** You get +1 in your
eventual tally, and the opponent will receive one less. Neither banked score
goes down. This fits the no-deductions rule but preserves competitive swings.

**It rewards ownership at the finish, not long-term holding.** Land can be
strategically useful earlier as a starting position, but the new direct payment
encourages a late grab. Castle survival is still the sustained-holding reward.
The main final-move ownership swing rises from 3.4 to 5.4 points. If you want
ordinary territories to matter equally all game, this rule will not achieve that.

**It is not an established fairness fix.** Starter win share is 55.4% without
and 52.1% with the bonus, but the paired change is −3.2 percentage points with
interval −8.4 to +1.4. Zero is inside that interval. Reply-aware players still
give the starter 60.9% with the bonus; exhaustive familiar-word search gives
56.3%. Random starts do not prove fair opportunities within a game.

**More attacks do not automatically mean deeper strategy.** The balanced bot's
win share against the word-first bot is 70.3% without and 69.1% with the bonus.
Against castle-first: 40.6% and 43.4%; against tempo: 65.6% in both. The study
does not establish that the new rule rewards strategic skill more strongly.
Word-only play was already punished by defended castles.

## Recommendation and next decision

For your stated goal, I prefer words + defended castles + final territory.
It supplies a clear reason to care about ordinary land, costs one short rule,
and leaves words the biggest source of points. I would keep it at one point
for now. Increasing it is not supported by this comparison.

If implemented later, show a small separate prospective territory tally during
play, and animate it into the total at the finish. That makes the ending legible
without awarding points early. Human games should check whether late theft feels
exciting or arbitrary, and whether a good word is still worth giving up for land.
No production implementation or rules migration has been done.

## Method and limitations

Same boards, dictionary, letter distribution, six jokers, five castles and
120-letter ending in both setups; the actual immutable game engine validates
words, ownership and replacements. Main play notices 12 sampled familiar words;
sparse notices eight. Exhaustive searches all familiar paths up to 12 letters.
The planner samples up to four candidate paths, two replacements and one reply.
Policies do not see the actual future RNG. Different moves can produce different
later boards even with paired random streams.

Main: 1,024 games; mixed styles: 768; sparse: 256; exhaustive: 256; planner: 192;
full land valuation: 256; late land valuation: 128 new games plus 128 repeated
controls. Each board is played with both starters. Full and late valuation
sensitivity produce 15.7% and 15.3% territory shares; attack rates still rise.
All stages use fixed coefficients chosen before seeing outcomes. Bots are
heuristics, not optimal players or measured human cognition. Familiar vocabulary
uses the pinned wordfreq cache intersected with the legal English dictionary;
frequency is not a guarantee that a word is familiar or desirable.

Intervals use 2,000 paired board-seed cluster bootstrap resamples. They describe
sampled boards within these policies, not human enjoyment. No multiple-testing
correction. Halfway leader uses banked score at 60 letters; late means a move
starts at 90 or more. Last-move reversal uses projected ownership and excludes
tied pre-move scores. The report model selector exposes all sensitivity stages.

See [full methods and reproduction](README.md), [results](results.json),
[all executed game records](games.json.gz), [four complete replays](replays.json)
and [accounting audit / exact alternatives](audit.json). Exportable charts:
[distribution](distribution.svg), [gameplay](gameplay.svg).
The [previous four-system study](../scoring-2026-10-18/) remains available.

No accounts or live-game data were used. Existing free hosting only; no new
ongoing cost. Browser/device rendering was unavailable: report logic and CSS
were checked, and exported charts visually inspected. Phone appearance is not
claimed verified.
`;
fs.writeFileSync(`${root}/FINDINGS.md`,findings);
fs.writeFileSync(`${root}/report-data.js`,'window.STUDY='+JSON.stringify({variants:r.variants,datasets:r.datasets})+';\n');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf7ef"><title>Word Conquest — Final territory study</title><link rel="stylesheet" href="report.css"><script defer src="report-data.js"></script><script defer src="report.js"></script></head><body>
<header><a class="brand" href="../../online/">WC <span>Word Conquest</span></a><nav aria-label="Report sections"><a href="#results">Results</a><a href="#verdict">Verdict</a><a href="#replay">Replay</a></nav></header>
<main><section class="hero"><p class="eyebrow">English scoring follow-up · 18 October 2026</p><h1>A point for<br>the land you keep.</h1><p class="intro">Your idea is worth pursuing. A final <strong>+1 per owned tile</strong> makes ordinary land matter, while words still earn most of the points. The cost: a sharper endgame.</p><div class="stats"><div><strong>2,880</strong><span>distinct full games</span></div><div><strong>15.6%</strong><span>of points from final territory</span></div><div><strong>1,024</strong><span>main games replay-audited</span></div></div><p class="quiet">Automated play, not human playtests. Live scoring is unchanged.</p></section>
<section><p class="eyebrow">The comparison</p><div class="rule-grid"><article class="rule-card"><h3>Words + defended castles</h3><p>Your smaller length bonus and five letter-value tiers. Side castles earn 2, centre earns 4, after surviving an opponent’s turn.</p><p class="tag">No points for ordinary territory.</p></article><article class="rule-card"><h3>The same, plus a final tally</h3><p>At the end, every tile you own adds 1. Starting tiles, castles and jokers count equally. Neutral tiles give nothing.</p><p class="tag">One tally, once the game finishes.</p></article></div><p class="quiet rule-caption">Both start at zero. No capture rewards, special final castle values or midgame deductions. Existing English board, letters and game length retained.</p></section>
<section id="results"><div class="section-top"><div><p class="eyebrow">01 / Where the points come from</p><h2>Land matters.<br>Words still lead.</h2></div><label class="select-label" for="model">Playing model<select id="model"><option value="main">Main comparison</option><option value="sparse">Fewer words noticed</option><option value="exhaustive">Exhaustive word search</option><option value="planner">One-reply planning</option><option value="full_weight">Value land fully from start</option><option value="late_weight">Value land only near end</option></select></label></div><p id="model-note"></p><div id="legend" class="legend"></div><div id="distribution" class="distribution"></div><p class="quiet">Both players’ final scores combined, equal weight per game. Across the alternative models, final territory supplies 13.7–15.7%. Only about 44.5 of 69 tiles end owned in the main comparison.</p><details><summary>Exact score components</summary><div class="table-scroll"><table id="points-table"></table></div><p class="quiet">Mean points and mean per-game percentages differ slightly from dividing the averages. Rounding can leave totals 0.1% short.</p></details><div class="download-row"><a href="distribution.svg" download>Download chart · SVG</a><a href="distribution.png" download>PNG</a></div><noscript><img class="chart" src="distribution.png" alt="No bonus: 69.9% words, 30.1% castles. Final territory: 58.9% words, 25.4% castles, 15.6% territory."></noscript></section>
<section><p class="eyebrow">02 / What changes</p><h2>More reasons to take land.</h2><p>Attacks become more common, especially near the finish. Late moves that give up at least two word points for more land or castle opportunity rise from <strong>13.8% to 29.7%</strong>. Average word length barely changes.</p><img class="chart" src="gameplay.svg" alt="Attacks rise from 42.8% to 55.1%; late attacks 58.7% to 82.0%; last-move reversals 3.7% to 9.7%." width="1100" height="510" loading="lazy"><details><summary>Gameplay measurements</summary><div class="table-scroll"><table>${table(['Main model','No bonus','Final territory'],gameplay)}</table></div><p class="quiet">Late: turns starting after 90/120 letters spent. Halfway: banked leader after 60 letters. Last-move reversal: projected leader before the last move loses, including current ownership in that projection; tied positions excluded. Starter wins count draws as half.</p></details><p>The final tally changes the winner or draw in <strong>9.0%</strong> of the bonus games if you remove it from the same played moves. That is an accounting comparison; players would make different choices under different rules.</p></section>
<section><p class="eyebrow">03 / A real final-move choice</p><h2>A weaker word.<br>A better result.</h2><p>In this test position, <strong>TITAN</strong> gives up four word points versus <strong>DISH</strong>. It leaves you three more tiles and your opponent four fewer. That seven-point ownership swing makes your winning margin three points better.</p><div class="table-scroll"><table>${table(['At the finish','TITAN','DISH'],exampleRows)}</table></div><p class="quiet">Seed 30006, alternate starter, player 1. Both moves end the game; both still win. Word scores reflect the actual jokers used. One illustrative example from sixteen saved final-move comparisons, not a success-rate claim. <a href="audit.json">Inspect every saved example.</a></p></section>
<section id="verdict"><p class="eyebrow">04 / My verdict</p><h2>I prefer the final bonus.</h2><div class="verdict-list"><article class="recommended"><span class="badge">For the next human test</span><h3>Simple enough. Meaningful enough.</h3><p>It gives ordinary land a purpose without a capture-history rule or scores falling during play. About 59% words, 25% defended castles and 16% final territory is a promising balance for your goal. Keep the bonus at one point for now.</p></article></div><div class="insight-grid"><article><h3>The finish gets sharper.</h3><p>Stealing an enemy tile changes the eventual gap by two: one for you, one they will no longer receive. No banked points are deducted, but final grabs matter.</p></article><article><h3>It rewards the finish.</h3><p>Holding ordinary land early earns no direct payment. Castles remain the reward for holding over time. Expect more final-quarter attacks, not equally strong territory incentives all game.</p></article><article><h3>Fairness is still open.</h3><p>Starter wins fall from 55.4% to 52.1% in the main model, but the paired uncertainty includes no change. Reply-aware play still gives the starter 60.9%. This is not a proven fix.</p></article></div><p><strong>More attacks are not proof of deeper strategy.</strong> Against a word-first opponent, the balanced bot wins 70.3% without territory and 69.1% with it. Defended castles already reward attention to the map.</p><details><summary>Results against different playing styles</summary><div class="table-scroll"><table>${table(['Balanced bot against…','No bonus','Final territory'],styles)}</table></div><p class="quiet">128 games per setup and matchup. Draws count half. Fixed heuristics, not optimal players.</p></details><div class="rule-note"><strong>If we implement it later</strong><p>Show a small separate tally of prospective territory points, then count them into the total at the finish. Human-test whether last-turn theft feels exciting or arbitrary. This report does not change the app.</p></div></section>
<section id="replay"><p class="eyebrow">05 / Inspect the games</p><h2>Same opening.<br>Different decisions.</h2><p>Four full replays from the first main-study seed, with both starting orders. The highlighted path shows the letters used; other tiles show the resulting board. Gold borders mark castles.</p><label for="replay-choice">Game</label><select id="replay-choice"></select><button id="load-replay" class="button" type="button">Load replay</button><div id="replay-content" hidden><div id="replay-score" class="replay-score"></div><p id="territory-preview" class="quiet"></p><svg id="board" viewBox="-240 -240 480 480" role="img" aria-label="Game board"></svg><div class="replay-controls"><button type="button" id="previous" aria-label="Previous move">←</button><label class="sr-only" for="turn">Move</label><input type="range" id="turn" min="0" value="0" step="1"><button type="button" id="next" aria-label="Next move">→</button></div><p id="move-text" aria-live="polite"></p></div></section>
<section><p class="eyebrow">06 / How much to trust this</p><h2>Evidence, with limits.</h2><p>2,880 distinct games and 70,888 turns. Identical seed pairs and both starting orders. Nine rule tests and an exact audit of all 1,024 main games pass. There were 3,008 executions; 128 deliberately repeated controls are excluded from the headline.</p><p>The main bots notice twelve sampled familiar words, with checks for fewer words, exhaustive familiar-word search, one-reply planning and different estimates of whether land will survive. They use the real engine and legal dictionary, but are heuristics—not human players or optimal strategists.</p><p>Paired 95% intervals: attack increase <strong>+10.9 to +13.6 percentage points</strong>; starter win change <strong>−8.4 to +1.4 points</strong>. These describe sampled boards within this model, not human enjoyment. Coefficients were fixed before outcomes. No multiple-testing correction.</p><div class="download-row"><a href="FINDINGS.md">Full findings</a><a href="README.md">Methods & reproduction</a><a href="results.json">Results JSON</a><a href="games.json.gz" download>All game logs · gzip</a><a href="audit.json">Audit & alternatives</a><a href="replays.json">Replay data</a><a href="../scoring-2026-10-18/">Previous study</a></div><p class="quiet rule-caption">No player data used. No new ongoing cost. Report logic and exported charts checked; physical-phone rendering was unavailable.</p></section><footer>Word Conquest · Research only · Live scoring remains unchanged.</footer></main><noscript>Enable JavaScript for model switching and replays. Written findings and charts remain available above.</noscript></body></html>`;
fs.writeFileSync(`${root}/index.html`,html);console.log('Generated report, compact data and written findings.');
