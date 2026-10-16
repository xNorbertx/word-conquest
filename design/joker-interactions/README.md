# Joker interaction studies

[Open the published phone-friendly gallery](https://xnorbertx.github.io/word-conquest/previews/jokers/). No sign-in required.

Open **index.html** directly in a browser; the three separate HTML pages also work
offline. No installation, account, font download or build step is needed.

Optional local server: `node design/joker-interactions/serve.cjs` from the repository
root, then open **http://127.0.0.1:4178/**. An optional port argument avoids conflicts.

1. **Tile bloom** — tap a joker to open eight quick letters around it. A–Z / A–Ö
   opens every allowed letter. One tap assigns it and the letter travels to the
   tile. An asterisk marks the wildcard. Closest to the board, at the cost of
   temporarily covering nearby tiles.
2. **Word dock** — an infinity symbol becomes an editable slot within the selected
   word. A letter pad appears below it; the board makes room. Choosing a letter
   advances to the next unresolved joker, or dismisses the pad. Best starting
   point for thumb reach and multiple jokers, at the cost of a temporarily smaller
   board.
3. **Letter lens** — layered tiles open an enlarged tile and its local context.
   Swipe/tap the alphabet rail, or use its arrows, to preview a letter in the word.
   Use letter commits it; close/Escape cancels the preview. More tactile and
   deliberate, with an extra confirmation and more travel for distant letters.

Every page allows English/Svenska, one/two jokers, interchangeable symbols, reduced
motion and replay. Markers and zero letter points remain visible after assignment.
The system keyboard and text fields are not used. Tapping an assigned tile or its
word slot reopens it. In the lens, cancelling an edit retains the original letter.
Keyboard users can activate joker tiles with Enter/Space; Escape dismisses pickers.
The lens traps focus and makes the underlying game inert while open. System
reduced-motion preferences are respected.

The sample path is deliberately fixed to compare interactions, rather than
recreating the whole game. WORD uses O (and D for the second joker); FÅR uses Å
(and R for the second). Other valid substitutions work too. All alphabet choices
are available; arbitrary letters can be previewed but the demo Play button requires
a valid word for the sample path. `make-fixture.mjs` checks the samples, scoring,
board shapes and accepted substitutions against the current engine/dictionaries.

These are review-only prototypes, hosted separately under `/previews/jokers/`.
They are not imported by the app or packaged in Android. The current working
joker fix remains live.
No network APIs, personal data, analytics or browser storage are used.

## Review status

Static, fixture and interaction checks are recorded in `docs/PROGRESS.md`. Browser
automation was unavailable during creation; actual phone appearance, touch comfort,
scrolling and animation feel still need owner review. This is not a claim of
physical-device verification or an approved production design.
