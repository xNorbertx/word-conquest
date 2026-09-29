# Word Conquest

A small local two-player territory word game. Plain HTML, CSS and JavaScript; no dependencies, build step, backend or accounts.

## Play locally

Open `index.html` in a browser. Both players use the same screen. Drag across adjacent octagons, or click/tap letters individually, then submit. Keyboard users can Tab to tiles and press Enter or Space. Cancel clears the path; choosing the previous tile undoes one step.

The board has **49 octagons in a 7 × 7 grid**, up from the first iteration's 37 hexes. All eight surrounding tiles are adjacent, including diagonals across the small gaps between octagons.

**Five jokers (?)** appear on each board: one in each player's starting territory and three spread through neutral land. Trace through them, then enter one A–Z letter for each selected joker in the fields below your word. Submit stays disabled until every joker is filled. Each joker's choice applies only to that move; it remains a joker after capture and can represent a different letter on later turns. Undoing a joker step, cancelling, submitting or resetting clears its choice.

**Dictionary validation is OFF by default.** Any legal path of at least three letters counts. This is a rules sandbox, not yet a test of English vocabulary. The yellow banner makes this explicit. Boards use weighted English letter frequencies but are not balanced or guaranteed to contain useful words.

Start on your own territory. Use each tile at most once and at most one enemy tile per word. All neutral/enemy tiles used become yours. Normal territory scores 1; castles score 3. Each player gets 15 turns. Highest final score wins; equal scores draw.

Words may repeat across turns and moves capturing zero territory are allowed. There is no pass rule. Disconnected territory stays owned. Refreshing or starting a new game resets progress; nothing is saved. These are provisional prototype behaviors.

## Change the experiment

- `config.js`: `GAME_CONFIG` holds board radius, `jokerCount`, starting territory count, word length, enemy limit, turn limit, points, castles, letter frequencies and dictionary toggle. Reload after edits. Radius 3 creates 49 octagons; radius 4 creates 81. Use feasible starting counts for the board size. The first two jokers go to starting territories; remaining jokers occupy neutral non-castle tiles.
- `engine.js`: DOM-free board generation, 8-way adjacency, path/word validation, capture selection, scoring, submission and turn advancement. `submit` returns a new state without mutating the old state. Joker assignments are a separate map of tile IDs to uppercase letters, supplied to validation and submission. Alter these functions for different capture or victory rules.
- `app.js`: SVG rendering, pointer/touch/keyboard selection, status and move log. Consumes the engine rather than defining the rules.
- `style.css`: responsive board and interface styles.

For a future word list, load a script defining `window.WORD_DICTIONARY = new Set([...lowercaseWords])` before `app.js`, then enable `dictionaryEnabled`. An enabled but missing dictionary blocks submissions rather than accepting everything silently.

Run the dependency-free rule checks with `node engine.test.cjs`.

## GitHub Pages

Publish from the `main` branch, repository root. All asset references are relative so the prototype works under a repository Pages URL.
