# A simpler scoring system — 18 October 2026

**My recommendation: human-test Words + defended castles against your proposal.**
The smaller length bonus and defended-castle timing are worth pursuing. Ordinary
capture points are the decision still worth making; first-claim bookkeeping is
not my recommendation. No new system is established as fair or more enjoyable.

Completed **4,800 full English games / 115,790 turns**,
plus **1,536 continuations** from 32 predetermined decisions.
All 2,048 main games were replayed exactly in a separate letter/accounting audit.
Ten research tests pass. No search was truncated. All figures below are bot-model
results, not human playtests. Live web, APK and backend rules remain unchanged.

## Where the points come from

512 main games per row: identical board seeds, both starting orders. Mean of each
game’s share of the combined final score; positive components sum to 100%.

| Rules | Letters | Length bonus | Ordinary land | Castle value | Castle income |
|---|---:|---:|---:|---:|---:|
| Current rules | 31.6% | 29.3% | 11.4% | 3.8% | 24.0% |
| Your proposal | 48.2% | 6.3% | 22.4% | 0.0% | 23.1% |
| First-claim territory | 50.1% | 6.4% | 19.4% | 0.0% | 24.1% |
| Words + defended castles | 61.7% | 7.7% | 0.0% | 0.0% | 30.6% |

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
