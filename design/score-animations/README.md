# Score animation concepts

Open **index.html** directly in a browser. Everything works offline; there are no dependencies, accounts, or build steps. The four separate HTML files also open directly. Use **Replay round**, **Slow motion**, or **Show result** to compare. Reduced motion follows the system setting and can be toggled in the preview controls.

1. **The score ribbon** — a single changing ribbon below the word; each tally arcs into its balance.
2. **The paper receipt** — four compact rows that remain readable after the transfers.
3. **On the board** — points rise from the actual letters, castles, and changed tiles, then travel to the balance. The word’s length bonus has its own token.
4. **The round reveal** — a larger round-end card counts all four categories, then sends each tally to its player.

These are design choices for review, not changes to the app, backend, scoring, or Android build. Fictional game and names. There are no external assets or network requests.

## Shared sample

The fixture is checked against the current `autumn-v3` engine and dictionary by `node design/score-animations/make-fixture.mjs` (run from the repository root). GARDENS ends round 6. Norbert owns the centre and one side castle; Ellinor holds no castles in this example.

| Event | Norbert | Ellinor |
| --- | ---: | ---: |
| Before | 84 | 79 |
| GARDENS: 9 letter points + 10 length bonus | +19 | — |
| Castle income: side 2 + centre 4 | +6 | — |
| Six new ordinary tiles | +6 | — |
| Three of those tiles taken from Ellinor | — | −3 |
| After | **115** | **76** |

Castle income is recurring income awarded after both players move. Territory is the current ownership value, so taking an opponent tile adds its value to one player and removes it from the other. The animation order is a presentation choice; no partial balances are saved.

For implementation after a direction is chosen: use the server receipt’s before/after totals and scoring components; support both players receiving castle income; skip income on incomplete rounds; respect reduced motion and interruptions; preserve the committed total when leaving the screen. These mockups deliberately keep the played letters visible to explain the move rather than showing replacement letters.

Optional local preview: `python -m http.server 4177 --bind 127.0.0.1 --directory design/score-animations`, then open http://127.0.0.1:4177/.
