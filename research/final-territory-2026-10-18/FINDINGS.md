# A point for the land you keep — 18 October 2026

**My recommendation: keep the final +1 per owned tile on the shortlist, and
prefer it over no territory bonus for the next human test.** It gives ordinary
land a simple purpose without letting territorial points dominate. The main
cost is a sharper, more swingy endgame. This is a design judgment from automated
play, not proof that humans will enjoy it more or that it fixes starting order.

Completed **2,880 distinct full English games /
70,888 turns**. There were 3,008
executions, including 128 deliberate repeated controls excluded
from that headline. All 1,024 main games were replayed exactly in a separate audit;
eight controls reproduce the prior harness. Nine research tests pass, no search
was truncated. No live app, APK, account, backend or saved-game changes.

## The only difference

Both setups score words with the proposed 1–5 letter tiers and small length
bonus. Side castles pay 2 and the centre 4 only after surviving an opponent's
turn. Refreshes count as turns. There are no castle capture points, special final
castle values, capture rewards or midgame deductions. Both start at zero.

The extra rule is **at the finish, add 1 for every tile you own**. Ordinary tiles,
castles, jokers and starting tiles all count equally. Neutral tiles give nothing.
The tally is paid once, not after each round. This study tests natural endings
under the existing shared 120-letter budget and equal-turn finishing rule.

## Where the points come from

512 main games per setup: 256 identical board seeds, each with both starters.
Mean of each game's share of both players' combined score. Rounded shares may
sum to 99.9 or 100.1. These are new seeds, so the baseline differs slightly from
the previous study; the underlying no-territory rules are the same.

| Setup | Words | Defended castles | Final territory |
| --- | ---: | ---: | ---: |
| No territory bonus | 69.9% | 30.1% | 0.0% |
| +1 per final owned tile | 58.9% | 25.4% | 15.6% |

With the bonus, the average combined totals are 166.7 word points, 73.8 castle
income and 44.5 final territory, or 285.0 in all. About 22.2 territory points per
player on average. Without it: 173.5 word points and 76.6 castle income, total
250.1. The difference is not simply +44.5: players choose different moves.
Only about 44.5 of the 69 tiles end owned; neutral tiles do not enter the tally.

The final territory share is 15.6%, with a 95% seed interval of 15.5–15.8%.
Across sparse-word, exhaustive familiar-word, reply-planning and alternate land
valuation models it stays between 13.7% and 15.7%. That robustness is useful;
the much narrower main interval does not describe uncertainty about human play.

## What changes in play

| Main comparison | No bonus | Final territory |
| --- | ---: | ---: |
| Word turns taking enemy land | 42.8% | 55.1% |
| Attacks in the final quarter | 58.7% | 82.0% |
| Late spatial sacrifices | 13.8% | 29.7% |
| Average word length | 5.0 | 5.1 |
| Castle ownership changes / game | 5.5 | 5.7 |
| Halfway leader eventually wins | 75.5% | 70.9% |
| Last-move lead reversal | 3.7% | 9.7% |
| Starting player win share | 55.4% | 52.1% |

Attacks rise by 12.3 percentage points (paired 95% interval +10.9 to +13.6).
Late attacks rise by 23.4 points (+20.7 to +25.9). Late choices that sacrifice
at least two available word points for greater land/castle opportunity rise
from 13.8% to 29.7%. These are decisions by land-aware heuristics, not independent
proof of enjoyment. Mean word length barely changes, and castle exchanges do
not clearly increase: +0.17/game, interval −0.17 to +0.50.

The final tally changes the winner/draw outcome in 9.0% of bonus games when
removed from the same played line. This is accounting, not a replay of what
players would have done without the rule. Last-move reversals rise from 3.7%
to 9.7% among non-tied pre-final positions, even when current territory is
included in the projected leader before that move. The swing is not just a
hidden tally finally becoming visible.

## An exact trade-off at the finish

Seed 30006, alternate starter, player 1. Both candidate moves end the game.
These are actual engine-applied alternatives, with no simulated future needed.

