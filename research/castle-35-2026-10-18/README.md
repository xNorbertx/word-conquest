# Defended castles at 3 / 5 — 18 October 2026

An additional setup in the [final-territory comparison](../final-territory-2026-10-18/README.md).
Offline English research only. No production rules, accounts or saved games change.

Three displayed setups:

1. Words + defended castles at side 2 / centre 4, no territory points.
2. The same, plus one final point per owned tile.
3. **New:** words + defended castles at side 3 / centre 5, plus one final point per owned tile.

The only new rule difference is the defended-castle rate. Side income increases
50%; centre income increases 25%. No immediate capture reward or special final
castle bonus is added. Castles count as one tile in the final territory tally.
Both players start at zero. Neutral tiles pay nothing. Refreshes are turns.
Defence pays after the opponent's action to the player who still holds the castle.

Words retain 1 AEILNORSTU / 2 DG / 3 BCMP / 4 FHKVWY / 5 JQXZ; joker zero.
Length bonus starts at six: 1, 3, 5, 7, then +2 per extra letter. Board, opening,
six jokers, dictionary, replacement distribution, unlimited captures and shared
120-letter/equal-turn natural ending all remain fixed.

## Reproduction

Run from the repository root using Node 24. Reuse the pinned wordfreq cache at
work/balance/frequency.json and actual English dictionary at
server/versions/dictionary-v1.json. See the previous study's attribution and
cache-generation instructions. No package installation or live access is needed.

```powershell
node --test docs/research/castle-35-2026-10-18/baseline.test.mjs docs/research/castle-35-2026-10-18/lab.test.mjs
node docs/research/castle-35-2026-10-18/run.mjs --stage=main --seeds=256 --seedStart=30000
node docs/research/castle-35-2026-10-18/run.mjs --stage=styles --seeds=64 --seedStart=31000 --matchups=balanced:words,balanced:castle,balanced:tempo
node docs/research/castle-35-2026-10-18/run.mjs --stage=sparse --seeds=64 --seedStart=32000 --model=sparse
node docs/research/castle-35-2026-10-18/run.mjs --stage=exhaustive --seeds=64 --seedStart=33000 --model=exhaustive --length=12
node docs/research/castle-35-2026-10-18/run.mjs --stage=planner --seeds=48 --seedStart=34000 --matchups=planner:planner
node docs/research/castle-35-2026-10-18/run.mjs --stage=full_weight --seeds=64 --seedStart=35000 --schedule=full
node docs/research/castle-35-2026-10-18/run.mjs --stage=late_weight --seeds=64 --seedStart=35000 --schedule=late
node docs/research/castle-35-2026-10-18/audit.mjs
node docs/research/castle-35-2026-10-18/summarize.mjs
python docs/research/castle-35-2026-10-18/plot.py
node docs/research/castle-35-2026-10-18/report.mjs
node docs/research/castle-35-2026-10-18/verify.mjs
```

The runner produces only the new 3/5 setup. It refuses to overwrite a stage.
Prior controls are reused exactly from work/final-territory-2026-10-18/ and
checked against their published raw hashes and compressed records. Reproduce
that earlier study first in a fresh checkout if those work files are absent.
Plots reuse the existing matplotlib 3.10.7 installation at work/castle-income-deps.

New games: main 512; mixed styles 384; sparse 128; exhaustive 128; planner 96;
full land valuation 128; late land valuation 128. **1,504 new games**, added to
**2,880 distinct previous games**. The combined log contains 4,512 executions;
128 repeated no-territory controls are marked and excluded from the distinct
total of 4,384. `reused` marks old games, not rerun as new evidence.

## Comparability and validation

Same board seeds, both starting players, noticed-word sampler, candidate paths
and replacement RNG scheme as before. Different moves may cause later boards
to diverge. The new rate is used in actual payouts, expected future income,
capture/denial valuation, tempo and reply planning. This is not just rescaling
old scores while leaving bots unaware of the higher reward.

The adapter uses the real immutable engine for legality, word score, ownership,
replacements and natural finish. The existing research adapter pays 2/4; the
new one adds exactly the rate difference for each surviving defender castle.
Unit tests check 3/5 payouts, both recipients, denial on capture, final timing,
no special terminal castle value, no deductions and unchanged board generation.
Parameterized 2/4 play must reproduce the original game records exactly.

All 512 new main games are independently replayed and checked move by move:
side increment = 3 times eligible side castles; centre increment = 5 times
eligible centre castles; actor gets no immediate defence payout; final territory
equals owned tile count and is zero earlier. Twenty complete control games from
main, planner, exhaustive, full and late stages must match the old runner.
The earlier 1,024-game audit is reused; do not count it as new experiments.

Main/sparse/planner notice 12/8/12 sampled word types from the legal dictionary
intersected with wordfreq Zipf >=3.5, maximum length ten. Main weight is
10^(0.35*(frequency-3.5))*exp(-0.35*(length-4)); sparse length penalty is 0.7.
Exhaustive searches all familiar paths up to length twelve, not all legal words.
Balanced, word-first, castle-first and score-per-letter policies are unchanged
except for the new rate. Planner samples four candidate policies, two replacement
outcomes and one reply. It has no knowledge of the actual future RNG.

Expected survival weight for final land is 0.25 + 0.75 * min(1,
(lettersUsed + wordLength) / 120)^2. Full valuation assumes every capture
survives; late valuation ignores land until 90 letters have been used. Terminal
moves always use the complete ownership swing. Coefficients are fixed before
outcomes, with no fitting to the new results. Maximum search nodes: 5,000,000;
any truncated search or incomplete game is an error.

## Reading the metrics

Shares average each game's fraction of both players' combined final points.
Castle defences count castle-payment events: divide side income by its rate and
centre income by its rate. One defended castle on two turns is two events.
This separates higher payouts from more holding. Castle flips count changes
from one player's ownership to the other, excluding first neutral claims.

Attack = word turn taking enemy land; late = turn starts at >=90 letters used.
Spatial sacrifice = at least two fewer available word points with greater
ownership swing or castle opportunity. Halfway leader uses banked score after
60 letters; last-move reversal uses the projected score including current land,
excluding tied pre-move positions. Starter win share counts draws as half.

Paired 95% intervals resample 2,000 board-seed clusters, retaining both starting
orders. These reflect board sampling under fixed policies, not human behaviour.
No multiple-testing correction. Mixed-style win shares are descriptive.
The audit also rescales 3/5 payouts on the same played line to 2/4; this is
descriptive accounting, never a claim about what the other policy would play.

No optimal-play or measured-enjoyment claim. Resignation, draws, touch UX and
real-user play are not simulated. The two historic studies remain unchanged.
This is research publication on the existing free host, no new ongoing cost.

Vocabulary: wordfreq 3.1.1, Robyn Speer / Elia Robyn Lake,
https://github.com/rspeer/wordfreq (Apache-2.0 code, data includes CC BY-SA 4.0
and additional notices). Frequency cache is not redistributed. Legal vocabulary
is the pinned Letterpress-derived dictionary; project licence notices apply.
