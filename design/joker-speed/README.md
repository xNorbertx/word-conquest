# Faster joker studies

Three independent HTML/CSS/JS prototypes for a quicker follow-up to the approved
Letter lens. They are isolated from the web app and Android, with fictional games
and no network APIs, accounts, analytics, browser storage or external assets.

1. **Open lens** — the enlarged tile with the entire alphabet in a six-column pad.
   Tap a letter to place it immediately. No scrolling or confirmation. A good first
   candidate because it retains the lens while removing the slowest action.
2. **Word keys** — the word becomes the focus, with an in-app QWERTY letter pad.
   One tap assigns a letter; Swedish Å/Ä/Ö have their own generous row. Familiar
   locations may reduce searching, at the cost of narrower main keyboard keys.
3. **Big letters** — choose an alphabet group, then a large letter tile. Two taps
   per letter and no scrolling; extra-large targets trade one more tap for less
   precision and fewer choices to scan at once. All groups remain available.

All three start with the picker open. Close it to inspect the board, change
English/Svenska or toggle two jokers. A letter assigns immediately and advances to
the next blank. Tap a word slot or board joker to edit; closing preserves existing
assignments. Escape closes a native dialog with built-in focus containment. Keyboard
letter keys also select directly. Reduced motion is respected. Blank jokers retain
zero points, with no added symbol.

The same engine-verified fixture is used for every concept: WORD (one/two jokers)
and FÅR (one/two). Alternative substitutions can be explored; Play is enabled only
for dictionary-valid fixture words. `make-fixture.mjs` uses the current pinned
English/Swedish rules and checks board/scoring/dictionary consistency. These are
interaction studies with a fixed path, not full playable games.

## Background and responsive layout

The root, body, game and sheet use the same opaque ivory. Mobile has no nested phone
frame, gradients, texture overlays or translucent paper layers. Native dialog
backdrop covers the viewport exactly once. Safe-area padding and dynamic viewport
height protect the bottom edge; short screens compress decoration first. The full
alphabet remains available without a horizontal rail. Very short landscape or
large-text settings can vertically scroll the dialog rather than clipping controls.

Open `index.html` directly, or run `node design/joker-speed/serve.cjs` and visit
http://127.0.0.1:4179/. An optional port argument avoids conflicts.

Review target: 320×568, 360×640, 393×852 and 430×932 portrait, plus short landscape;
English/Swedish, one/two jokers, assignment, edit, cancel and reset. Functional and
rendered verification results belong in `docs/PROGRESS.md`; source/CSS checks alone
do not establish phone appearance or touch comfort.

These studies do not replace the production picker or the first prototype gallery.
