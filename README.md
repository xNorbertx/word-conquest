# Word Conquest

A territory word game with a preserved local prototype and a separate online implementation.

## Online web and Android pilot

The original root `index.html` still works without dependencies or accounts. The new
`online/` client uses the approved Autumn Sunday direction; Supabase supplies identity,
saved games and authoritative server turns. Capacitor packages the built web client.

- Owner actions, all in one place: [setup checklist](docs/SETUP.md).
- [Architecture and repository audit](docs/ARCHITECTURE.md).
- [Implemented work, checks and remaining release gates](docs/PROGRESS.md).
- [Run/deploy/backup/maintenance instructions](docs/OPERATIONS.md).
- [Privacy and dictionary policy](docs/PRIVACY.md).
- [Offline balance study: 33 setups, ratings and replays](docs/research/BALANCE-2026-10-04.md).
- [Castle income study: 3,248 games and score composition](docs/research/CASTLE-INCOME-2026-10-04.md).

Use Node 22+, `npm ci --ignore-scripts`, `npm test`, `npm run build`, then `npm run dev`.
Open `http://127.0.0.1:4173/online/`. Copy `online/config.example.js` to the ignored
`online/config.local.js` and enter public project connection details after setup.
Never put service keys, SMTP passwords or signing credentials in browser configuration.
Without a configured backend the online app shows a labelled visual preview, not fake
saved games. Root prototype mechanics below are unchanged.

