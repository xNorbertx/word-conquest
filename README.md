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

- Mirrored opening letters, territory shapes, castles and jokers give both sides equivalent initial options. Default starts contain a joker, a vowel and a consonant. This reduces initial board luck without claiming to remove first-player advantage.
- Fresh letters move some luck into each turn and break up repeated use of one fixed word. The refreshed letters are shared and may also help the opponent.
- Three enemy captures make counterattacks larger: stealing three normal tiles changes the score difference by six points. Castles can make the swing larger. Whether this produces satisfying comebacks needs playtesting.
- A larger map and 12-turn limit are intended to keep expansion meaningful without a long stale ending.
- Re-entry prevents total territory loss from leaving a player unable to take their remaining turns. It is an experimental comeback rule, not permanent protection.

These values and behaviors are provisional. In the next playtest, watch how often you refresh, whether late counterattacks can matter, and whether changing letters make planning feel too fragile.

## Change the experiment

- `config.js`: `GAME_CONFIG` holds `boardRadius`, `cornerCut`, `mirrorStartingBoard`, `jokerCount`, `maxEnemyTilesPerWord`, `turnsPerPlayer`, `refreshUsedLetters`, `allowRefreshTurn`, `allowReentry`, scoring, letter frequencies and dictionary toggle. Reload after edits. Radius 4 with corner cut 2 creates 69 tiles; cut 0 restores an 81-tile square. Use a positive radius, corner cut no larger than the radius, feasible territory/special counts, and a letter distribution containing multiple vowels and consonants.
- `engine.js`: DOM-free board generation, 8-way adjacency, path/word validation, capture, scoring, letter replacement, submission, refresh turns and turn advancement. `submit` and `refreshTurn` return a new state without mutating the old state. Joker assignments are a separate map of tile IDs to uppercase letters. Randomness is injectable for reproducible tests. Alter these functions for different capture or victory rules.
- `app.js`: SVG rendering, pointer/touch/keyboard selection, status and move log. Consumes the engine rather than defining the rules.
- `style.css`: responsive board and interface styles.

For a future word list, load a script defining `window.WORD_DICTIONARY = new Set([...lowercaseWords])` before `app.js`, then enable `dictionaryEnabled`. An enabled but missing dictionary blocks submissions rather than accepting everything silently.

Run the dependency-free rule checks with `node engine.test.cjs`.

## GitHub Pages

Publish from the `main` branch, repository root. All asset references are relative so the prototype works under a repository Pages URL.
