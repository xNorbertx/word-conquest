# Word Conquest

A small local two-player territory word game. Plain HTML, CSS and JavaScript; no dependencies, build step, backend or accounts.

## Play locally

Open `index.html` in a browser. Both players use the same screen. Drag across adjacent octagons, or click/tap letters individually, then submit. Keyboard users can Tab to tiles and press Enter or Space. Cancel clears the path; choosing the previous tile undoes one step.

The board has **69 octagons in a 9 × 9 grid with clipped corners**. All eight surrounding tiles are adjacent, including diagonals across the small gaps. Every tile has at least four neighbors, compared with three at the old square corners. This improves connectivity; it does not guarantee a useful word at every edge.

**Six jokers (?)** appear on each board: one in each player's starting territory and four spread through neutral land. Trace through them, then enter one A–Z letter for each selected joker in the fields below your word. Submit stays disabled until every joker is filled. Each joker's choice applies only to that move; it remains a joker after capture and can represent a different letter on later turns. Undoing a joker step, cancelling, submitting or resetting clears its choice.

**Dictionary validation is OFF by default.** Any legal path of at least three letters counts. Agree to use real English words when testing the word-finding experience. The yellow banner makes the limitation explicit. Letters use English frequency weights; there is no word-generation solver.

Start on your own territory. Use each tile at most once and **up to three enemy tiles per word**. All neutral/enemy tiles used become yours. Normal territory scores 1; castles score 3. Each player gets **12 turns**. Highest final score wins; equal scores draw. If you lose every territory, you may start anywhere to re-enter; enemy tiles still count toward the three-tile limit.

After a submitted word, **all ordinary letters in its path change**, including owned tiles and castles. Ownership is retained. Jokers stay wild. A replacement batch containing two or more ordinary letters includes at least one vowel and one consonant, and each replacement differs from that tile's previous letter. The log preserves the word you actually played. Letters elsewhere do not change.

**Refresh letters** replaces all ordinary letters you own instead of playing a word. It consumes one turn and captures nothing. The confirmation lets you cancel without losing your selection or turn. A player with no ordinary owned letters must play a word instead. Refresh is disabled at game end.

Words may repeat if you find them again, and zero-capture moves are allowed; used letters still change. Disconnected territory stays owned. Reloading the page or starting a new game resets progress; nothing is saved.

## This experiment

- Independent opening letters with matching category budgets reduce starting luck without making the two sides copies. Territory shapes and castles remain symmetric; letters and joker positions are chosen independently. This does not guarantee equal word counts or remove first-player advantage.
- Fresh letters move some luck into each turn and break up repeated use of one fixed word. The refreshed letters are shared and may also help the opponent.
- Three enemy captures make counterattacks larger: stealing three normal tiles changes the score difference by six points. Castles can make the swing larger. Whether this produces satisfying comebacks needs playtesting.
- A larger map and 12-turn limit are intended to keep expansion meaningful without a long stale ending.
- Re-entry prevents total territory loss from leaving a player unable to take their remaining turns. It is an experimental comeback rule, not permanent protection.

These values and behaviors are provisional. In the next playtest, watch how often you refresh, whether late counterattacks can matter, and whether changing letters make planning feel too fragile.

## Constrained letter distribution

Letter categories affect generation only, never scoring:

| Category | Letters | Rule |
| --- | --- | --- |
| Vowels | A E I O U | Target 42% of each batch |
| Flexible consonants | R S T L N | Target 34% of each batch |
| Other consonants | B C D F G H K M P V W Y | Fill remaining positions |
| Rare / awkward | J Q X Z | None in bases or their immediate neighbors; at most one per outer-side batch |

The two sides receive matching category counts separately in their starting territories, the one-step neighborhood around them, and the rest of their half. Counts are rounded for each region. Within a category, letters are drawn using the existing English frequency weights, and positions are shuffled separately. Small batches of two or more letters always contain a vowel and a flexible consonant. A single-letter refresh samples a non-rare category at random.

Each player gets one randomly positioned starting joker. Neutral jokers are paired by distance from their respective starts, with independently chosen positions; matching mirrored positions are avoided when alternatives exist. The center column is shared and drawn separately.

Letter placement tries up to 24 arrangements and favors consonants with a neighboring vowel or joker, and rare letters separated from other rare letters. This is a bounded heuristic, not a guarantee that every tile forms an English word.

Both ordinary move refreshes and the refresh-turn action use the same category policy regardless of player. A rare letter has a 35% chance of inclusion in eligible batches, capped at one and at 8% of batch size, with a configurable minimum batch size of 10. With these defaults, integer rounding means batches below 13 letters contain no rare letters. Every replaced letter still differs from its previous value.

Dictionary-based comparison of actual available words is a later step; this iteration balances ingredients, not proven word opportunities.

## Change the experiment

- `config.js`: `GAME_CONFIG.letterBalance` holds the letter groups, target shares, rare-letter limits and placement attempt count. `letterWeights` controls relative frequency within each group. The remaining config includes `boardRadius`, `cornerCut`, `jokerCount`, `maxEnemyTilesPerWord`, `turnsPerPlayer`, `refreshUsedLetters`, `allowRefreshTurn`, `allowReentry`, scoring and dictionary toggle. Reload after edits. Radius 4 with corner cut 2 creates 69 tiles; cut 0 restores an 81-tile square. Use a positive radius, corner cut no larger than the radius, feasible territory/special counts, disjoint letter groups, and multiple positive-weight letters in each group so a refresh can draw a different letter.
- `engine.js`: DOM-free board generation, 8-way adjacency, path/word validation, capture, scoring, letter replacement, submission, refresh turns and turn advancement. `submit` and `refreshTurn` return a new state without mutating the old state. Joker assignments are a separate map of tile IDs to uppercase letters. Randomness is injectable for reproducible tests. Alter these functions for different capture or victory rules.
- `app.js`: SVG rendering, pointer/touch/keyboard selection, status and move log. Consumes the engine rather than defining the rules.
- `style.css`: responsive board and interface styles.

For a future word list, load a script defining `window.WORD_DICTIONARY = new Set([...lowercaseWords])` before `app.js`, then enable `dictionaryEnabled`. An enabled but missing dictionary blocks submissions rather than accepting everything silently.

Run the dependency-free rule checks with `node engine.test.cjs`.

## GitHub Pages

Publish from the `main` branch, repository root. All asset references are relative so the prototype works under a repository Pages URL.
