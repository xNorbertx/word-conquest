# Reproduce the offline balance study

This harness is research, not an app bot or a production rules migration. It uses
`server/versions/engine-v1.mjs` and the v2 rule defaults without modifying them.
Experimental scoring/lifecycle adapters live only in `lab.mjs`. Nothing here
calls Supabase, Firebase, Resend, an owner account or a live game.

## Run

From the repository root, use Node 24 and Python 3.12+:

```powershell
python -m pip install --target work/balance-deps -r docs/research/balance/requirements.txt
python docs/research/balance/vocabulary.py
node --test docs/research/balance/lab.test.mjs
node docs/research/balance/reproduce.mjs
```

The first step downloads free packages from PyPI into an ignored research folder.
It does not change the app's npm dependencies. `reproduce.mjs` takes exact stages,
seed ranges, word limits and matchups from the checked-in result manifests, then
regenerates local logs, counterfactuals, examples, summary data and the HTML report.
It overwrites only generated outputs for this study. At most four local CPU
workers are used; these are ordinary simulation processes, not AI agents.

To run a new small experiment:

```powershell
node docs/research/balance/run.mjs --stage=my-study --variants=baseline,land2 --seedStart=9000 --seeds=10 --noticed=true --jobs=2
node docs/research/balance/summarize.mjs work/balance/my-study
```

Use a new stage name to preserve prior raw results. Configurations are in
`lab.mjs`; source changes require a new documented study rather than silently
relabeling results. The current JSON includes normalized source hashes and the
vocabulary-cache hash. It retains summaries, metadata and selected full replays;
all game/turn records remain in ignored `work/balance/<stage>/<variant>.json`.

Serve the self-contained HTML locally with
`node docs/research/balance/serve-report.mjs`, then open http://127.0.0.1:4176/.
The saved HTML also works as a standalone file without a backend or internet.

## Opponents and metrics

- **words:** maximum immediate word points; territory breaks ties.
- **land:** maximum immediate territory swing plus 0.25 × word points; small castle/joker preference.
- **balanced:** word points plus territory swing; a capped two-round estimate of
  income opportunities and small castle/joker access preferences. Maturity and
  majority-objective prototypes add their documented estimated future value.
- **tempo:** estimated score swing per letter, including current income advantage.
- **planner:** up to four candidate paths, including a best-word option; two
  sampled replacement/greedy-reply outcomes per candidate. It never sees the RNG
  used for actual subsequent replacements. This is shallow planning, not optimal play.

The exact functions, coefficients and tie handling are in `lab.mjs` and `run.mjs`.
New variant-specific agent tuning was not done. This can disadvantage unfamiliar
mechanics, especially income or defensive play.

A trie enumerates legal paths in the selected vocabulary. Each chosen move is
validated and scored by the real engine (with an explicit extra loss check for
mature enemy territory). The 2,000,000-node limit is recorded, and no recorded
study search hit it. Each board seed is paired with its horizontal mirror,
exchanging starting letter layouts and, in mixed matches, policy seats.
Different rules/board layouts may consume the same random seed differently;
this is not a promise of identical future letters across variants.

The limited-attention model selects **eight unique word types** with deterministic
weighted sampling. Weight = `10^(0.35 × (frequency − 3.5)) × exp(−0.7 × (length − 4))`.
All found routes for those words remain eligible. This is an artificial sensitivity
model, not measured human cognition. Exhaustive-familiar and full-dictionary
runs provide other bounds. The full-dictionary cache includes the game list's
3–12-letter words; the full-dictionary study searched at most 10 letters.

Territorial sacrifice: at least 2 fewer word points than the maximum, with at
least 3 more territory swing than the best territorial route among maximum-word
options. Territory swing = value acquired plus value removed from the opponent.
Metric averages give each complete game equal weight. Confidence intervals
resample seed clusters, preserving their mirror pairs; paired comparisons use
per-seed differences. They express simulation sampling uncertainty only.

Holding rewards/maturity resolve after player 2's move and require unbroken
ownership since the previous full-round boundary. Captures reset maturity;
one-time castle claims stay claimed for that player across subsequent recaptures.
No recurring holding payments occur in the maturity variant.

## Evidence and boundaries

The published study is **8,736 complete games / 33 variants / 215,748 turns**,
plus **640 continuations** from five predetermined qualifying positions. Tiny
harness smoke and verification reruns are excluded. Nine dedicated harness tests pass. The saved
SONG/PEACE and RULE/RUTH examples compare the final reply exactly; midgame
counterfactuals remain stochastic and dependent on subsequent policies.

Do not interpret the ratings as human enjoyment measurements or treat increased
capture rates as proof of better strategy. The report includes negative
counterfactuals, first-player concerns and model-dependent reversals. No online
rules, dictionary version, app build, APK or player data are changed by this work.
Because these files are under `docs/`, the existing APK workflow ignores them.

## Vocabulary source and attribution

Frequency proxy: **wordfreq 3.1.1**, by Robyn Speer / Elia Robyn Lake,
https://github.com/rspeer/wordfreq . Its code is Apache-2.0; its frequency data
contains CC BY-SA 4.0 material and additional source notices. See the package's
`NOTICE.md` and https://github.com/rspeer/wordfreq/blob/master/NOTICE.md . The full
frequency cache is not redistributed in this repository. Corpus frequency is
only a proxy for familiarity; the actual legal dictionary remains the existing
pinned Letterpress-derived list described in `docs/PRIVACY.md`.