| Outcome | TITAN | DISH |
| --- | ---: | ---: |
| Word points | 4 | 8 |
| Your final territory | 28 | 25 |
| Opponent final territory | 21 | 25 |
| Final score (you : opponent) | 178 : 153 | 179 : 157 |
| Winning margin | 25 | 22 |

TITAN gives up four word points but improves the ownership margin by seven,
so the final winning margin is three points better. Both moves still win.
The low word values reflect the actual joker tiles on these paths; jokers score
zero. This example is selected from the first eight qualifying final choices,
not a claim that all territorial sacrifices are good. All sixteen saved choices
across both setups, paths and starting states are in audit.json.

## The awkward parts

**A final enemy steal is effectively a two-point swing.** You get +1 in your
eventual tally, and the opponent will receive one less. Neither banked score
goes down. This fits the no-deductions rule but preserves competitive swings.

**It rewards ownership at the finish, not long-term holding.** Land can be
strategically useful earlier as a starting position, but the new direct payment
encourages a late grab. Castle survival is still the sustained-holding reward.
The main final-move ownership swing rises from 3.4 to 5.4 points. If you want
ordinary territories to matter equally all game, this rule will not achieve that.

**It is not an established fairness fix.** Starter win share is 55.4% without
and 52.1% with the bonus, but the paired change is −3.2 percentage points with
interval −8.4 to +1.4. Zero is inside that interval. Reply-aware players still
give the starter 60.9% with the bonus; exhaustive familiar-word search gives
56.3%. Random starts do not prove fair opportunities within a game.

**More attacks do not automatically mean deeper strategy.** The balanced bot's
win share against the word-first bot is 70.3% without and 69.1% with the bonus.
Against castle-first: 40.6% and 43.4%; against tempo: 65.6% in both. The study
does not establish that the new rule rewards strategic skill more strongly.
Word-only play was already punished by defended castles.

## Recommendation and next decision

For your stated goal, I prefer words + defended castles + final territory.
It supplies a clear reason to care about ordinary land, costs one short rule,
and leaves words the biggest source of points. I would keep it at one point
for now. Increasing it is not supported by this comparison.

If implemented later, show a small separate prospective territory tally during
play, and animate it into the total at the finish. That makes the ending legible
without awarding points early. Human games should check whether late theft feels
exciting or arbitrary, and whether a good word is still worth giving up for land.
No production implementation or rules migration has been done.

## Method and limitations

Same boards, dictionary, letter distribution, six jokers, five castles and
120-letter ending in both setups; the actual immutable game engine validates
words, ownership and replacements. Main play notices 12 sampled familiar words;
sparse notices eight. Exhaustive searches all familiar paths up to 12 letters.
The planner samples up to four candidate paths, two replacements and one reply.
Policies do not see the actual future RNG. Different moves can produce different
later boards even with paired random streams.

Main: 1,024 games; mixed styles: 768; sparse: 256; exhaustive: 256; planner: 192;
full land valuation: 256; late land valuation: 128 new games plus 128 repeated
controls. Each board is played with both starters. Full and late valuation
sensitivity produce 15.7% and 15.3% territory shares; attack rates still rise.
All stages use fixed coefficients chosen before seeing outcomes. Bots are
heuristics, not optimal players or measured human cognition. Familiar vocabulary
uses the pinned wordfreq cache intersected with the legal English dictionary;
frequency is not a guarantee that a word is familiar or desirable.

Intervals use 2,000 paired board-seed cluster bootstrap resamples. They describe
sampled boards within these policies, not human enjoyment. No multiple-testing
correction. Halfway leader uses banked score at 60 letters; late means a move
starts at 90 or more. Last-move reversal uses projected ownership and excludes
tied pre-move scores. The report model selector exposes all sensitivity stages.

See [full methods and reproduction](README.md), [results](results.json),
[all executed game records](games.json.gz), [four complete replays](replays.json)
and [accounting audit / exact alternatives](audit.json). Exportable charts:
[distribution](distribution.svg), [gameplay](gameplay.svg).
The [previous four-system study](../scoring-2026-10-18/) remains available.

No accounts or live-game data were used. Existing free hosting only; no new
ongoing cost. Browser/device rendering was unavailable: report logic and CSS
were checked, and exported charts visually inspected. Phone appearance is not
claimed verified.
