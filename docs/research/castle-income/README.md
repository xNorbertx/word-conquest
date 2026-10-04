# Reproduce the castle income study

This is offline research. It changes no production rules and uses no accounts,
backend, credentials or paid services. The previous balance harness is imported
unchanged; the new adapter adds separate side/centre final values and payments.

Run from the repository root with Node 24 and Python 3.12. Prepare the vocabulary
using [the earlier study instructions](../balance/README.md) if its ignored
frequency cache does not already exist.

```powershell
node --test docs/research/balance/lab.test.mjs docs/research/castle-income/lab.test.mjs
node docs/research/castle-income/run.mjs --stage=main --seeds=64 --seedStart=8000 --jobs=3
node docs/research/castle-income/run.mjs --stage=styles --variants=current,flat_one,example,double,high --seeds=32 --seedStart=9000 --matchups=balanced:words,balanced:tempo,balanced:castle --jobs=3
node docs/research/castle-income/run.mjs --stage=expert --variants=current,flat_one,example,double,high --seeds=24 --seedStart=10000 --noticed=false --jobs=3
node docs/research/castle-income/run.mjs --stage=timing --variants=flat_one_held,example_held,double_held,high_held --seeds=64 --seedStart=8000 --jobs=3
node docs/research/castle-income/summarize.mjs
node docs/research/castle-income/audit.mjs
node docs/research/castle-income/write-report.mjs
python -m pip install --target work/castle-income-deps -r docs/research/castle-income/requirements.txt
python docs/research/castle-income/plot.py
```

The runner refuses to overwrite an existing stage. Use a fresh clone for exact
reproduction, or new stage names and adjust the analysis stage list for a new
study. Summary/report/chart generation replaces only this study's generated
artifacts. Three worker threads run deterministic local games, not AI agents.

All stages use the game dictionary's frequency-filtered vocabulary (Zipf >=3.5),
maximum nine letters. "noticed" is the eight-word artificial attention model
described in the report. Exhaustive uses all eligible words/routes. Mirror pairs
reverse letter layouts and exchange policy seats. Outcomes can consume later
replacement randomness differently after choices diverge.

Scores preserve six components for each player: words, ordinary territory, final
side castles, final centre castle, recurring side income and recurring centre
income. Castle final values replace normal territory value. Income pays both
players at the boundary after player 2's turn, including the final round.
The "held" variant requires continuous ownership since the previous boundary.
A capture/reset clock comes from the existing tested research adapter.

Raw turn logs stay in ignored work/castle-income/. The checked-in result JSON
contains all individual component scores, seeds, stage parameters, source/input
hashes and hashes of the complete raw files. Main figures average each game's
combined-player component fraction equally. Bootstrap intervals resample whole
seed clusters 2,000 times, keeping mirror pairs together.

The prose interprets the completed 4 October study. For different inputs, review
and update its narrative rather than blindly regenerating old conclusions.
