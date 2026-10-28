# Language-specific edge placement — 0.18.0

The chosen method rearranges a sampled letter pool rather than adding common
letters or changing score values. It improves neighbouring combinations using
separate English, Swedish and Dutch profiles. Vowel/consonant category positions,
per-side opening bands, exact letter counts, castles and jokers are preserved.
Replacement optimization can touch only letters replaced by that move/refresh.

Profiles intersect each pinned dictionary with wordfreq 3.1.1 (Robyn Speer),
Zipf >= 3.5, alphabetic 3–7-letter forms. Each word contributes once to letter
presence and undirected adjacent-pair counts. Pair strength is count(AB or BA)
divided by sqrt(count(A) * count(B)). The three strongest distinct neighbours
contribute to a tile's support; tile priority is 1 + (8 - degree) / 2. Up to three
same-category swap passes improve total quality. See the standalone report for
language exploration, examples, edge letter shares, alternatives and limitations.

The initial most-common-letter candidate was rejected: it reduced whole-board
choices. Edge-only pair optimization also sacrificed centre options. The chosen
conservative variant adds distinct-neighbour support across the whole board.
It does not promise to make every individual board or turn easier.

## Evidence

48 tuning seeds per language (2000–2047), eight candidates plus original.
256 held-out matched board pairs per language (50000–50255):

| Language | Edge-start words before → after | Change | Whole-board change |
|---|---:|---:|---:|
| English | 23.13 → 26.63 | +15.2% | +12.2% |
| Swedish | 19.09 → 21.47 | +12.5% | +10.5% |
| Dutch | 18.65 → 21.38 | +14.6% | +11.8% |

The solver counts unique words, at most one joker, no repeated tiles. Edge
starts exclude joker tiles and consider each perimeter tile as a potential
owned start, not an immediately accessible move. Separate opening-move metrics
enforce owned starts. Profile vocabularies: 7,746 English, 7,714 Swedish, 6,156 Dutch.

Another 64 pairs/language use Zipf >= 4.0. 72 complete engine games (12 matched
seeds/language, 80000–80011) exercise replacement/scoring/dictionary legality.
Mean per-turn choices rose about 14% English and 12% Dutch; Swedish fell about
2%. This small policy-dependent sample is a stress test, not evidence of human
speed. No forced refresh occurred; refresh behavior has separate regression
coverage. Production placement exactly matched the research algorithm on all
768 held-out boards. Raw metrics and game traces: [results.json](results.json).

## Reproduce

From the repository root with Node 24 and Python 3:

```text
python -m pip install --target work/balance-deps -r docs/research/balance/requirements.txt
python docs/research/edges-2026-10-28/profiles.py
node docs/research/edges-2026-10-28/evaluate.mjs 48 2000
node docs/research/edges-2026-10-28/evaluate.mjs 256 50000 diverseCategory
node docs/research/edges-2026-10-28/validate.mjs
node docs/research/edges-2026-10-28/report-data.mjs
python docs/research/edges-2026-10-28/render-report.py
```

Open `work/edges-report/index.html` directly. It is self-contained; no server,
analytics or network is required. It is not included in the app build or Pages
publication. Private frequency caches stay in ignored `work/edges`.

Source data and derived-profile licensing/credits are in
[EDGE-LETTERS-NOTICE.txt](../../../server/versions/EDGE-LETTERS-NOTICE.txt).
Profile data and measurements are CC BY-SA 4.0. Research code follows this repo's
code licensing. Dictionary acceptance and dictionary versions are unchanged.

## Integration

New games use `autumn-v6`, `autumn-sv-v5`, `autumn-nl-v2`. All prior snapshots and
their integrity hashes remain unchanged. Both clients need the current release
for a new-version game. Analytics includes both defended-castle generations.

The available-next outline uses the saved engine's incomplete-path validator.
It respects ownership, adjacency, reentry and old capture caps, without checking
whether the partial word is in a dictionary. Selected tiles/backtracking retain
their existing behavior; scoring and non-playable states hide the hints.
