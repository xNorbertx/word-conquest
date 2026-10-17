# Login screen concepts

Three standalone, mobile-first HTML/CSS/JS studies. The only product copy is the
game name and essential sign-in controls. The small Preview / 1–2–3 bar belongs to
the review gallery, not the proposed app screen.

Gallery URL: https://xnorbertx.github.io/word-conquest/previews/login/
Publication verification is pending.

1. **Letter tiles** — WORD and CONQUEST form the wordmark in the board's clipped
   tiles. Sage, walnut, ownership markers and one gold castle carry the identity.
   Plain ivory background, no form card.
2. **Castle mark** — the shared WC monogram sits in a gold-edged castle, above a
   serif wordmark. One paper panel groups the fields and actions.
3. **Territory** — a forest-green heading area, large two-line wordmark and cropped
   territory tiles. The form sits on ivory below. Desktop uses two columns.

These are visual previews only. Show/hide password works; the submit, account and
recovery controls show a short preview notice. They never authenticate or send
requests. CSP blocks network connections and form submission. No analytics,
cookies, local storage, remote fonts, images, libraries or account access. Forms
have no named credential fields; the password is cleared on simulated submit.

The SVG geometry comes from `online/board-geometry.mjs`, and the WC paths from
`assets/monogram.json`. Typography and the ivory/sage/walnut/forest palette match
the app. Source artwork is embedded for reliable offline and phone loading.

Open `index.html`, or run `node design/login-concepts/serve.cjs` and visit
http://127.0.0.1:4180/ (an optional port argument is supported).

## Responsive and accessibility review

- Solid root/body backgrounds, no background images, floating phone frame or
  transparent paper overlays. Territory intentionally has a forest header and
  ivory form area.
- Safe-area insets; small viewport height; controls scroll on short landscape or
  large-text screens. Short portrait screens reduce the artwork before the form.
- At least 16px input text, visible keyboard focus, screen-reader field labels,
  labelled password toggle, live preview feedback and reduced-motion support.
- CSS/JavaScript parse without warnings. Local responses, heading/label/link
  structure and preview isolation were checked. Layout dimensions and title
  metrics were reviewed for 320–430px widths; SVG artwork was rendered and viewed.
- Browser inventory was empty and the in-app browser could not be opened.
  Therefore these are **not browser-rendered phone screenshots**; actual phone
  appearance, keyboard interaction and touch comfort remain acceptance checks.

These concepts do not modify the production login, backend, APK or existing games.
