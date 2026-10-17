# Scoring study — 18 October 2026

English-only, offline research. Production remains 0.11.2. No app, server,
dictionary, account or live-game changes are made by this harness.

## Four fixed configurations

1. **Current:** exact current English `autumn-v4`, including the current board and
   balanced joker placement. Letter values 1/2/4; length bonuses 0,1,3,6,10,15 for
   lengths 3–8, then +6 per letter; current land 1 and castles 3/5; castle income
   2/4 after both players move. The actual production engine is the control.
2. **Proposal:** bank +1 for each ordinary capture, including recaptures; no score
   deductions. Three starting ordinary tiles give 3 banked points. No castle
   capture or final ownership points. Income 2/4 only for the non-acting player's
   castles after each turn, including refreshes. A captured castle pays nothing
   until it survives a reply. No artificial payout after the game ends.
3. **First claim:** proposal, but ordinary tiles pay only once per player per tile.
   Starting tiles are marked claimed and credited. Both players can each earn a
   tile's point once; subsequent recaptures do not pay. This requires history.
4. **Words + castles:** proposal without any ordinary-tile points; starts at zero.
   Ordinary ownership still controls where words may start. All other board and
   move mechanics, including unrestricted captures, remain unchanged.

All new variants use bonus 0 through five letters, then 6:+1, 7:+3, 8:+5, 9:+7,
and +2 per extra letter. Jokers are zero-point letters and still count for length.
The new English letter tiers are an explicit design choice, not a validated
measure of spelling difficulty: 1 AEILNORSTU; 2 DG; 3 BCMP; 4 FHKVWY; 5 JQXZ.
The owner's “1…5 letter words” was interpreted as letter-point values. Ordinary
capture banking was the stated working interpretation of “no deductions”; the
alternatives test that uncertainty. Castle rates were retained at side 2/centre 4.

## Reproduce

Use Node 24 from the repository root. No new npm dependencies are required.

```powershell
node --test docs/research/scoring-2026-10-18/lab.test.mjs
node docs/research/scoring-2026-10-18/run.mjs --stage=main --seeds=256 --seedStart=20000
node docs/research/scoring-2026-10-18/run.mjs --stage=styles --seeds=64 --seedStart=21000 --matchups=balanced:words,balanced:castle,balanced:tempo
node docs/research/scoring-2026-10-18/run.mjs --stage=sparse --seeds=64 --seedStart=22000 --model=sparse
node docs/research/scoring-2026-10-18/run.mjs --stage=exhaustive --seeds=64 --seedStart=23000 --model=exhaustive --length=12
node docs/research/scoring-2026-10-18/run.mjs --stage=planner --seeds=24 --seedStart=24000 --matchups=planner:planner
node docs/research/scoring-2026-10-18/counterfactual.mjs
node docs/research/scoring-2026-10-18/audit.mjs
node docs/research/scoring-2026-10-18/summarize.mjs
python docs/research/scoring-2026-10-18/plot.py
node docs/research/scoring-2026-10-18/report.mjs
node docs/research/scoring-2026-10-18/verify.mjs
```

The runner refuses to overwrite an existing stage. Use a fresh research checkout
and output folder to reproduce the published seed ranges. Four local Node worker
threads are CPU processes, not AI agents or paid services. Tiny smoke games,
deterministic audit reruns and decision-source reruns are excluded from the 4,800
full-game count. The 1,536 continuations are counted separately.

The cached `work/balance/frequency.json` is generated with the previous study's
`docs/research/balance/vocabulary.py` and `wordfreq==3.1.1`. For a fresh checkout,
follow [the previous vocabulary setup](../balance/README.md). Cache and dictionary
SHA-256 values are recorded in results.json. The frequency cache is not published.
Plotting uses the existing `work/castle-income-deps` installation; its exact
requirements are in [castle-income/requirements.txt](../castle-income/requirements.txt).
Report generation uses no chart or web dependencies. Linkedom/esbuild used for
local presentation checks are not needed to reproduce the simulations.

## Opponents and sampling

