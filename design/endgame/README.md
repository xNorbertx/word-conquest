# End-game result concepts — 27 October 2026

Three isolated HTML/CSS/JS prototypes, awaiting owner selection before app implementation.

[Phone gallery](https://xnorbertx.github.io/word-conquest/previews/endgame/)

1. **Victory seal** — an ivory result card, a castle emblem and a small confetti burst.
2. **Final board** — a miniature finished board, a two-column breakdown and best-word tiles.
3. **The tally** — a large score on your player colour, with a proportional score-composition bar.

Each shows a prominent win result, both final scores, your word-letter points,
length bonuses, total castle income, final territory and best word. Best word
means letter points plus length bonus, consistent with the app's current analytics.
The sample is fictional: 118 + 19 + 48 + 29 = 214, against Alex's 189.
CONQUEST scores 14 letter points + 5 length bonus = 19 under current English rules.
No end-game castle bonus or immediate territory deductions are added.

## Try it

Open `index.html`, or run `node design/endgame/serve.cjs` and visit
http://127.0.0.1:4182/. The server binds only to loopback; an optional port argument
is supported. All fonts/artwork/code are local; there are no dependencies to fetch.

The first win reveal gets a brief canvas confetti burst. **View board** or the
close button dismisses the modal. **View result** reopens the same data quietly.
Escape also closes and restores focus to View result. A per-concept sessionStorage
flag prevents repeat confetti on refresh; explicit **Replay win** starts it again.
This is preview-only state, not the eventual account/game delivery mechanism.

The numbered navigation and **Preview controls** are review tools, not app copy.
Controls include player colour, theme, win/loss/draw, replay and reopen.
URL parameters: `theme=dark`, `side=walnut`, `outcome=loss|draw`, `mode=reopen`.
Losses, draws, reopen and OS reduced-motion preference suppress confetti.
Closing, resizing or hiding the page stops it immediately.

## Verification

- Rendered all three in the in-app Chromium browser at 390 × 844 and 320 × 568.
  Tightened the smallest layout after visual review; all result content and the
  primary button remain visible at 320 × 568. Review controls can scroll below.
- Inspected brown-player/dark appearance, both full and compact layouts.
- Exercised confetti start, reopen without another burst, win/loss/draw changes,
  Close/View board, View result, Escape and focus restoration. Browser logged no
  warnings or script errors. Native dialogs keep the background inert.
- CSS and JavaScript syntax checks pass. Four totals add to the displayed score.
- Portrait and short landscape layouts allow modal scrolling instead of clipping.
  Native iOS Safari and physical Android touch feel are not independently tested.

Only `design/endgame/`, design documentation and the dedicated public preview path
are changed. Production app, backend, rules, APK and existing previews are untouched.
Published and verified: all six public files match source `5bb089d`; Pages commit
`160ec21`. The public win screen was also visually checked at phone size.
Existing app and prior preview assets are unchanged. See `docs/PROGRESS.md`.