The [web pilot](https://xnorbertx.github.io/word-conquest/online/) and Supabase backend
are deployed. Authentication email through Resend is verified. A directly installable
Android pilot is available in [Releases](https://github.com/xNorbertx/word-conquest/releases).
See [Android installation](docs/ANDROID.md) and [0.3.0 UX review](docs/UX.md). Hosted
36-turn and owner playtests passed; multi-day/device acceptance, backup restoration
and operational monitoring remain open. The local prototype below is unchanged.

### Usernames and Friends (0.6.2)

Friends replaces Activity in the bottom navigation. Search by username, send
a request, accept it, then use Invite beside a friend. Their game invitation
appears in Games and can trigger their enabled Android notifications. Only the
addressed friend can accept. Activity remains available under You.

Create an account with email and password. After confirmation/sign-in, a separate
screen asks you to choose a unique username or tap Randomize, then Continue.
Closing the app keeps setup unfinished until a name is saved; reopening or using
another device returns to that screen. Existing accounts retain their names.
The username is your displayed name. Uniqueness ignores case and normalizes Unicode
width and composition; names use 1–40 letters, numbers, spaces or simple punctuation.
You can change it under You, provided the new name is available. Signed-in players
can search usernames; unfinished accounts do not appear in friend search.
Friend codes still support sharing and exact lookup. My code includes blocked-player
management. Existing games, friendships and rules are unchanged.

### Castle income experiment (0.5.0)

New games use autumn-v3: side castles earn 2 points per complete round and the
centre earns 4. Final ownership values are 3 and 5. A round ends after both
players move, including the final round; earned income stays yours after loss.
The server randomly chooses and saves who starts, keeping colours fixed and
both players' turn counts equal. Unlimited captures remain enabled.

Both players should update the APK or reload the web app, then start a new game.
Existing autumn-v1/v2 games retain their original scoring and starting order.
How to play, score breakdowns and recaps explain the saved game's rules.
Dictionary, word bonuses, letter distribution, adjacency, jokers and the root
prototype are unchanged. Statistics remain separate by rules version.

## Play locally

Open `index.html` in a browser. Both players use the same screen. Drag across adjacent octagons, or click/tap letters individually, then submit. Keyboard users can Tab to tiles and press Enter or Space. Cancel clears the path; choosing the previous tile undoes one step.

The board has **69 octagons in a 9 × 9 grid with clipped corners**. All eight surrounding tiles are adjacent, including diagonals across the small gaps. Every tile has at least four neighbors, compared with three at the old square corners. This improves connectivity; it does not guarantee a useful word at every edge.

**Six jokers (?)** appear on each board: one in each player's starting territory and four spread through neutral land. Trace through them, then enter one A–Z letter for each selected joker in the fields below your word. Submit stays disabled until every joker is filled. Each joker's choice applies only to that move; it remains a joker after capture and can represent a different letter on later turns. Undoing a joker step, cancelling, submitting or resetting clears its choice.

**Dictionary validation is OFF by default.** Any legal path of at least three letters counts. Agree to use real English words when testing the word-finding experience. The yellow banner makes the limitation explicit. Letters use English frequency weights; there is no word-generation solver.

Start on your own territory. Use each tile at most once and **up to three enemy tiles per word**. All neutral/enemy tiles used become yours. Normal territory scores 1; castles score 3. There are **five castles: two north, one center, two south**. Bottom numbers on every tile show its letter value, including 0 for jokers. A castle marker sits beside that value; it does not change the letter value. Selected tiles have separate path-order numbers at the top.

The default game uses a **shared budget of 120 played letters**, rather than a fixed turn count. Every letter in a submitted word counts once, including jokers and letters on already owned territory. The initial board does not consume the budget. This is a usage threshold, not a literal bag of replacement tiles: full words and normal letter replacement continue even when crossing the threshold. If Player 1 exhausts it, Player 2 gets one final reply; if Player 2 exhausts it, the game ends immediately. Both players therefore finish with equal turn counts. Highest final total wins; equal totals draw. If you lose every territory, you may start anywhere to re-enter; enemy tiles still count toward the three-tile limit.

After a submitted word, **all ordinary letters in its path change**, including owned tiles and castles. Ownership is retained. Jokers stay wild. A replacement batch containing two or more ordinary letters includes at least one vowel and one consonant, and each replacement differs from that tile's previous letter. The log preserves the word you actually played. Letters elsewhere do not change.

**Refresh letters** replaces all ordinary letters you own instead of playing a word. It consumes one turn and one supply unit per replaced letter, with a minimum cost of three. It captures nothing and earns no word points. Its supply cost is shown before use. The confirmation lets you cancel without losing your selection, supply or turn. A player with no ordinary owned letters must play a word instead. Refresh is disabled at game end.

Words may repeat if you find them again, and zero-capture moves are allowed; used letters still change. Disconnected territory stays owned. Reloading the page or starting a new game resets progress; nothing is saved.

## Scoring

**Total = accumulated word points + current territory value.** Word points are permanent; territory points change with ownership. Starting scores are 0 word + 3 territory. Highest total at game end wins; equal totals draw with no territory tiebreaker.

Each submitted word earns the sum of its original tile values plus a length bonus:

| Tiles | Points each |
| --- | --- |
| A E I O U R S T L N | 1 |
| B C D F G H K M P V W Y | 2 |
| J Q X Z | 4 |
| Joker, regardless of the chosen letter | 0 |

| Word length | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- |
| Bonus | 0 | 1 | 3 | 6 | 10 | 15 |

Beyond eight letters, add six bonus points per extra letter. Jokers count toward length. Without jokers, CAT earns 4 word points, HOUNDS earns 14, and PIEHOLE earns 19. Letter values are measured before the path's letters refresh.

Normal controlled territory adds 1 point and a controlled castle adds 3. Capturing an enemy castle adds 3 territory points to you and removes 3 from the opponent; their banked word points stay intact. There is no separate permanent capture bonus or per-turn territory income. Zero-capture words still earn word points; refreshing earns no points. The score preview and move log distinguish your total increase from the opponent's territory loss. Historical log entries describe that move, not territory still held now.

Tune `GAME_CONFIG.wordScoring` independently from letter-generation settings: `letterGroups`, `jokerPoints`, the length-indexed `lengthBonuses` array, and `extraLetterBonus`. Territory values remain in `normalTerritoryPoints` and `castlePoints`. `scoreMove` is the shared preview/submission calculation; `scoreBreakdown` provides permanent word points, current territory and total.

## This experiment

- Independent opening letters with matching category budgets reduce starting luck without making the two sides copies. Territory shapes and castles remain symmetric; letters and joker positions are chosen independently. This does not guarantee equal word counts or remove first-player advantage.
- Fresh letters move some luck into each turn and break up repeated use of one fixed word. The refreshed letters are shared and may also help the opponent.
- Permanent word points reward long words and harder letters even when a short attack would capture more territory. This is a tunable experiment, not a proven balance.
- Three enemy captures make counterattacks larger: stealing three normal tiles changes the score difference by six points. Castles can make the swing larger. Whether this produces satisfying comebacks needs playtesting.
- A larger map and shared letter budget let longer words move the game toward its ending faster. Top and bottom castles provide objectives in both directions.
- Re-entry prevents total territory loss from leaving a player unable to take their remaining turns. It is an experimental comeback rule, not permanent protection.

These values and behaviors are provisional. In the next playtest, watch how often you refresh, whether late counterattacks can matter, and whether changing letters make planning feel too fragile.

## Constrained letter distribution

Generation categories are configured separately from scoring values:

| Category | Letters | Rule |
| --- | --- | --- |
| Vowels | A E I O U | Target 36% of each batch |
| Flexible consonants | R S T L N | Target 38% of each batch |
| Other consonants | B C D F G H K M P V W Y | Fill remaining positions |
| Rare / awkward | J Q X Z | None in bases or their immediate neighbors; at most one per outer-side batch |

The two sides receive matching category counts separately in their starting territories, the one-step neighborhood around them, and the rest of their half. Counts are rounded for each region. Within a category, letters are drawn using the existing English frequency weights, and positions are shuffled separately. Small batches of two or more letters always contain a vowel and a flexible consonant. A single-letter refresh samples a non-rare category at random.

Each player gets one randomly positioned starting joker. Neutral jokers are paired by distance from their respective starts, with independently chosen positions; matching mirrored positions are avoided when alternatives exist. The center column is shared and drawn separately.

Letter placement tries up to 24 arrangements and favors consonants with a neighboring vowel or joker, and rare letters separated from other rare letters. This is a bounded heuristic, not a guarantee that every tile forms an English word.

Both ordinary move refreshes and the refresh-turn action use the same category policy regardless of player. A rare letter has a 35% chance of inclusion in eligible batches, capped at one and at 8% of batch size, with a configurable minimum batch size of 10. With these defaults, integer rounding means batches below 13 letters contain no rare letters. Every replaced letter still differs from its previous value.

Dictionary-based comparison of actual available words is a later step; this iteration balances ingredients, not proven word opportunities.

## Change the experiment

Set `endCondition: 'letters'` and `letterBudget` to adjust the usage-based ending. Set `endCondition: 'turns'` to restore the existing `turnsPerPlayer` limit (12 by default). `refreshMinimumLetterCost` controls the minimum supply spent on refresh. `castleCount` defaults to 5; castle pairs alternate between north and south. The vowel target changed from 42% to 36%; rounding means a typical four-letter batch now gets one vowel instead of two, and a six-letter batch gets two instead of three.

- `config.js`: `GAME_CONFIG.letterBalance` holds the letter groups, target shares, rare-letter limits and placement attempt count. `letterWeights` controls relative frequency within each group. The remaining config includes `boardRadius`, `cornerCut`, `jokerCount`, `maxEnemyTilesPerWord`, `turnsPerPlayer`, `refreshUsedLetters`, `allowRefreshTurn`, `allowReentry`, scoring and dictionary toggle. Reload after edits. Radius 4 with corner cut 2 creates 69 tiles; cut 0 restores an 81-tile square. Use a positive radius, corner cut no larger than the radius, feasible territory/special counts, disjoint letter groups, and multiple positive-weight letters in each group so a refresh can draw a different letter.
- `engine.js`: DOM-free board generation, 8-way adjacency, path/word validation, capture, scoring, letter replacement, submission, refresh turns and turn advancement. `submit` and `refreshTurn` return a new state without mutating the old state. Joker assignments are a separate map of tile IDs to uppercase letters. Randomness is injectable for reproducible tests. Alter these functions for different capture or victory rules.
- `app.js`: SVG rendering, pointer/touch/keyboard selection, status and move log. Consumes the engine rather than defining the rules.
- `style.css`: responsive board and interface styles.

For a future word list, load a script defining `window.WORD_DICTIONARY = new Set([...lowercaseWords])` before `app.js`, then enable `dictionaryEnabled`. An enabled but missing dictionary blocks submissions rather than accepting everything silently.

Run the dependency-free checks with `node engine.test.cjs`, `node scoring.test.cjs`, and `node supply.test.cjs`.

## GitHub Pages

The deployed site publishes from the `gh-pages` branch. The original prototype
remains at the site root; the Supabase-backed app is at `/word-conquest/online/`.
Development source currently lives on `codex/async-friend-play`.

## Android pilot

[Download the Android pilot](https://github.com/xNorbertx/word-conquest/releases) from Releases > Assets; no GitHub sign-in is needed.

See [Android builds and push notifications](docs/ANDROID.md) for the verified APK,
automatic GitHub Actions builds, installation, local builds and device checks.
