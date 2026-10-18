# Final territory comparison — 18 October 2026

Follow-up to the [four-system scoring study](../scoring-2026-10-18/README.md).
Offline, English-only research; production scoring remains unchanged.

## The only rule difference

Both setups use the proposed five letter tiers, small length bonus, unlimited
captures, current 69-tile English board, six jokers, five castles and 120 shared
letters. Castles pay their owner only after surviving an opponent's turn: side 2,
centre 4. Refreshes count as turns. No castle capture points or special final
castle value. No ordinary capture rewards or midgame deductions. Both start at 0.

- **No territory:** final score is word points plus banked defended-castle income.
- **Final territory:** the same, plus 1 point per tile owned when the game ends.
  Ordinary, castle, joker and starting tiles all count equally. Neutral tiles do
  not count. The tally happens once; it is not paid during play or each round.

Counting every tile, including castles, was the stated interpretation of the
owner's request. Castles still have their normal defended income; their final
territory value is only the same 1 point as any other tile. Natural letter-budget
endings are tested; resignation and agreed-draw UI/lifecycle are not changed.

Letter values: 1 AEILNORSTU, 2 DG, 3 BCMP, 4 FHKVWY, 5 JQXZ, joker 0. Length
bonus: zero through five letters, then 6:+1, 7:+3, 8:+5, 9:+7, +2 thereafter.
Jokers still count for word length. The live game does not use these experimental
rules; they are adapters on top of its immutable engine.

## Reproduction

Node 24, from the repository root. The previous study's pinned wordfreq cache is
reused at work/balance/frequency.json; see its README for generating the cache.
The actual English legal dictionary remains the pinned Letterpress-derived list.
No npm dependency change or live-service access is needed.

```powershell
node --test docs/research/final-territory-2026-10-18/lab.test.mjs
node docs/research/final-territory-2026-10-18/run.mjs --stage=main --seeds=256 --seedStart=30000
node docs/research/final-territory-2026-10-18/run.mjs --stage=styles --seeds=64 --seedStart=31000 --matchups=balanced:words,balanced:castle,balanced:tempo
node docs/research/final-territory-2026-10-18/run.mjs --stage=sparse --seeds=64 --seedStart=32000 --model=sparse
node docs/research/final-territory-2026-10-18/run.mjs --stage=exhaustive --seeds=64 --seedStart=33000 --model=exhaustive --length=12
node docs/research/final-territory-2026-10-18/run.mjs --stage=planner --seeds=48 --seedStart=34000 --matchups=planner:planner
node docs/research/final-territory-2026-10-18/run.mjs --stage=full_weight --seeds=64 --seedStart=35000 --schedule=full
node docs/research/final-territory-2026-10-18/run.mjs --stage=late_weight --seeds=64 --seedStart=35000 --schedule=late
node docs/research/final-territory-2026-10-18/audit.mjs
node docs/research/final-territory-2026-10-18/summarize.mjs
python docs/research/final-territory-2026-10-18/plot.py
node docs/research/final-territory-2026-10-18/report.mjs
node docs/research/final-territory-2026-10-18/verify.mjs
```

Each stage refuses to overwrite existing results. Reproduce in a fresh checkout
or new output root. Plots reuse work/castle-income-deps (matplotlib 3.10.7), whose
requirements are recorded in the earlier castle-income study. Two local worker
threads run each stage; no AI subagents or paid services are involved.

## Controlled comparisons and policies

Each board seed is used for both setups and both starting players. Policies stay
in physical seats. Replacement RNG is paired, but different decisions consume
and apply it differently, so later boards can diverge. Seed ranges are new to
this follow-up. The no-territory control reproduces the previous harness.

Main/sparse/planner vocabulary: wordfreq Zipf >=3.5 intersected with the legal
dictionary, words up to 10 letters. Main samples 12 unique familiar word types,
using `10^(0.35*(frequency-3.5))*exp(-0.35*(length-4))`; sparse samples eight with
length penalty 0.7. Every legal route for noticed words is eligible. Exhaustive
uses all paths in that familiar vocabulary up to 12 letters, not the full legal
dictionary. Bots do not know the actual future replacement RNG.

Existing word, balanced, castle and tempo policies are retained. For the bonus
variant, the immediate expected value of a capture is augmented by its eventual
ownership swing (neutral +1, enemy +2) times a fixed retention estimate. The main
estimate ramps from 0.25 early to 1 near the end:
`0.25 + 0.75 * min(1, (lettersUsed + wordLength) / 120)^2`.
Castle-focused uses half this ownership weight; tempo divides it by word length;
words-first uses it only to break near ties. A guaranteed terminal move always
uses full ownership value. These are planning estimates, not interim score awards.

Two sensitivity schedules value land fully from the start, or only once 90 letters
have been spent. They use the same 64 seeds. Their 128 no-territory games are exact
repeated controls, excluded from the headline count of distinct games. Main,
mixed-style, sparse, exhaustive and planner use the ramp. No coefficients were
tuned after seeing outcomes. The planner tests up to four candidate paths under
two replacement samples and one reply; it then values the resulting score and
estimated future castle/territory potential. Terminal totals are exact.

## Accounting, uncertainty and endgame examples

Each move still goes through the production engine for legality, dictionary,
joker handling, ownership, replacement letters and natural game ending. The
prior experimental adapter supplies word points and defended-castle income.
This follow-up adds only a final ownership tally. Scores must never fall, no
territory points may appear before the end, and final points must equal owned
tile count exactly. No search cutoff is accepted (limit 5,000,000 nodes per turn).

The audit replays all 1,024 main games exactly. Eight full no-territory games
are also compared with the previous study's runner. It saves the first eight
fully terminal choices per setup where the selected word gives up >=2 word
points to the best-word alternative. The alternative is actually applied to
the same state; it must also finish the game. These comparisons are exact final
scores, not stochastic continuations or representative tactical-success rates.
The article may highlight an illustrative case; all saved examples are in audit.json.

Score shares average each game's fraction of both players' final scores. Starting
tiles count only at the end in the bonus variant. Side/centre incomes are recorded
separately. A final territory point changes the eventual score gap by two when an
enemy tile changes hands, even though no already-banked points are deducted.

95% intervals resample board-seed clusters 2,000 times, keeping both starters and
both rulesets paired for differences. They quantify sampling in these policies,
not uncertainty about human enjoyment or optimal play. No multiple-testing
correction. Attack is the fraction of word turns taking enemy land; late is
turns starting with >=90 letters already spent. Spatial sacrifice means choosing
>=2 fewer available word points with greater land swing or castle opportunity.

Halfway leader uses the displayed banked score just after reaching 60 spent
letters, without the unawarded final tally. A second projected-leader measure
includes current ownership as if the game ended then. Last-move reversal compares
the projected leader immediately before the final move with the winner. Adding
territory can change the winner/draw status on an already-played line; that is an
accounting observation, not a counterfactual replay under different decisions.

Published results.json contains manifests, metrics, paired intervals, source and
dictionary/cache hashes. games.json.gz contains all executed game records, with
repeated controls marked. replays.json supplies four complete main-study replays.
audit.json contains exact endgame alternatives. No account or live-game data is used.

Vocabulary attribution: wordfreq 3.1.1 by Robyn Speer / Elia Robyn Lake,
https://github.com/rspeer/wordfreq . Code Apache-2.0; data includes CC BY-SA 4.0
material and additional notices. The frequency cache is not redistributed. See
the preceding study's attribution and the project's dictionary license notices.

Implementation, mobile releases and rules migrations remain deferred. This is
research publication only, on the existing free hosting, with no new ongoing cost.
