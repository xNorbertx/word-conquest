import fs from 'node:fs';
const root='docs/research/scoring-2026-10-18',r=JSON.parse(fs.readFileSync(`${root}/results.json`)),audit=JSON.parse(fs.readFileSync(`${root}/letter-audit.json`));
const p=x=>(100*x).toFixed(1)+'%',f=x=>x.toFixed(1),names=Object.fromEntries(r.variants.map(v=>[v.id,v.name]));
const rows=r.datasets.filter(x=>x.stage==='main');
const rules=[
 ['Current rules','The live control','1/2/4 letter values and the large existing length bonus. Ordinary tiles are worth 1 while held; castles 3/5 while held. Both players collect castle income 2/4 at each round boundary. Scores can fall when land is lost.'],
 ['Your proposal','Bank captures, reward defence','Five letter tiers and your gentler bonus. Each ordinary capture banks +1, including recaptures. No deductions. Castles have no capture or final value: side +2 / centre +4 only after surviving an opponent’s turn.'],
 ['First-claim territory','Prevent repeated capture rewards','Same as your proposal, except each ordinary tile pays each player only once. Recaptures still change ownership and possible starting positions, but do not pay again. This needs a record of past claims.'],
 ['Words + defended castles','The simplest variation','Same letters, bonus and defended-castle payments, but no ordinary-tile points. Scores have only two sources: words and castles that survive. Ordinary land still matters because words must start on your territory.']
];
const mainTable=rows.map(x=>`| ${names[x.id]} | ${p(x.shares.letters)} | ${p(x.shares.bonus)} | ${p(x.shares.ordinary)} | ${p(x.shares.castleValue)} | ${p(x.shares.sideIncome+x.shares.centreIncome)} |`).join('\n');
const doc=`# A simpler scoring system — 18 October 2026

**My recommendation: human-test Words + defended castles against your proposal.**
The smaller length bonus and defended-castle timing are worth pursuing. Ordinary
capture points are the decision still worth making; first-claim bookkeeping is
not my recommendation. No new system is established as fair or more enjoyable.

Completed **${r.games.toLocaleString('en-US')} full English games / ${r.turns.toLocaleString('en-US')} turns**,
plus **${r.continuations.toLocaleString('en-US')} continuations** from 32 predetermined decisions.
All 2,048 main games were replayed exactly in a separate letter/accounting audit.
Ten research tests pass. No search was truncated. All figures below are bot-model
results, not human playtests. Live web, APK and backend rules remain unchanged.

## Where the points come from

512 main games per row: identical board seeds, both starting orders. Mean of each
game’s share of the combined final score; positive components sum to 100%.

| Rules | Letters | Length bonus | Ordinary land | Castle value | Castle income |
|---|---:|---:|---:|---:|---:|
${mainTable}

Current land/castle values are current ownership at the finish. New ordinary-land
points are banked rewards. Starting land contributes three points in current,
proposal and first-claim, zero in words + castles. Rounded shares can differ by 0.1.

## My verdict

**Current:** tactically active but too hard to explain. The length bonus alone
supplies 29.3% of total scores—nearly as much as actual letter values (31.6%).
The second player wins more often in the main model. It has the highest ordinary
attack rate and more reversals, so simplification does give something up.

**Your proposal:** a credible improvement, not a proven winner. Words supply 54.5%,
ordinary captures 22.4% and defended castles 23.1%. It removes score reversals and
makes survival meaningful. It still has three scoring sources, and repeated
recaptures supply 4.2% of total points. That is not evidence of a dominant exploit:
the balanced bot beat the tempo bot 81.3% of the time, counting draws as half.
The first-player result is 56.3% (95% seed interval 52.1–60.4%), so timing is not
automatically fair. Castle ownership changes are slightly lower than current,
5.3 versus 5.5 per game; it does not produce more tactical action on every measure.

**First claim:** I would drop this from the shortlist. It removes recapture rewards,
but adds an invisible “have I owned this before?” rule. Ordinary land still makes
up 19.4% of points. The main first-player result is 58.7%, and halfway leaders win
77.6% of non-tied halfway games. It offers little measured benefit for its extra
memory burden. That is a design judgment, not a formal causal comparison.

**Words + defended castles:** my preferred first human test, because two scoring
sources are easy to understand and the castle targets remain meaningful. Main
scores are 69.4% words / 30.6% castle income; castle ownership changes average 6.3,
the highest of the four. It has fewer ordinary attacks (47.2% of word turns versus
57.6% current) and may feel less like a broad territorial conquest. Halfway leaders
win 77.4% versus 68.7% current, so it does not solve snowballing. Its 53.8% starter
win share has interval 49.5–58.1%; exhaustive search raises that to 61.3%. Do not
declare it balanced from the main-model result.

## Strategy is more than a 50/50 score split

Balanced bots beat word-only bots in 70.3% of current games, 76.6% of proposal,
76.6% of first-claim, and 82.8% of words + castles (128 games per matchup; draws half).
These are fixed heuristics, not optimal players. The cleanest variant can therefore
have mostly word points and still punish ignoring the map.

Lower-word-score spatial moves occurred on 26.3%, 18.6%, 18.9% and 17.8% of main
word turns respectively. These rates depend on candidate sampling and the new point
scale; they are not a pure strategy ranking. Counterfactual continuations found
positive mean outcomes for 6/8, 5/8, 5/8 and 7/8 predetermined choices, but only
1/8, 2/8, 3/8 and 3/8 had positive individual 95% intervals. Many remain uncertain,
and some territorial choices were clearly worse. All 32 decisions are published.

For example, under your proposal SHOT (7 word points) versus FRAMED (10) improved
the acting player’s estimated final margin by 17.2 points, interval 1.8–31.2, over
24 paired continuations. In the clean variant READ (4) versus BASH (9) improved it
by 7.3, interval 1.8–13.0. But BLADDER (8) versus FILTERS (12) in that same variant
made it 16.0 worse, interval −25.8 to −7.1. These positions were selected before
outcomes; the examples here are illustrative, not the full sample.

## Difficult letters and long words

All new setups use 1: AEILNORSTU; 2: DG; 3: BCMP; 4: FHKVWY; 5: JQXZ, joker 0.
Bonus is zero through five, then 1/3/5/7 at six/seven/eight/nine, +2 thereafter.
These tiers are a transparent design choice, not an empirically calibrated scale.

Actual F/H/K/V/W/Y/J/Q/X/Z tiles went from 6.8% of played letters in current rules
to 9.5% in the proposal. Joker substitutions do not count. Physical J/Q/X/Z remained
below 0.1% in every setup: rewarding them more does not establish that players
can use them comfortably. The changes were bundled, so the tier change alone
cannot be credited for every observed difference. Mean word length only fell from
5.25 to 5.14 in the proposal; long words did not disappear.

## Sensitivity and fairness

With exhaustive familiar-word search, words supply 79.0%, 67.4%, 70.9% and 88.6%
respectively. Long words spend the 120-letter budget faster, leaving fewer castle
payments. The clean variant’s castle share falls from 30.6% to 11.4%. With fewer
noticed words it rises to 34.0%. Therefore a single distribution cannot represent
all players. The reply-aware sensitivity broadly preserves main-model score shares,
but is only 48 games per ruleset with a shallow, sampled one-reply search.

Paying after an opponent’s turn removes the simultaneous boundary reward but does
not equalize opportunities. The starter can hold and be paid on the final reply;
a castle taken on that final reply has no remaining turn to survive. Random starts
spread any advantage across matches; they do not fix it within a match. Future
tests should isolate terminal/payout symmetry before choosing a compensation rule.

I would first compare the proposal and words + castles in alternating-start human
games, watching whether ordinary expansion feels unrewarding and whether a castle
lead feels recoverable. I would not add an all-territory income stream or compensate
the starter from these results alone. Production implementation is deliberately
deferred, as requested; any later change must receive a new pinned rules version.

## Methods, limits and downloads

See [the full method and reproduction commands](README.md), [results](results.json),
[all game logs](games.json.gz), [replays](replays.json), [decisions](decisions.json)
and [letter audit](letter-audit.json). Exportable figures: [distribution](distribution.svg)
and [starting order](fairness.svg). The interactive report is [index.html](index.html).

Main: 2,048 games. Mixed styles: 1,536. Sparse vocabulary: 512. Exhaustive familiar
search: 512. Reply-aware: 192. Node 24, live engine and dictionary, actual current
opening, unchanged board/letter distribution, six jokers, five castles, 120 letters.
No new paid infrastructure. Search vocabulary uses the previous pinned wordfreq
cache; see README attribution. Frequency is a vocabulary proxy, not human knowledge.
No player accounts, emails, identifiers or live-game data are included.

Intervals describe seed sampling within this model, not uncertainty about human
behaviour. No multiple-testing correction; no claim of optimal bots or measured fun.
Rare-letter frustration, touch interaction and human strategy remain unmeasured.
Browser/device preview was unavailable; HTML logic, data and CSS were checked,
and exported charts were visually inspected. The report is responsive by design,
but physical-phone appearance is not claimed verified.
`;
fs.writeFileSync(`${root}/FINDINGS.md`,doc);
const compact={date:r.date,games:r.games,turns:r.turns,continuations:r.continuations,variants:r.variants,datasets:r.datasets,letters:audit.map(({rows,...a})=>a)};
fs.writeFileSync(`${root}/report-data.js`,'window.STUDY='+JSON.stringify(compact)+';\n');
const styleCards=rules.map((rule,i)=>`<article class="rule-card"><span class="number">0${i+1}</span><h3>${rule[0]}</h3><p class="tag">${rule[1]}</p><p>${rule[2]}</p></article>`).join('');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf7ef"><title>Word Conquest — Scoring study</title><link rel="stylesheet" href="report.css"><script defer src="report-data.js"></script><script defer src="report.js"></script></head><body>
<header><a class="brand" href="../../online/">WC <span>Word Conquest</span></a><nav aria-label="Report sections"><a href="#results">Results</a><a href="#verdict">Verdict</a><a href="#replay">Replay</a></nav></header>
<main><section class="hero"><p class="eyebrow">English scoring study · 18 October 2026</p><h1>A simpler score.<br>Still a strategic game.</h1><p class="intro">Your proposal is worth testing. The strongest simplification may be to score <strong>words and defended castles only.</strong> Here is what the simulations actually showed—and where they fell short.</p><div class="stats"><div><strong>${r.games.toLocaleString('en-US')}</strong><span>complete games</span></div><div><strong>${r.turns.toLocaleString('en-US')}</strong><span>turns played</span></div><div><strong>${r.continuations.toLocaleString('en-US')}</strong><span>decision continuations</span></div></div><p class="quiet">Automated play, not measured enjoyment. Research only; the live game is unchanged.</p></section>
<section id="results"><div class="section-top"><div><p class="eyebrow">01 / The point distribution</p><h2>What are we rewarding?</h2></div><label class="select-label" for="model">Playing model<select id="model"><option value="main">Main comparison</option><option value="sparse">Fewer words noticed</option><option value="exhaustive">Exhaustive word search</option><option value="planner">One-reply planning</option></select></label></div><p id="model-note"></p><div id="legend" class="legend"></div><div id="distribution" class="distribution"></div><p class="quiet">Both players’ final scores combined; each game has equal weight. Current territory is final ownership. New territory rewards are banked. Deductions are never counted as extra positive points.</p><details><summary>See the precise point breakdown</summary><div class="table-scroll"><table id="points-table"></table></div></details><div class="download-row"><a href="distribution.png">Open chart</a><a href="distribution.svg" download>Download SVG</a><a href="results.json" download>All results</a></div></section>
<section id="rules"><p class="eyebrow">02 / The four setups</p><h2>Exactly what was tested</h2><div class="rule-grid">${styleCards}</div><div class="rule-note"><strong>The shared new word score</strong><p>Letter values: <b>1</b> AEILNORSTU · <b>2</b> DG · <b>3</b> BCMP · <b>4</b> FHKVWY · <b>5</b> JQXZ. Jokers score zero. No length bonus through five letters; six earns +1, seven +3, eight +5, nine +7, then +2 per extra letter.</p><p>“No deductions” was tested as +1 banked per ordinary capture, including recaptures. Starting tiles give 3 points in that version and first-claim; words + castles starts at zero. All new castles pay 2/4 only after surviving a reply, including refresh turns. No castle capture points, no final castle bonus, no extra turn or payout after the finish.</p></div></section>
<section id="verdict"><p class="eyebrow">03 / My honest assessment</p><h2>Keep the good changes.<br>Question the extra scoring.</h2><div class="verdict-list">
<article><span class="badge muted">Control</span><h3>Current rules: too much machinery</h3><p>The length bonus makes up <strong>29.3% of all points</strong>, nearly as much as the letters themselves. Land can add to your score and remove from theirs, while castles add another payment. It creates tactical play, but asks players to follow too many overlapping rewards.</p><p class="caveat">It also has the highest ordinary attack rate and the most reversals here. Simplifying is a trade-off, not an improvement on every measure.</p></article>
<article><span class="badge">Worth testing</span><h3>Your proposal: cleaner, but not finished</h3><p>The <strong>54.5% words / 45.5% territory-and-castles</strong> split is appealing. Lower word scores can still be worthwhile for position. But ordinary recaptures generate <strong>4.2% of all points</strong>; the map can pay repeatedly without those points ever being lost.</p><p class="caveat">That is a design risk, not a demonstrated farming exploit: the balanced bot beat the short-word tempo bot in 81.3% of this matchup. Starter advantage still needs work.</p></article>
<article><span class="badge muted">I would drop it</span><h3>First claim: extra memory for little gain</h3><p>It removes repeat-capture rewards, but now players need to know which tiles have paid them before. Ordinary land still contributes <strong>19.4%</strong>. That is not enough improvement to justify another rule to explain and display.</p><p class="caveat">Main-model first-player wins rise to 58.7%, and halfway leaders win 77.6%. It did not solve the fairness or comeback concerns.</p></article>
<article class="recommended"><span class="badge">My first human test</span><h3>Words + defended castles</h3><p>Only two scoring sources. <strong>69.4% words / 30.6% castles</strong>, yet the most castle ownership changes in the main model: <strong>6.3 per game</strong>. Map-aware play beat the word-only bot 82.8% of the time. Strategy does not require half the points to come from land.</p><p class="caveat">Ordinary attacks fall, so broad conquest may feel less rewarding. Halfway leaders win 77.4%. Under exhaustive word search, castles supply only 11.4% and the starter wins 61.3%. This is the cleanest candidate, not a proven winner.</p></article></div></section>
<section id="play"><p class="eyebrow">04 / What changed in play?</p><h2>The map still matters</h2><div class="table-scroll"><table id="gameplay"></table></div><p class="quiet">Main model. “Spatial sacrifice” means giving up at least two available word points for a higher land swing or castle-income opportunity. It depends on the bot and point scale; it does not prove the move was good.</p><div class="insight-grid"><article><h3>Smaller bonuses did not kill long words</h3><p>Mean length changed from <strong>5.25 to 5.14</strong> under your proposal. The bonus share fell from <strong>29.3% to 6.3%</strong>. More of the word score comes from the actual letters.</p></article><article><h3>Harder letters became more attractive</h3><p>Physical F/H/K/V/W/Y/J/Q/X/Z tiles rose from <strong>6.8% to 9.5%</strong> of letters played. Joker substitutions are excluded. But J/Q/X/Z alone stayed below <strong>0.1%</strong> everywhere—five-point letters are too rarely used here to call that part balanced.</p></article></div><details><summary>Compare opponents with different priorities</summary><div class="table-scroll"><table id="opponents"></table></div><p>Each cell: balanced bot’s win share in 128 games, draws half. These are fixed heuristics, not optimal players. “Tempo” favours score per letter, which tests short-word income incentives.</p></details></section>
<section id="fairness"><p class="eyebrow">05 / The warning I would not ignore</p><h2>The first move still matters</h2><a href="fairness.png"><img class="chart" src="fairness.png" width="1530" height="884" alt="Starter win shares: current 38.9%, proposal 56.3%, first claim 58.7%, words plus castles 53.8%. Seed-cluster confidence intervals shown."></a><p>The new timing removes the round-boundary payout, but payment opportunities are still unequal. A castle captured on the final reply cannot survive another turn, while an earlier-held castle can pay after that reply. Randomizing the starter spreads an advantage across games; it does not fix a single match.</p><p><strong>I would not add compensation yet.</strong> First isolate end-of-game payout timing, then test with people. The chart’s intervals cover sampled boards under this model; they do not cover uncertainty about human behaviour.</p><a href="fairness.svg" download>Download fairness chart</a></section>
<section id="decisions"><p class="eyebrow">06 / Was the smaller word actually better?</p><h2>Sometimes yes. Sometimes no.</h2><p>I selected eight qualifying decisions per setup before seeing their outcomes, then played each chosen move and its best-word alternative through 24 paired continuations. These examples show both sides; all 32 decisions are downloadable.</p><div class="insight-grid"><article><span class="badge">Proposal · positive example</span><h3>SHOT instead of FRAMED</h3><p><strong>7 word points instead of 10.</strong> The spatial choice improved estimated final margin by 17.2 points. The individual 95% interval was +1.8 to +31.2.</p></article><article><span class="badge">Words + castles · positive</span><h3>READ instead of BASH</h3><p><strong>4 word points instead of 9.</strong> Estimated final margin improved by 7.3 points; interval +1.8 to +13.0.</p></article><article><span class="badge muted">Words + castles · negative</span><h3>BLADDER instead of FILTERS</h3><p><strong>8 word points instead of 12.</strong> Chasing position made estimated final margin 16.0 points worse; interval −25.8 to −7.1. The bot sometimes overvalues the map.</p></article></div><p>The chosen spatial move had a positive mean in 6/8 current, 5/8 proposal, 5/8 first-claim and 7/8 words + castles decisions. Only 1/8, 2/8, 3/8 and 3/8 respectively had positive individual intervals. The sample is small and most estimates are uncertain; these are not tactical success rates for all positions.</p><a href="decisions.json" download>Download all decisions and continuation outcomes</a></section>
<section id="replay"><p class="eyebrow">07 / Watch the scoring in context</p><h2>A game from each setup</h2><p>The same first board seed, using each starting order. These are predetermined examples, not best-looking games.</p><label for="replay-choice">Game<select id="replay-choice"></select></label><button id="load-replay" class="button">Load game replay</button><div id="replay-content" hidden><div id="replay-score" class="replay-score"></div><svg id="board" viewBox="-255 -255 510 510" role="img" aria-label="Replayed game board"></svg><div class="replay-controls"><button id="previous" aria-label="Previous move">←</button><input id="turn" type="range" min="0" value="0" aria-label="Move number"><button id="next" aria-label="Next move">→</button></div><p id="move-text" aria-live="polite"></p><p class="quiet">Sage = player 1 · walnut = player 2 · outlined squares = castles · blank tiles = jokers. The path shows the last word; letters shown are before replacement for that path.</p></div></section>
<section id="method"><p class="eyebrow">08 / Evidence and limits</p><h2>What this can—and cannot—tell us</h2><p>All games used today’s English board, its six jokers and five castles, the 120-letter budget, and the pinned legal dictionary. The current control is checked against the live engine after every move. The main study uses 256 boards twice each, with starters swapped, and 12 sampled familiar word choices per turn.</p><p>Other stages test fewer noticed words, exhaustive familiar-word search up to 12 letters, mixed opponents, and shallow reply planning. With exhaustive search the word share rises to 79.0%, 67.4%, 70.9% and 88.6% respectively. Longer words end games in fewer rounds, reducing castle payouts. A single pie chart is not a universal balance result.</p><p><strong>4,800 games, 115,790 turns, zero truncated searches.</strong> Ten research tests passed; all 2,048 main games were replayed exactly in a separate accounting and letter-use audit. The 1,536 decision continuations are additional and counted separately.</p><p>These bots do not measure fun, frustration or what people naturally notice. The changes are bundled, so this does not isolate the effect of each individual rule. Intervals are exploratory; no multiple-comparison correction. No live user data was used. No new costs or APK build.</p><p>Browser preview was unavailable in this session. The report’s data, controls and CSS were checked, and the exported charts inspected; physical-phone rendering remains unverified.</p><div class="download-row"><a href="FINDINGS.md">Full written findings</a><a href="README.md">Methods & reproduction</a><a href="games.json.gz" download>All game logs</a><a href="letter-audit.json" download>Letter audit</a><a href="https://github.com/xNorbertx/word-conquest/tree/codex/async-friend-play/docs/research/scoring-2026-10-18">Research source</a></div><p class="quiet">Vocabulary familiarity proxy: <a href="https://github.com/rspeer/wordfreq">wordfreq 3.1.1</a>, Robyn Speer / Elia Robyn Lake. Code Apache-2.0; data includes CC BY-SA 4.0 material and additional notices. Full cache not redistributed. Legal words use the project’s pinned Letterpress-derived list.</p></section>
<footer>Word Conquest · Research, not a game update · 18 October 2026</footer></main><noscript><p>This report includes static findings above. Enable JavaScript for the model comparison and replays, or open <a href="distribution.png">the score chart</a>.</p></noscript></body></html>`;
fs.writeFileSync(`${root}/index.html`,html);console.log('Generated report HTML, compact data and written findings.');
