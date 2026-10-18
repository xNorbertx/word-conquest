# Defended castles at 3 / 5 — 18 October 2026

**3/5 achieves the requested higher castle share. I would put it ahead of 2/4
for the next human test if a stronger castle game is the priority.** It is a
noticeable increase, not a tiny adjustment: castle income rises from 25.4% to
34.0% of main-model points. Words still supply 52.1%, final territory 14.0%.
The cost is a greater risk that an established castle lead becomes hard to catch.
Bot results do not establish human enjoyment or overall fairness.

Added **1,504 new English games / 37,138 turns** on the previous seeds,
with both starting orders and all the same playing models. Combined comparison:
**4,384 distinct games / 108,026 turns**. The 2,880 prior games are reused
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

| Setup | Words | Defended castles | Final territory |
| --- | ---: | ---: | ---: |
| 2/4 · no final territory | 69.9% | 30.1% | 0.0% |
| 2/4 + final territory | 58.9% | 25.4% | 15.6% |
| 3/5 + final territory | 52.1% | 34.0% | 14.0% |

512 main games per setup. Shares average each game's fraction of both players'
combined final points. Rounding may sum to 100.1%. The paired castle-share
increase is **8.5 percentage points**, 95% interval
8.2–8.9. Calculate changes before rounding the displayed shares.
The 3/5 castle-share interval alone is 33.4%–34.6%.

Per game, the two players together average:

| Points | 2/4 + territory | 3/5 + territory |
| --- | ---: | ---: |
| Words | 166.7 | 165.0 |
| Side income | 49.8 | 79.9 |
| Centre income | 24.0 | 30.9 |
| Final territory | 44.5 | 44.6 |
| Total | 285.0 | 320.5 |

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

| Main-model metric | 2/4 + territory | 3/5 + territory |
| --- | ---: | ---: |
| Castle exchanges per game | 5.7 | 6.3 |
| Castle defence payments per game | 30.9 | 32.8 |
| Word moves capturing a castle | 38.5% | 41.1% |
| Word moves taking enemy land | 55.1% | 53.9% |
| Moves sacrificing word points for position | 22.7% | 25.0% |
| Average word length | 5.06 | 5.02 |
| Halfway leader eventually wins | 70.9% | 74.4% |
| Last-move lead reversal | 9.7% | 5.9% |
| Starting player win share | 52.1% | 53.5% |

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

| Opponent | 2/4 + territory | 3/5 + territory |
| --- | ---: | ---: |
| Word-first | 69.1% | 80.1% |
| Castle-first | 43.4% | 48.0% |
| Score per letter | 65.6% | 67.2% |

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

| Playing model | Castle share at 2/4 | Castle share at 3/5 |
| --- | ---: | ---: |
| Main | 25.4% | 34.0% |
| Fewer words noticed | 30.2% | 38.8% |
| Exhaustive familiar-word search | 9.7% | 13.2% |
| One-reply planning | 27.5% | 35.0% |
| Value land from the start | 24.7% | 32.9% |
| Value land near the end | 25.3% | 33.6% |

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