The trie searches the actual pinned English dictionary intersected with a
wordfreq Zipf threshold of 3.5. Main/sparse/planner search up to 10 letters;
exhaustive searches up to 12. Main notices 12 unique word types, weighted by
`10^(0.35*(frequency-3.5))*exp(-0.35*(length-4))`; sparse notices eight with length
penalty 0.7. All discovered routes for those words are eligible. Exhaustive sees
all words in that familiar-word trie; it is not the entire legal dictionary.
Main word lengths around five are a rough convenience, not human calibration.

- Words bot: maximizes immediate word points; land resolves ties.
- Balanced: immediate word and land score swing, current payout changes and up
  to 1.5 estimated future castle payments; small joker-access preference.
- Castle: twice that future-income estimate and half the immediate land weight.
- Tempo: estimated score swing per letter, including current castle advantage.
- Planner: evaluates balanced/word/castle/tempo candidate paths under two sampled
  replacements and one balanced reply, then score difference plus up to one future
  castle payment. It cannot see the actual future random sequence.

Exact formulas and terminal handling are in lab.mjs. No coefficients were tuned
after inspecting results. Estimated future income does not simulate long-term
defence. The paired game uses exactly the same opening but swaps the starting
player. Policies stay in their physical seats; all matchups thus receive both
starting orders. Boards have balanced categories but different letters on each
side. Replacement RNG seeds are shared across variants, but divergent choices
consume and apply randomness differently; future boards are not identical.

Every selected move is submitted through the production engine for dictionary,
path, joker, ownership, replacement and lifecycle validation. The experimental
score adapter stays separate. Each current-rules move must reconcile exactly
with Engine.scores, experimental scores must never decrease, and word ledgers
must reconcile on every move. A 5,000,000-node search cutoff aborts the study;
none occurred. A separate full replay audits all 2,048 main games exactly and
counts physical difficult letters, excluding joker substitutions.

## Statistics and counterfactuals

Shares average each game's fraction of both players' combined final score.
Six components sum to 100%; enemy losses are not counted as extra positive
points. Average raw points are also supplied. Current ordinary/castle value is
final ownership; proposal ordinary points are banked capture rewards. Starting
points are included. Win shares count draws as half. Halfway uses the first
position at or beyond 60 spent letters, not a common round boundary.

95% intervals resample board-seed clusters (keeping both starts together), 2,000
times. They quantify sampling in the chosen bots, not human-behaviour uncertainty.
They are exploratory, without multiple-comparison correction. A greater share
of territory points is not itself evidence of better strategy or greater fun.

For each ruleset, counterfactuals use the first eight games with a qualifying
decision, starting at main seed 20000 and its alternate starter. A qualifying
decision is the first at 24–84 spent letters that sacrifices at least two word
points for a higher immediate land swing or castle-income opportunity. Both
that move and the best-word alternative get 24 independently seeded paired
continuations. Seeds and positions are selected before outcomes, not cherry-picked.
Intervals resample the 24 paired outcome differences per decision. They are noisy
and selection favours opportunities noticed by this bot, not all possible tactics.
Selected examples in the article are illustrative; all 32 are downloadable.

## Evidence and publication

- results.json: manifests, all aggregate rows, uncertainty and source hashes.
- games.json.gz: all 4,800 game records and move logs (synthetic players only).
- replays.json: eight complete main-study replays and states.
- decisions.json: all 32 counterfactual positions and 1,536 continuation outcomes.
- letter-audit.json: per-game physical letter counts and replay verification.
- distribution/fairness PNG and SVG: standalone exportable charts.
- index.html: responsive report with model selector and a board replay.

Vocabulary attribution: wordfreq 3.1.1, Robyn Speer / Elia Robyn Lake,
https://github.com/rspeer/wordfreq ; code Apache-2.0, underlying data includes
CC BY-SA 4.0 material and additional notices. See its NOTICE.md and the previous
study's attribution. Legal words remain the project's pinned Letterpress-derived
dictionary, whose source/license are documented in server/versions.

This measures automated play, not fun, frustration, real vocabulary, notification
timing or phone usability. The scoring tiers were changed together with bonuses
and income timing; effects cannot be attributed to one change in isolation.
No compensation rule for first/last move has been tested. Do not ship a fairness
fix based on these results alone. No paid infrastructure or ongoing cost is added.
