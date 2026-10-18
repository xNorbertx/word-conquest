import fs from 'node:fs';
const root='docs/research/castle-35-2026-10-18',r=JSON.parse(fs.readFileSync(root+'/results.json')),p=n=>(100*n).toFixed(1)+'%',f=n=>n.toFixed(1),names={no_territory:'2/4 · no final territory',final_territory:'2/4 + final territory',final_territory_35:'3/5 + final territory'};
const main=r.datasets.filter(d=>d.stage==='main'),old=main[1],fresh=main[2],change=r.paired.find(d=>d.stage==='main');
const pointRows=main.map(d=>[names[d.id],p(d.shares.letters+d.shares.bonus),p(d.shares.sideIncome+d.shares.centreIncome),p(d.shares.finalTerritory)]);
const metrics=[['Castle exchanges per game','castleFlips',f],['Castle defence payments per game','castleDefences',f],['Word moves capturing a castle','castleCaptureRate',p],['Word moves taking enemy land','attackRate',p],['Moves sacrificing word points for position','spatialSacrificeRate',p],['Average word length','averageLength',n=>n.toFixed(2)],['Halfway leader eventually wins','halfLeaderWon',p],['Last-move lead reversal','lastMoveReversal',p],['Starting player win share','firstWin',p]];
const gameplay=metrics.map(([label,key,format])=>[label,format(old[key]),format(fresh[key])]);
const stages=['main','sparse','exhaustive','planner','full_weight','late_weight'],labels={main:'Main',sparse:'Fewer words noticed',exhaustive:'Exhaustive familiar-word search',planner:'One-reply planning',full_weight:'Value land from the start',late_weight:'Value land near the end'};
const sensitivity=stages.map(stage=>[labels[stage],...['final_territory','final_territory_35'].map(id=>{const d=r.datasets.find(d=>d.stage===stage&&d.id===id);return p(d.shares.sideIncome+d.shares.centreIncome);})]);
const styles=['words','castle','tempo'].map(policy=>[({words:'Word-first',castle:'Castle-first',tempo:'Score per letter'})[policy],...['final_territory','final_territory_35'].map(id=>p(r.datasets.find(d=>d.stage==='styles'&&d.id===id&&d.matchup==='balanced:'+policy).balancedWin))]);
const table=(heads,body)=>'<thead><tr>'+heads.map(h=>`<th scope="col">${h}</th>`).join('')+'</tr></thead><tbody>'+body.map(row=>'<tr>'+row.map((c,i)=>i?`<td>${c}</td>`:`<th scope="row">${c}</th>`).join('')+'</tr>').join('')+'</tbody>';
const md=(heads,body)=>'| '+heads.join(' | ')+' |\n| '+heads.map((_,i)=>i?'---:':'---').join(' | ')+' |\n'+body.map(row=>'| '+row.join(' | ')+' |').join('\n');
const doc=`# Defended castles at 3 / 5 — 18 October 2026

**3/5 achieves the requested higher castle share. I would put it ahead of 2/4
for the next human test if a stronger castle game is the priority.** It is a
noticeable increase, not a tiny adjustment: castle income rises from 25.4% to
34.0% of main-model points. Words still supply 52.1%, final territory 14.0%.
The cost is a greater risk that an established castle lead becomes hard to catch.
Bot results do not establish human enjoyment or overall fairness.

Added **${r.newGames.toLocaleString('en-US')} new English games / ${r.newTurns.toLocaleString('en-US')} turns** on the previous seeds,
with both starting orders and all the same playing models. Combined comparison:
**${r.games.toLocaleString('en-US')} distinct games / ${r.turns.toLocaleString('en-US')} turns**. The 2,880 prior games are reused
exactly, not counted as newly run evidence. All 512 new main games passed an
independent move-by-move payout audit; twenty full control games reproduce the
earlier results. Sixteen research tests pass. No live scoring changes.

## The three setups

The existing two are retained. The third changes only defended-castle income
from side 2 / centre 4 to **side 3 / centre 5**, with the final territory rule
still enabled. Castles pay after surviving the opponent's action. No immediate
capture reward or special final castle bonus is added. Each castle counts as
one owned tile at the finish, exactly like ordinary, starting and joker tiles.
Neutral tiles count zero. Both players start at zero; no banked points are deducted.

Word points retain the proposed five letter tiers and length bonus starting at
six letters: 1, 3, 5, 7, then +2. Board, dictionary, six jokers, letter distribution,
unlimited captures and shared 120-letter/equal-turn ending are unchanged.

## Where the points come from

${md(['Setup','Words','Defended castles','Final territory'],pointRows)}

512 main games per setup. Shares average each game's fraction of both players'
combined final points. Rounding may sum to 100.1%. The paired castle-share
increase is **${f(change.castleShare.difference*100)} percentage points**, 95% interval
${change.castleShare.interval.map(n=>f(n*100)).join('–')}. Calculate changes before rounding the displayed shares.
The 3/5 castle-share interval alone is ${fresh.castleShareInterval.map(p).join('–')}.

Per game, the two players together average:

${md(['Points','2/4 + territory','3/5 + territory'],[['Words',f(old.points.letters+old.points.bonus),f(fresh.points.letters+fresh.points.bonus)],['Side income',f(old.points.sideIncome),f(fresh.points.sideIncome)],['Centre income',f(old.points.centreIncome),f(fresh.points.centreIncome)],['Final territory',f(old.points.finalTerritory),f(fresh.points.finalTerritory)],['Total',f(old.points.total),f(fresh.points.total)]])}

Castle income increases from 73.8 to 110.8 combined points, about 55.4 per player
with 3/5. It is not just a rescaling: players know the new values and can choose
different moves. The raw word-point total changes only slightly (166.7 to 165.0),
and final owned tiles remain almost identical (44.5 to 44.6). Their percentage
shares fall mainly because the overall score is larger, not because words or
ordinary territory disappear.

## More emphasis on side castles

Side income increases 50%, centre income 25%. A centre castle remains worth
more individually, but its relative premium falls from 2x to 1.67x a side castle.
Side castles contribute 17.3% -> 24.6% of total points; the centre 8.1% -> 9.3%.
Most of the extra scoring weight therefore goes to side castles, as intended.

Castle defence payments, counted independently of their point values, increase
from 30.9 to 32.8 events per game. Side events rise 24.9 -> 26.6; centre events
6.0 -> 6.2. An event is one owned castle surviving one opponent action; the same
castle can generate many events. This suggests a modest shift toward holding
side castles, not only bigger numbers on unchanged play.

## Gameplay comparison

${md(['Main-model metric','2/4 + territory','3/5 + territory'],gameplay)}

Castle exchanges increase by 0.61/game (paired interval +0.37 to +0.86).
Castle defence events increase by 1.91 (+1.40 to +2.42). Enemy-land attacks
decrease slightly by 1.16 percentage points (−2.22 to −0.07). These are separate
measures: more castle action does not mean more attacks everywhere.

Spatial sacrifices rise 22.7% -> 25.0%, but late spatial sacrifices remain
about 29.7% in both. A sacrifice means >=2 fewer available word points for
greater territory swing or castle opportunity. Word length barely changes,
5.06 -> 5.02 letters. These heuristics respond to the altered incentives; they
are not evidence that human decisions become more enjoyable.

Against other styles, the balanced bot's win share is:

${md(['Opponent','2/4 + territory','3/5 + territory'],styles)}

128 games per setup and matchup; draws count half. The increased penalty for
ignoring castles is consistent with the rule, but these fixed-policy win shares
are descriptive. The castle-first bot remains competitive with balanced play.

## The trade-off: fewer late reversals, possibly more durable leads

Main-model last-move reversals fall 9.7% -> 5.9%. Halfway banked leaders win
70.9% -> 74.4%; projected halfway leaders, including current territory, win
71.8% -> 75.7%. The average winning margin relative to the winner's score also
widens (15.9% -> 18.1%). Those observations are consistent with banked castle
income making established leads more durable. They do not prove an unavoidable
snowball: in the reply-planning model halfway leader wins instead fall from
77.3% to 70.2%. Bot style matters.

Starting-player win share is 52.1% -> 53.5% in the main model. Paired difference
+1.4 percentage points, interval −2.7 to +5.7; no established fairness change.
The 3/5 starter result is 59.4% with exhaustive familiar-word search and 57.8%
with one-reply planning. This does not solve starting-order balance.

## Sensitivity

${md(['Playing model','Castle share at 2/4','Castle share at 3/5'],sensitivity)}

The castle share increases in every model, but 34% is not universal. With fewer
noticed words, 3/5 produces **47.4% words / 38.8% castles / 13.7% final land**:
all board-related points together slightly outweigh words. With exhaustive
familiar-word search it is **73.7% / 13.2% / 13.0%**. Long words spend the shared
budget sooner, allowing fewer income payments. Reply-aware play is **51.1% /
35.0% / 13.9%**, close to the main split.

## Recommendation

For the requested direction, 3/5 is a credible next human-playtest choice. It
preserves one simple scoring rule while making castle control more consequential,
especially on the sides. I would stop increasing payouts here until real games
show whether early castle leads are recoverable. Prefer 2/4 if stronger comeback
potential and a clearer word-point majority matter more than castle emphasis.

The next human comparison should watch whether leaving a castle to make a good
word still feels sensible, whether side castles compete with the centre for
attention, and whether a losing player has plausible ways back. This is not an
implementation request: production rules, web app, APK and existing games remain
unchanged. A selected system would later need a new pinned rules version.

## Verification and limits

New stages: 512 main, 384 mixed styles, 128 sparse, 128 exhaustive, 96 planner,
128 full land valuation and 128 late land valuation games. Main bots notice
twelve sampled familiar words; sparse eight. Exhaustive considers all familiar
paths up to twelve letters, not the whole legal dictionary. Planner tests up to
four candidate paths, two replacement samples and one reply. Same fixed policy
coefficients, seeds, vocabulary and RNG scheme as the earlier study. No tuning
after outcomes and no knowledge of the actual future random letters.

Controls are byte/hash-verified against the previous study. The combined log has
4,512 executions, including 128 repeated controls excluded from distinct totals.
All games finish, no searches are truncated, scores never fall, and final land
is counted exactly once. The new main-game audit checks every 3/5 payout against
actual surviving ownership, not just aggregate score totals. Sixteen research
tests and twenty exact full-game control replays pass.

Intervals use 2,000 paired board-seed cluster bootstrap resamples, no multiple-
testing correction. They describe board sampling within fixed bots, not human
behaviour or optimal play. Natural endings only; no resignation/draw or touch-UX
simulation. All data are synthetic, with no user accounts or live-game records.

[Methods and reproduction](README.md), [results](results.json), [all game logs](games.json.gz),
[six complete replays](replays.json), [new payout audit](audit.json),
[score distribution chart](distribution.svg), [sensitivity chart](sensitivity.svg).
See the [previous final-territory report](../final-territory-2026-10-18/) for its
original findings and audit. Browser/device rendering is unavailable; report
logic, CSS and exported charts are checked, but phone appearance is not claimed
verified. Existing free hosting only; no new ongoing cost.
`;
fs.writeFileSync(root+'/FINDINGS.md',doc);fs.writeFileSync(root+'/report-data.js','window.STUDY='+JSON.stringify({variants:r.variants,datasets:r.datasets})+';\n');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf7ef"><title>Word Conquest — Castles at 3/5</title><link rel="stylesheet" href="report.css"><script defer src="report-data.js"></script><script defer src="report.js"></script></head><body>
<header><a class="brand" href="../../online/">WC <span>Word Conquest</span></a><nav aria-label="Report sections"><a href="#results">Results</a><a href="#verdict">Verdict</a><a href="#replay">Replay</a></nav></header><main>
<section class="hero"><p class="eyebrow">Expanded English scoring study · 18 October 2026</p><h1>A stronger reason<br>to defend castles.</h1><p class="intro">Side <strong>3</strong>, centre <strong>5</strong> raises castle income from <strong>25.4% to 34.0%</strong> of the score. Words still lead, but the balance moves noticeably toward holding the board.</p><div class="stats"><div><strong>1,504</strong><span>new games</span></div><div><strong>4,384</strong><span>distinct games compared</span></div><div><strong>34.0%</strong><span>main-model castle share</span></div></div><p class="quiet">The previous controls are reused exactly. Bot simulations, not human playtests. Live scoring is unchanged.</p></section>
<section><p class="eyebrow">The added version</p><div class="rule-grid"><article class="rule-card"><span class="number">01</span><h3>2 / 4</h3><p>Words and defended castles. No points for ordinary territory.</p></article><article class="rule-card"><span class="number">02</span><h3>2 / 4 + land</h3><p>The same, plus one final point for every owned tile.</p></article><article class="rule-card"><span class="number">03 · New</span><h3>3 / 5 + land</h3><p>Only the defence rate changes: side 3, centre 5. The final territory tally stays.</p></article></div><div class="rule-note"><strong>No extra final castle bonus.</strong><p>Castles earn income after surviving the opponent’s turn. At the finish they count as one owned tile, just like any other territory. No immediate capture reward or banked-score deductions.</p></div></section>
<section id="results"><div class="section-top"><div><p class="eyebrow">01 / Point distribution</p><h2>About half words.<br>A third castles.</h2></div><label class="select-label" for="model">Playing model<select id="model"><option value="main">Main comparison</option><option value="sparse">Fewer words noticed</option><option value="exhaustive">Exhaustive word search</option><option value="planner">One-reply planning</option><option value="full_weight">Value land from the start</option><option value="late_weight">Value land near the end</option></select></label></div><p id="model-note"></p><div id="legend" class="legend"></div><div id="distribution" class="distribution"></div><p class="quiet">Mean per-game shares of both players’ final points. 512 main games per setup. Rounded values may sum to 100.1%.</p><div class="table-scroll"><table>${table(['Main comparison','Words','Castles','Final land'],pointRows)}</table></div><details><summary>Exact score components</summary><div class="table-scroll"><table id="points-table"></table></div></details><p>The castle-share increase is <strong>8.5 percentage points</strong> before rounding, with paired 95% interval <strong>8.2–8.9</strong>. Average combined castle income rises from 73.8 to 110.8 points. Word points barely change: 166.7 to 165.0.</p><div class="download-row"><a href="distribution.svg" download>Chart · SVG</a><a href="distribution.png" download>PNG</a></div><noscript><img class="chart" src="distribution.png" alt="New 3/5 setup: 52.1% words, 34.0% castles, 14.0% final territory."></noscript></section>
<section><p class="eyebrow">02 / What changes in play</p><h2>More castle exchanges.<br>Not more attacks everywhere.</h2><div class="insight-grid"><article><h3>Side castles gain most.</h3><p>Side payouts rise 50%; centre payouts rise 25%. Side income grows from 17.3% to 24.6% of total points, centre income from 8.1% to 9.3%.</p></article><article><h3>Castles change hands more.</h3><p>Enemy-owned castle exchanges rise from 5.7 to 6.3 per game. Successful castle-defence payments rise from 30.9 to 32.8 events.</p></article><article><h3>Words remain worthwhile.</h3><p>Mean word length is almost unchanged: 5.06 versus 5.02 letters. Lower word-point share mostly reflects bigger castle payouts, not disappearing word scores.</p></article></div><div class="table-scroll"><table>${table(['Main comparison','2/4 + land','3/5 + land'],gameplay)}</table></div><p class="quiet">Both columns include final territory. Defence events count one castle surviving one opponent action. Spatial sacrifice gives up >=2 available word points for greater land or castle opportunity. Halfway leader uses banked points after 60 letters; final-move reversal uses projected territory and excludes tied pre-move scores.</p></section>
<section><p class="eyebrow">03 / Does it depend on the player?</p><h2>The increase persists.<br>The exact share varies.</h2><img class="chart" src="sensitivity.svg" alt="Castle share rises across all six playing models; 3/5 ranges from 13.2% with exhaustive word search to 38.8% with fewer noticed words." width="1000" height="620" loading="lazy"><p>One-reply planning gives <strong>51.1% words / 35.0% castles / 13.9% final land</strong>, close to the main result. With fewer noticed words, total board-related points slightly outweigh words. Strong word search still makes words dominate because long words leave fewer turns for castle income.</p><details><summary>Exact sensitivity results</summary><div class="table-scroll"><table>${table(['Castle share','2/4 + land','3/5 + land'],sensitivity)}</table></div></details><details><summary>Balanced bot against different playing styles</summary><div class="table-scroll"><table>${table(['Opponent','2/4 + land','3/5 + land'],styles)}</table></div><p class="quiet">Win shares, 128 games per setup and matchup; draws half. Fixed heuristics, not optimal players. Descriptive comparisons.</p></details></section>
<section id="verdict"><p class="eyebrow">04 / Recommendation</p><h2>3 / 5 is worth the next playtest.</h2><div class="verdict-list"><article class="recommended"><span class="badge">For a stronger castle game</span><h3>It does what you asked.</h3><p>Castle control becomes more consequential, especially on the sides. The main split—52% words, 34% defended castles, 14% final territory—is a credible balance for your direction. I would stop increasing payouts here until human games show how recoverable a castle lead feels.</p></article></div><div class="insight-grid"><article><h3>Leads may become harder to catch.</h3><p>Main halfway leaders win 74.4%, up from 70.9%. Last-move reversals fall from 9.7% to 5.9%. That fits a stronger banked-income game, though the reply-planning model does not show the same halfway-lead trend.</p></article><article><h3>Starting-order fairness stays open.</h3><p>Main starter wins are 53.5%, versus 52.1%. The paired uncertainty includes no change. Stronger word search gives the starter 59.4%; one-reply planning 57.8%.</p></article></div><p><strong>My preference:</strong> try 3/5 if you want castles to matter more. Keep 2/4 in the comparison if you prefer more comeback opportunities and a clearer word-point majority. Neither is proven more enjoyable from bot games.</p><p class="quiet">No production rule change, new APK or backend deployment is included in this research.</p></section>
<section id="replay"><p class="eyebrow">05 / Inspect the games</p><h2>Three setups.<br>The same opening.</h2><p>Six full replays: the first main-study seed, both starters, all three setups. Gold borders mark castles. The selected path shows the letters used; other tiles show the resulting board.</p><label for="replay-choice">Game</label><select id="replay-choice"></select><button id="load-replay" class="button" type="button">Load replay</button><div id="replay-content" hidden><div id="replay-score" class="replay-score"></div><p id="territory-preview" class="quiet"></p><svg id="board" viewBox="-240 -240 480 480" role="img" aria-label="Game board"></svg><div class="replay-controls"><button type="button" id="previous" aria-label="Previous move">←</button><label class="sr-only" for="turn">Move</label><input type="range" id="turn" min="0" value="0" step="1"><button type="button" id="next" aria-label="Next move">→</button></div><p id="move-text" aria-live="polite"></p></div></section>
<section><p class="eyebrow">06 / Evidence and limits</p><h2>Comparable, reproducible tests.</h2><p>1,504 new games and 37,138 new turns. The 2,880 previous distinct games are reused exactly, with published hashes checked. All 512 new main games were replayed to audit every payout. Twenty complete control games reproduce earlier results; sixteen rule tests pass. No truncated searches or unfinished games.</p><p>Same seeds, both starters, dictionary, board, letters and fixed playing policies. Bots adjust their castle valuations to 3/5, so this includes changed decisions. Main play samples twelve familiar words; the report also tests fewer words, exhaustive familiar search, one-reply planning and two land-valuation schedules.</p><p>Intervals resample paired board seeds 2,000 times. They describe sampling under these policies, not human enjoyment. No multiple-testing correction. Resignation, draws and phone interaction are outside this simulation.</p><div class="download-row"><a href="FINDINGS.md">Full findings</a><a href="README.md">Methods & reproduction</a><a href="results.json">Results JSON</a><a href="games.json.gz" download>All game logs · gzip</a><a href="audit.json">Payout audit</a><a href="replays.json">Replay data</a><a href="../final-territory-2026-10-18/">Previous comparison</a></div><p class="quiet rule-caption">4,512 logged executions include 128 repeated controls excluded from the distinct total. No player data. No new ongoing cost. Report logic and charts checked; physical-phone rendering unavailable.</p></section><footer>Word Conquest · Research only · Live scoring remains unchanged.</footer></main><noscript>Enable JavaScript for model switching and replays. Tables, charts and written findings remain available.</noscript></body></html>`;
fs.writeFileSync(root+'/index.html',html);console.log('Generated expanded three-setup report and written findings.');
