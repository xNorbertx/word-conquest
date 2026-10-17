# Login refinements — round 2

Three independent phone-first previews combining the owner's requested elements:
the **Territory** layout (round 1 option 3), the tile-built title (option 1), and
the WC/castle identity (option 2). No slogans or introductory product copy.

Gallery: https://xnorbertx.github.io/word-conquest/previews/login-v2/
Published and verified: all six public files match source 3820a74; Pages commit
651f5c6. These are concepts for selection, not the live login.

1. **Crest** — a centred WC castle, larger sage WORD tiles and an ivory/walnut
   CONQUEST row. The quietest, most symmetrical treatment; softly outlined fields.
2. **Connected** — the WC becomes a castle within one small, stepped board. The
   title shares its grid with sage/walnut territory; slightly squarer controls.
3. **Monogram** — an oversized, low-contrast WC impression behind the tile title,
   with a small castle stamp crossing the forest/ivory boundary. Underline fields
   give the lower half a lighter treatment.

The numbered bar and gallery descriptions are review controls, not app copy.
The individual proposed screens contain only Word Conquest, Email, Password,
Forgot password?, Sign in and Create account.

## Run and review

Open `index.html` directly, or run `node design/login-refinements/serve.cjs` and
visit http://127.0.0.1:4181/. An optional port argument is supported. Everything
needed is inline or local. The first-round gallery is linked for comparison.

Show/hide password works. Sign-in, account creation and recovery show a preview
notice. They never authenticate or send requests. CSP blocks connections and
form submission; no credential fields have names, the password clears on the
preview submit, and nothing is persisted. No remote fonts, libraries or analytics.

## Verification and limits

- Source SVG artwork rendered and visually inspected, including small title
  lettering and tile alignment. Uses the real board geometry and shared WC paths.
- Solid opaque backgrounds, safe-area insets, 16px input text, short-height
  adjustments and scrolling on small/landscape/keyboard viewports. Desktop uses
  a two-column layout. No fixed-height clipping of form content.
- CSS/JS syntax, heading/label/link structure and isolated preview handlers
  checked. Portrait dimensions reviewed at 320×568, 360×740, 390×844 and 430×932.
- Visible focus, labelled password toggle, live preview feedback and reduced
  motion support. No forced animations or auto-playing content.
- Browser inventory is empty in this session. SVG artwork and a dimension-based
  composition proof were inspected; **these are not browser screenshots**.
  Real phone rendering, keyboard behaviour and touch comfort remain unverified.

No live auth/game/backend/APK changes or new costs. Owner selection is required
before replacing the production login. Round 1 is preserved separately.
