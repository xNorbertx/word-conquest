# Implementation and verification - updated 19 October 2026

## Dutch / OpenTaal — 0.15.0

- Added immutable `autumn-nl-v1` rules and the 355,792-form
  `dutch-opentaal-v1-0a831728bab0` snapshot. Source revision, raw input/license
  hashes, import policy and reproduction are recorded in [DUTCH.md](DUTCH.md).
- Dutch frequencies and 1–5 letter values; J remains an ordinary letter for IJ.
  Shared defended-castle and final-territory mechanics are unchanged.
- Nederlands in new-game/friend invitations, game cards and game headings;
  dictionary information and personal Analytics include Dutch. Three language
  choices use stacked radio rows to avoid cramping narrow phone screens.
- Full local regression: 218 tests plus original engine/scoring/supply suites
  pass. Includes a complete Dutch game persisted through PostgreSQL-compatible
  functions, invitation acceptance, repeat commits, stale revision handling,
  wrong dictionary rejection, joker validation and final territory settlement.
- Production compressed bundle accepts FIETS, CAFE and ZEEEN and still accepts
  the legacy English/Swedish and expanded Swedish samples. Local peak RSS while
  testing all dictionary versions: 133 MiB; not a hosted memory measurement.
- Production DOM checks pass for all three labels, account-scoped selection,
  friend/link invitation language, dictionary text and license link. CUA browser
  inventory is empty: no rendered phone/browser acceptance claim.
- `game-api` deployed to the existing project on 19 October. Live full-game,
  normal-web publication and signed APK evidence will be recorded below.
- Hosted Dutch game completed in 34 word turns (17 each), scores 97–127. Tested
  friend and link invitations, old-client accept/open/turn guards, creation and
  command retries, stale revisions, opponent reload, every defence-income award,
  final territory, game list, stats and Analytics. Only existing isolated
  `example.invalid` test accounts were used; no owner games or credentials changed.
  This run averaged 867 ms per turn (first 1,084 ms); home was 588 ms. These are
  observations, not latency guarantees.
- No new permissions, dependencies, services or fixed costs. Prior Android
  joker acceptance remains pending; this change does not claim to resolve it.


## Normal web URL promotion — 19 October 2026

The owner could not see the update because 0.14.0 was published only under
`/previews/0.14.0/`. Promoted the same verified files to the normal
[web app](https://xnorbertx.github.io/word-conquest/online/); Pages commit `555ddb0398144afe59b6f51ab29b97aee32bf7a4`.
Only `online/app.js`, `online/index.html` and `online/online.css` changed; public
configuration and licenses already matched. The prototype and review path remain.
Source is still `79867c7`; no gameplay, backend, APK or dependency changes were
needed. Public asset verification checks the normal URL against the tested build.
The previous review-only status below is historical. Browser inventory remains
empty, so rendered visual and physical Seeker acceptance are still outstanding.

## Analytics, score pacing and picker follow-up — 0.14.0

Implementation, automated checks, hosted verification and review build complete.
Rendered visual review and physical Android confirmation are still blocked.

- Removed Activity from the account navigation and routing. Notification delivery
  and backend inbox data remain intact for existing clients.
- New authenticated `analytics` action queries only the caller's active/completed
  `autumn-v5` and `autumn-sv-v4` games, paged in batches of 100. No migration or
  historical backfill. Completed games provide W/L/D and final score/date (including
  resignations). Valid word receipts in active/completed games provide word score
  including length bonus, longest word, maximum newly claimed tiles in one turn
  (neutral and enemy), and cumulative castle captures. Recapturing a castle counts
  again; passing through an already-owned castle does not. Abandoned/invited and
  older-rules games are excluded. Word ties keep the first encountered record.
- Analytics has a compact outcomes strip and five record rows. Record rows open
  their game. Cached data is in memory only, scoped to the signed-in account,
  refreshed on opening or manual refresh; no extra Games-screen work or polling.
- Letter tokens show the actual letter and value, not a hurried +0 count. Each
  gets 240 ms reveal, 180 ms hold, 560 ms flight, 160 ms score update and 60 ms gap.
  Ownership fills transition over 420 ms. After letters, the length bonus counts
  for 320 ms, holds for 1,000 ms and flies for 680 ms, with a separate settling
  pause. Reduced motion avoids flights; tap-anywhere still skips every phase.
- The earlier capture-transfer changes alone did not solve the owner's Android
  issue. Retained their stable SVG hit targets and corrected a different gesture
  defect: a newly opened joker dialog accepted a trailing click even though that
  gesture began on the board. It now requires a fresh pointerdown in the dialog
  for pointer clicks. Keyboard/assistive activation remains supported. Regression
  tests model retargeting to both backdrop and letter key, cancelled gestures,
  reopening, subsequent deliberate taps, touch capture and zoom.
  This is a plausible Android failure path, not a confirmed device diagnosis.
  [Pointer Events](https://www.w3.org/TR/pointerevents2/) explains why cancelling
  pointerdown does not guarantee suppression of the subsequent click.
- All 212 Node tests and original engine/scoring/supply suites pass; build verifies
  immutable dictionaries/rules. Production DOM checks cover Analytics links,
  literal word rendering, empty states, offline retry, cached open, navigation
  and account races; 24 game-screen scenarios cover both seats, current English/
  Swedish and older rules, final/live states and skip/reduced motion.
- **Visual/device check blocked:** no CUA browsers, IAB unavailable, no ADB device.
  Requested a browser/Seeker connection. No screenshot review or actual Android
  success is claimed. Remaining acceptance: 320/360/390/430 px and desktop;
  light/dark; six-, seven-, nine-letter words; zero-point jokers; length bonus,
  castle/final phases; tap-anywhere; touch joker select/edit/drag in fit/zoom.
  Do not describe the Android issue as resolved before phone confirmation.

### Published review build and hosted checks

- Source: `79867c7`; [web review](https://xnorbertx.github.io/word-conquest/previews/0.14.0/). GitHub Pages
  commit `16fae09f46a3fe14c5a96b6aba641ba9a33a19de`. All five preview assets and five original-prototype
  assets match the local build (CRLF-normalized where necessary). The stable
  `/online/` app remains at 0.13.0 pending rendered visual/device acceptance.
- [Android review APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25134997/word-conquest-android.apk) — `0.14.0-79867c7`,
  versionCode `25134997`, 4,994,932 bytes. Anonymous
  download checksum verified. [CI build](https://github.com/xNorbertx/word-conquest/actions/runs/39169993546) passed.
  Stable signing certificate, package, native theme plugin, notification permission
  and exact bundled HTML/CSS/JS/license all verified; no private key or test fixture.
- SHA-256: `44393338d6846a74f1814b27039cf0cb1509a260cf760c6dfe903dd69d1ce24b`.
- `game-api` deployed on the existing Supabase project; two isolated test accounts
  each returned 8 completed games / 33 own words / 3 castle captures, matching
  stored records exactly. Responses were 537 bytes, measured at 1,572 / 1,427 ms.
  Unauthenticated requests returned 401; client-supplied actor identity was ignored.
  No owner game, email or push notification was modified/sent.
- New picker gesture tests fail against the previous committed controller and
  pass with this change. Physical Android confirmation remains open. No CUA browser
  or ADB device became available; the review tab is queued for the owner to open.
- No database migration, new dependency, paid service or app-store release.
  The normal web deployment can be promoted after visual acceptance; the review
  build and stable app share the existing backend and current game rules.

## Combined game-screen update — 0.13.0, 18 October 2026

- Waiting hourglass makes a quiet half-turn every five seconds only on a confirmed
  opponent turn. It pauses while scoring/backgrounded and respects reduced motion.
- Each word letter now changes its tile to the saved owner, sends its own points,
  and advances the score before the next letter. Jokers participate with zero
  points. The length bonus appears only after all letters; castle/final-territory
  phases retain their original accounting. Reduced motion has no flights.
  Tap-anywhere, Escape, cancellation, cleanup and saved-state restoration remain.
- Removed draw controls and the detailed last-move sheet. Last word now opens
  **Move history** directly, also available in the game menu. Table columns are
  Word / Length / Castles / Total, with player names and timestamps. Opponent
  defence income has its own recipient row, as do final territory and historical
  land gains/losses; no castle points are attributed to the wrong word author.
  Replay points remains available at the bottom of the sheet.
- History previously fetched the older moves only after opening and discarded
  that result on close. It now preloads once per observed revision, joins in-flight
  requests and reuses an account/game-scoped six-game memory cache. Offline Retry,
  exclusive revision paging, live-update merging, stale-result rejection and
  sign-out/account-change cleanup are covered by tests.
- The optional compact history API omits path/tile replacements from the response;
  full receipts remain stored and available to older clients. Deployed `game-api`
  successfully to `aumiyyjsdqdazzmdmprl`; no SQL, scoring or dictionary change.
- Hosted read-only checks used existing isolated example.invalid test identities
  and games. Every compact row matched the full receipt, and per-player row sums
  matched authoritative score deltas. Unauthenticated requests still return 401.
  - `autumn-v5`: 34 moves, 34,040 → 9,931 bytes (71% smaller).
  - `autumn-sv-v4`: 30 moves, 32,510 → 8,817 bytes (73% smaller).
  - `autumn-v3`: 4 moves, 4,716 → 761 bytes (84% smaller).
  These are payload savings, not promised latency reductions: sampled network
  calls still took roughly 0.5–1.7 seconds. Prefetch and cache remove the repeat
  wait when opening history after it has loaded. No owner games changed.
- Verification: 204 regression tests (including 24 new cases), original engine/
  scoring/supply suites and production build. A further 24 actual-renderer DOM
  scenarios cover both seats, English/Swedish/legacy, normal/final games, skipped/
  reduced-motion scoring, last-word history routing, draw removal and hourglass
  state. DOM tests do not establish real phone pixels or animation feel.
- Physical-phone and rendered browser review remain open; neither surface was
  connected. No owner decisions or manual setup are required before release.
  No paid infrastructure, new dependencies, permissions or ongoing cost changes.
- Released source `b947240`; [web](https://xnorbertx.github.io/word-conquest/online/)
  published at Pages `dc05e6d`. Pages build succeeded and all ten
  public app/prototype assets match the verified build (CRLF normalized).
  Original prototype and published design/research pages are retained.
- [Signed Android APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25133416/word-conquest-android.apk) from
  [successful CI](https://github.com/xNorbertx/word-conquest/actions/runs/39168081253): `0.13.0-b947240`,
  code `25133416`. Original pilot certificate, package ID, exact
  web assets, sequential scoring/cache code, absent draw controls, notification
  permission and native appearance bridge verified. No private keys or local
  test fixtures packaged. Anonymous public download matches SHA-256
  `65d7b606d5fb689301fc8c120c93aaab18f7ffd340889fa940c0ad787cb2d5d9`.
  Install over the existing pilot. Existing games work; no new game is needed.

## Tap anywhere to finish scoring — 0.12.2, 18 October 2026

- A transparent full-screen button consumes a completed tap/click and cancels
  the whole sequence, including word points, castle capture/income and both
  final-territory tallies. Existing completion rendering restores the saved board
  and exact scores immediately. No score calculation or server mutation changed.
- Removed the visible Skip button and its reserved space. The invisible target
  has an accessible label, native Enter/Space activation and Escape support;
  prior keyboard focus is restored when its element remains connected.
- Cleanup removes the tap target and point effects on skip, natural completion,
  replay replacement, navigation, resize or backgrounding. Waiting for click
  (not pointerdown) prevents the same tap reaching a control underneath.
- All 180 regression tests and original engine/scoring/supply suites pass, as does
  the production build. Six added cases cover clicks during initial/word/capture/
  castle/final phases, immediate restoration, reduced motion, click consumption,
  focus, Escape and replay replacement. Twelve actual-renderer DOM cases confirm
  immediate saved totals for both seats, English/Swedish/legacy rules and live/
  final states; twelve additional cases verify natural reduced-motion completion.
- Physical-phone acceptance remains open: no browser surface or Android device
  is connected for this run.
- Released source `ba56ca5`; [web](https://xnorbertx.github.io/word-conquest/online/)
  published at Pages `7d77254`. Pages build succeeded and all ten
  public app/prototype files match the verified build (CRLF normalized).
  Only online client assets changed; original prototype and reports retained.
- [Android APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25109149/word-conquest-android.apk) from
  [successful CI](https://github.com/xNorbertx/word-conquest/actions/runs/39137399097): `0.12.2-ba56ca5`,
  version code `25109149`. Stable pilot signing certificate,
  package ID, exact bundled web files, tap-target code, removed Skip button,
  notification permission and native appearance bridge verified. No private keys
  or local test fixtures packaged. Anonymous download matches SHA-256
  `0583663df88db481849cf81b44a24e16e224637e5d829a9444478812db5211ed`.
  Install over the current pilot; no new game needed.
- Client-only patch; existing games supported, no backend migration, permissions,
  dependencies or ongoing cost changes.

## Android joker auto-open — 0.12.1, 18 October 2026

- Fixed a touch-capture failure path: all tile DOM nodes were replaced during
  selection, while any bubbled `lostpointercapture` event cleared the board
  gesture. The picker was opened only at release, so that gesture could disappear
  first. Board groups/polygons now stay connected through selection, and capture
  cancellation checks the owning element and active pointer. The same correction
  applies to zoomed taps; actual cancellation and panning still do not open a picker.
- The existing in-app letter keyboard opens as soon as a joker tap/word drag is
  released, without an extra tap on the word. English/Swedish letters, re-editing,
  multiple-joker advance, keyboard accessibility, Android Back and stale-game
  assignment guards retain their existing behaviour. No OS keyboard/plugin added.
- 174 regression tests plus original engine/scoring/supply checks pass. New tests
  cover bubbled capture transfers, other fingers, true capture loss, zoom taps and
  production SVG identity. Four production DOM touch-sequence scenarios fail in
  0.12.0 and pass in 0.12.1, including committing English/Swedish joker letters.
  Twelve scoring DOM/reduced-motion scenarios also pass with the retained nodes.
- These are synthetic-event/DOM tests, not a recorded trace from the user's phone.
  No Android device or browser surface was connected; physical WebView acceptance
  remains open. Pointer capture and disconnected-node behaviour are documented in
  the [Pointer Events specification](https://www.w3.org/TR/pointerevents/#implicit-release-of-pointer-capture).
- Client-only patch: existing backend, immutable scoring, saved games, permissions,
  dependencies and ongoing costs unchanged. Publish web and signed Android pilot;
  no Supabase deployment/migration required.
- Released source `06a09b3`; [web](https://xnorbertx.github.io/word-conquest/online/)
  published at Pages `fe86c3a`. Pages build succeeded; all ten public
  app/prototype assets match verified files (CRLF normalized where relevant).
  Only the online client changed; root prototype and published reports retained.
- [Android APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25108092/word-conquest-android.apk) from
  [successful CI](https://github.com/xNorbertx/word-conquest/actions/runs/39136072174): `0.12.1-06a09b3`,
  code `25108092`, stable pilot signing certificate verified.
  Package ID, exact web assets, new capture-handling code, notification permission,
  native appearance bridge and absence of private keys/test fixtures verified.
  Anonymous public download matches SHA-256 `4fbfa7d1876207bf58494f68d3188a7390516eb78a1a89e85dbae97906a74ad3`.
  Install over the current pilot; no new game required. Physical-phone confirmation
  remains the only outstanding acceptance check for this fix.

## Approved scoring — 0.12.0, 18 October 2026

New games use `autumn-v5` (English) / `autumn-sv-v4` (Swedish): words,
defended castles at 3/5, and final +1 per owned tile. Existing games keep
their immutable rules and dictionaries. No migration or re-scoring of old games.

- A valid word scores its pre-replacement letters and length bonus, resolves
  captures, then pays **only the opponent** for castles still theirs: side 3,
  centre 5. Refresh is also a turn and pays the same defender. A newly captured
  castle earns nothing immediately; recapturing denies the defence payment.
- At natural completion (120 shared letters, equal-turn final reply), that last
  defence payment happens before the final territory tally. Each owned tile is
  worth exactly 1, including starting tiles, castles and jokers; neutral tiles 0.
  No extra final castle value, capture reward or score deductions.
- Resignation and accepted draw settle final territory without another income
  payment; their explicit result overrides numerical scores. Draw offers do not
  score. Abandonment leaves territory unsettled. Stored final tallies and immutable
  operation receipts make retries/reloads safe from duplicate awards.
- English letter values use the researched five tiers. Both languages use
  6 letters +1, 7 +3, 8 +5, then +2 per extra letter; jokers remain zero.
  Swedish retains its previous letter values and expanded dictionary. Its balance
  has not been simulated. Openings, replacement supply and random starts unchanged.
- Score breakdowns separate banked points from prospective final territory.
  Board animations award defender income after captures, and animate each
  player's final territory separately. Recaps and list/stat totals use the same
  authoritative state. Captured-castle animation also runs on word-only payouts.
- 170 regression tests pass, including all historical versions; original prototype
  engine/scoring/supply checks and pinned-hash build pass. Two full published 3/5
  games reproduce every board, replacement, payout and final score in production.
  Both starters, final word/refresh, early endings, zero jokers, Swedish, malformed
  animation receipts, old clients, retries and stale races are covered.
- Released source `de48268`; dedicated Supabase `game-api` deployed before clients.
  Hosted checks used existing isolated `@example.invalid` test accounts with no
  enabled push devices, and only newly journaled test games. Full Swedish game
  (30 words, all using Å/Ä/Ö) and English game (34 words) completed with equal
  turns, exact defence/final ownership accounting, creation/turn/final retries,
  stale-client rejection, opponent reloads and matching lists/statistics.
  Seven further hosted terminal cases passed: final word and refresh with both
  starters, resignation, accepted draw, abandonment. Each saved exactly one
  operation receipt, ignored forged score fields, and rejected stale retries.
- Twelve production DOM checks cover both seats, new English/Swedish and old
  English rules, active/final score sheets, rules, recaps, reduced-motion payout
  rendering, exact final balances and cleanup. CSS parses. These are DOM checks;
  browser rendering, full-motion feel and physical-phone appearance are unverified.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published at Pages
  `4113567`. Build succeeded and all ten app/prototype assets match
  the verified files (normalizing CRLF where relevant). Root prototype preserved;
  only `online/` changed on Pages, preserving published research and designs.
- [Android 0.12.0](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25106288/word-conquest-android.apk) from
  [successful CI](https://github.com/xNorbertx/word-conquest/actions/runs/39133822191), version `0.12.0-de48268`,
  code `25106288`. Stable certificate, package ID, notification
  permission, native appearance bridge, exact bundled assets and no embedded
  private keys/fixtures verified. Anonymous public download hash matches:
  `1a83d4ccfe8d16a5f4149996a790ca1ac1e7668ae58bf021bff6806977c4aa78`.
- Update both phones and start a new game; old games keep their rules. Run,
  deployment and compatible rollback are in [OPERATIONS.md](OPERATIONS.md).
  No paid services, dependencies, schema changes or ongoing costs added. Human
  balance, fairness and physical-device animation acceptance remain open.
  Research reports describe historical baselines; reproduce those studies at
  their recorded commits.

## Defended castles at 3/5 — 18 October 2026

- Added only the 3/5 defended-castle variant to the previous English comparison,
  retaining final +1 per owned tile. No extra end-game castle value, capture
  reward, banked-score deduction or production rule change.
- 1,504 new games / 37,138 turns; 2,880 previous distinct controls reused exactly.
  Combined: 4,384 distinct games / 108,026 turns. All seven stages use identical
  seeds, starts and policy coefficients; rate changes reach scoring and decisions.
- Main: 52.1% words / 34.0% defended castles / 14.0% final land, versus
  58.9 / 25.4 / 15.6% at 2/4. Paired castle-share increase 8.5 points, interval
  8.2-8.9. Castle exchanges 5.7 -> 6.3; halfway leader wins 70.9 -> 74.4%.
  Fewer late reversals; fairness remains unresolved and human enjoyment unmeasured.
- Sixteen research tests pass. All 512 new main games independently replayed,
  every 3/5 payout checked against surviving ownership; twenty complete controls
  across five models reproduce earlier records. Prior controls hash-identical;
  aggregate accounting, source hashes, six full replays and all assets pass.
  No search truncation or unfinished games.
- Six model selectors, every replay score, retry/navigation/accessibility labels,
  CSS/JS parse and mobile layout rules checked. PNG/SVG figures visually inspected;
  browser/device rendering unavailable, so physical-phone appearance not verified.
- [Findings](research/castle-35-2026-10-18/FINDINGS.md),
  [methods](research/castle-35-2026-10-18/README.md),
  [report](research/castle-35-2026-10-18/index.html).
  [Public report](https://xnorbertx.github.io/word-conquest/research/castle-35-2026-10-18/)
  published from source `a97677c`, Pages `7eb4689`; build succeeded. All 14
  report assets match verified files, and ten app/prototype assets match their
  previous deployment. Existing reports, live app, APK, backend,
  dictionary and saved games unchanged; no new infrastructure or ongoing cost.

## Final territory follow-up — 18 October 2026

- Compared words + defended castles against the same rules plus a one-time final
  point per owned tile, including starting tiles, castles and jokers. Neutral
  tiles excluded. No capture rewards, special final castle values or deductions.
- Completed 2,880 distinct English games / 70,888 turns; 3,008 executions include
  128 repeated controls, explicitly marked and excluded from the headline.
  Main, mixed styles, sparse, exhaustive familiar search, one-reply planning,
  full and late land valuation. Fixed coefficients; both starters per board.
- Main distribution without bonus: 69.9% words / 30.1% castle income. With bonus:
  58.9% / 25.4% / 15.6% final land. Attacks 42.8% -> 55.1%; last-move reversals
  3.7% -> 9.7%. Starter win change is inconclusive; no claim of measured enjoyment.
- Nine rule tests pass. All 1,024 main games replay-audited exactly; eight controls
  match the prior runner. Score/component/source-hash checks pass for all records,
  including exact duplicate-control reconciliation and 16 terminal alternatives.
  No search truncation or unfinished games.
- Six report selectors, four complete replays with every score checked, retry,
  navigation, accessibility labels, CSS/JS parsing and report assets pass. Exported
  PNG/SVG charts visually inspected. Browser/physical-phone rendering unavailable.
- [Findings](research/final-territory-2026-10-18/FINDINGS.md),
  [methods](research/final-territory-2026-10-18/README.md),
  [report](research/final-territory-2026-10-18/index.html).
  [Public report](https://xnorbertx.github.io/word-conquest/research/final-territory-2026-10-18/)
  published from source `e8825a5`, Pages `95f1a8a`; build succeeded. All 14
  public report assets match, and ten existing app/prototype assets match their
  previous deployment. No app, backend, dictionary, account, APK,
  rules migration or new ongoing cost. Human comparison and rule approval remain.

## Scoring simplification study — 18 October 2026

- Research-only comparison of current English autumn-v4, the owner's proposed
  banked captures / gentler word bonus / five letter tiers / defended castles,
  and first-claim-land and words-plus-castles variations. No production gameplay,
  backend, dictionary, user data or APK changes.
- Completed 4,800 full games / 115,790 turns across main, mixed-style, sparse,
  exhaustive familiar-word and shallow reply-planning stages. Both starting
  orders for each board. Added 1,536 continuations from 32 predetermined choices.
- Main scores from words / ordinary land / castle value / income: current
  60.9 / 11.4 / 3.8 / 24.0%; proposal 54.5 / 22.4 / 0 / 23.1%; first-claim
  56.5 / 19.4 / 0 / 24.1%; words-plus-castles 69.4 / 0 / 0 / 30.6%.
- Recommendation is human-testing words-plus-defended-castles against the
  proposal. First-player, comeback and expert-word-search sensitivity remain
  unresolved; no claim that the simplest system is proven fair or more fun.
- Ten research tests pass. Every baseline move reconciles with production
  scoring. Experimental scores never decrease. All 2,048 main games replayed
  exactly in a separate letter/accounting audit. No truncated searches.
- Report model selector, eight complete replays, score tables, navigation,
  CSS and asset/data invariants pass. PNG/SVG charts visually inspected.
  Browser preview unavailable; physical-phone rendering not claimed verified.
- [Written findings](research/scoring-2026-10-18/FINDINGS.md),
  [methods and reproduction](research/scoring-2026-10-18/README.md),
  [interactive report](research/scoring-2026-10-18/index.html).
  [Public report](https://xnorbertx.github.io/word-conquest/research/scoring-2026-10-18/) published from source `992e907`,
  Pages `2bdbac7`. All 15 public assets match verified files;
  ten existing app/prototype assets also match their previous deployment.
  No new infrastructure, Android build or ongoing cost.

## Focus and sign-out — 17 October 2026, released 0.11.2

- Removed the global ochre focus rectangles and login input outline. Touch,
  mouse and pen use no focus box. Deliberate keyboard navigation retains a small
  sage cue; board keyboard focus follows the tile polygon rather than a rectangle.
  Castle decoration, player colours and selected-word feedback are unchanged.
- Both account and username-setup Sign out buttons open a compact Sign out?
  confirmation with Cancel / Sign out. Cancel, Escape, Android Back and backdrop
  dismissal perform no sign-out or push changes. Duplicate taps are guarded.
- Confirmed sign-out checks SDK errors before clearing UI state. Successful
  sign-out resets the form to Sign in; failure remains retryable. Other confirmation
  dialogs retain their existing message when present.
- All 158 tests and the engine/scoring/supply suites pass; build succeeds. Actual
  production DOM checks cover both entry points, cancel/Escape/Back/backdrop,
  repeat taps, confirmation, SDK errors and subsequent message-based dialogs.
  Touch/mouse/pen/keyboard transitions and CSS parse pass.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `2ae60e3`, Pages
  `e82cc32`. All ten public assets match the tested build; the root prototype
  and design galleries remain available.
- [Android 0.11.2-2ae60e3](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25046289) passed [CI](https://github.com/xNorbertx/word-conquest/actions/runs/39070324863).
  Verified stable signing, package/version, native WC icons and Appearance bridge,
  exact packaged HTML/CSS/JavaScript/dictionary notices and anonymous download.
  [APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25046289/word-conquest-android.apk), version code `25046289`, SHA-256
  `61ad935d56c16ed5c6a2be017faa365574064c845cc1c7df6e312c96ff1360ad`. Local copy: `dist/word-conquest-0.11.2.apk`.
- Client-only change, no backend rollout,
  new permissions, dependencies or service costs. Real phone rendering remains an
  acceptance check because browser/device access is unavailable here.

## Approved login — 17 October 2026, released 0.11.1

- Owner selected round 2 option 3 and requested removal of the background logo.
  Implemented the tile-built Word Conquest title, forest header, small WC castle
  stamp and underline fields. No slogans, duplicate header brand or review controls.
- Real Supabase sign-in, signup and reset handlers are retained. Signup still
  requires 12 characters and username selection happens after account creation.
  Mode changes mask the password; the toggle exposes its pressed state.
- Light/dark surfaces, safe-area padding, short-screen adjustments, scrollable
  forms, autofill labels and the quiet privacy/support link remain available.
- All 158 regression tests and original engine/scoring/supply suites pass; build
  succeeds. Production auth DOM checks cover sign-in, signup confirmation, reset,
  masking/toggle, duplicate submits, failure recovery and shell navigation. Saved
  theme checks and CSS parse pass. Production title/castle SVG rendered and viewed.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `8fb5c72`, Pages
  `0b0aabd`. All ten public assets match the build; only online app files
  changed and the root prototype/design galleries remain available.
- [Android 0.11.1-8fb5c72](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25044686) passed [CI](https://github.com/xNorbertx/word-conquest/actions/runs/39068411819).
  Verified stable signing, package/version, native WC icons and Appearance bridge,
  exact packaged HTML/CSS/JavaScript/dictionary notices and an anonymous download.
  [APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25044686/word-conquest-android.apk), version code `25044686`, SHA-256
  `25e48143ec871ce1cfebb33ecd5085722412e3e00b7ba085a42180f59b57f6d5`. Local copy: `dist/word-conquest-0.11.1.apk`.
- No backend, schema, gameplay, native
  permissions, dependency or service changes. Original prototype and galleries
  remain available. Actual browser/device rendering is unavailable in this session.

## Login refinements — 17 October 2026, round 2 for review

- The owner requested a new synthesis: Territory layout (round 1 option 3),
  tile-built name (option 1), and WC/castle identity (option 2). Three new concepts
  in design/login-refinements: **Crest**, **Connected**, and **Monogram**.
- Each combines a forest header and ivory form with a distinct arrangement of
  the real board tiles and shared WC paths. No slogans or introductory copy.
  Review navigation is separate from the proposed app interface.
- Source artwork rendered and inspected; connected-board tile alignment refined.
  CSS/JS parse, HTML structure/links and isolated preview handlers pass. Portrait
  dimensions reviewed at 320×568 through 430×932. Browser inventory remains empty:
  phone browser rendering, keyboard behaviour and touch comfort are unverified.
- [Published round 2 gallery](https://xnorbertx.github.io/word-conquest/previews/login-v2/):
  source 3820a74, Pages 651f5c6. All six public files match the committed
  source. Live web/prototype and all six first-round files also match their
  original assets. The owner selected option 3 without its background WC;
  implementation and release are recorded above.

## Login concepts — 17 October 2026, first round

- Three isolated concepts in design/login-concepts: **Letter tiles**, **Castle
  mark**, and **Territory**. The game name replaces the slogans and introductions.
  Essential login actions stay, with a separate 1–2–3 review switch.
- Uses the actual board tile/castle geometry, WC monogram, familiar colours and
  serif typography. Solid backgrounds, safe-area padding, 16px input text and
  short-screen adjustments. No external assets or services.
- CSS/JS parse, local HTTP responses, heading/label/link checks and SVG artwork
  inspection pass. Responsive dimensions/text metrics reviewed at 320–430px.
  Browser inventory is empty and IAB is unavailable, so rendered-phone appearance
  and real keyboard/touch checks are not claimed.
- Preview controls cannot authenticate, send requests or store credentials; the
  CSP blocks connections/forms. Production web/API/APK and earlier galleries stay
  intact. No new costs. Owner selection precedes production implementation.
- [Published phone gallery](https://xnorbertx.github.io/word-conquest/previews/login/):
  source a7e546b, Pages 3b5b738. All six public files match the committed
  source; existing web/prototype assets are unchanged. No Android build or backend
  deployment was triggered. The owner requested the second round above, combining
  elements from all three; no first-round design was approved for implementation.

## Expanded Swedish vocabulary — 17 October 2026, released 0.11.0

- Released 991,634 playable forms: the existing 400,901-word list is retained;
  accented entries from its pinned upstream source and listed SALDO full forms
  add 590,733 entries. MOSKEERNA, OBOKAD and OBOKAT are covered.
- Import normalizes decomposable Latin accents (é/è/ê/ë→e, ü→u, ñ→n, ç→c),
  preserving å/ä/ö. It never removes punctuation/spaces or guesses compounds.
  SALDO proper nouns, abbreviations, multiword entries, affixes and compound-only
  c/ci/cm/sms forms are excluded. Short lemmas such as gå still supply longer forms.
- New Swedish games pin autumn-sv-v3 / swedish-expanded-v2-112709e5233b.
  Earlier Swedish versions still load their original dictionary. Alphabet,
  opening layout, letter weights, scoring and replacement draws are unchanged.
- Reproducible import checks both source hashes and all 128,036 SALDO entries.
  Output integrity and source attribution/licence notices ship with web/APK builds.
  Dictionaries remain lazily loaded on the server; no external lookup during play.
- **SAOL access blocker:** catalogue/API metadata marks saol15-ord CC-BY-4.0,
  but the documented Karp-s search API refused access on 17 October. No SAOL data
  is included and no alternative access route was attempted. Ask
  sb-info@svenska.gu.se for an authorised machine-readable export of saol15-ord
  (https://doi.org/10.23695/eqtv-ee68). Store supplied data locally; no credentials
  in chat. Full SAOL/Wordfeud compatibility is not claimed.
- Owner approved the SALDO/accents release while SAOL access is pending.
  Backend was deployed before clients. Hosted tests use dedicated example.invalid
  accounts and newly created test games only; all were completed or cancelled.
  Existing player games and data were not modified.

Verification: 158 regression tests and the original engine/scoring/supply suites
pass; production build passes. Coverage includes accent distinctions, fragment
filtering, source integrity, all retained words, reported missing words, server
scoring/jokers, old/new dictionary routing, creation retries and old-client gates.
The compact server bundle is 1.98 MB. Its exact membership index was checked
against every pinned word in all three dictionaries. A local bundled-API smoke
test accepted old English/Swedish and the three reported Swedish words; peak
process RSS was 114 MiB with all dictionaries loaded (a local Node measurement,
not hosted Edge verification). Run `npm run build` then
`node --expose-gc scripts/check-dictionary-bundle.cjs` to repeat it.
The client bundle is about 508 KB and contains no word lists. No migration,
new service, dependency or recurring cost is required.

Release verification:

- Source `7ee58cb`; dedicated Supabase `game-api` deployed with no schema,
  secrets, push or infrastructure changes. Existing English and Swedish versions
  remain supported. Seven isolated word fixtures verified MOSKEERNA, OBOKAD
  (including a joker), OBOKAT, both old Swedish versions and English. OBOKAT is
  still rejected in v2 without spending a turn. Scoring, duplicate receipts,
  stale revisions and opponent reloads pass.
- A fresh Swedish friend invitation completed **28 word turns**, 14 per player,
  with final totals 110 / 142. Link preview/cancellation, creation retry, old-client
  guards, game summaries and per-version statistics pass. English smoke passes.
  Observed Swedish turn requests averaged 919 ms and the home request was
  566 ms; these are network observations, not a latency guarantee.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published as Pages `041b3a4`.
  All ten public assets match the verified build after line-ending normalization;
  the original prototype and design galleries are preserved.
- [Android 0.11.0-7ee58cb](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25037098), code `25037098`, passed
  [CI](https://github.com/xNorbertx/word-conquest/actions/runs/39059412946), including 158 tests and the original suites.
  Verified stable signing certificate, package/version, notification permission,
  WC icons, native Appearance bridge, exact packaged client/page and SALDO/CC BY
  attribution. No test fixtures or private-key material are packaged. Anonymous
  [APK download](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25037098/word-conquest-android.apk) matches SHA-256
  `b41e80138a52731ef4151915dc0276d8e0b5cb9aea297bdec651e86f1a6829f2`. Local copy: `dist/word-conquest-0.11.0.apk`.
- Update both players or use the current web client, then start a **new Swedish
  game** for this dictionary. Existing games retain their earlier word lists.
  Physical-phone acceptance and Swedish vocabulary quality feedback remain open.
  SAOL needs an authorised export and another immutable dictionary version.

## Dark mode — 17 October 2026, 0.10.0

- Added **You → Dark mode**, a single labelled switch. The existing light theme
  remains the default. The preference is local to this browser/app installation,
  survives sign-out and reopening, and does not alter account/game data.
- An early head script applies the saved palette before CSS/body rendering;
  browser chrome follows the theme colour. A blocked/full local store still allows
  toggling for the session. Other tabs and browser history restore stay in sync.
- Warm charcoal and cream replace ivory; sage/walnut ownership, shape markers and
  gold castles stay distinct. Games, Friends, You, auth, forms, menus, errors,
  score bubbles, selected tiles and the English/Swedish joker keyboard are covered.
  Layout and gameplay remain unchanged.
- Android Appearance bridge updates system bar icons, WebView and inset backgrounds,
  and restores the local native mirror on create/resume. Rapid toggle calls remain
  ordered. The OS launch splash retains the existing ivory branding.
  Uses the existing AndroidX dependency and [system-bar appearance API](https://developer.android.com/develop/ui/views/layout/edge-to-edge-manually).
- Browser inventory is still empty: no rendered-device/phone screenshot claim.
  Theme persistence, failure handling, native ordering and palette contrast are
  checked programmatically; physical phone appearance remains an acceptance check.
- No backend, schema, rule, dictionary, permission, analytics, dependency or cost
  changes. Original prototype and both joker design galleries stay available.

Local verification: **150 regression tests** and original engine/scoring/supply
suites pass; production and isolated fixture builds pass. Actual account DOM checks
verify the switch, icon, persistence and browser colour. Ten English/Swedish game
DOM scenarios still pass. CSS parses without warnings. Selected palette pairs meet
4.5:1 text contrast (including small tile values) and 3:1 castle-marker contrast.
These are programmatic checks, not rendered-phone inspection.

Release verification:

- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `133da47`, Pages `a343ce2`.
  All ten public assets match the tested build after line-ending normalization.
  Only the online HTML/CSS/client bundle changed; the root prototype and both
  joker galleries are preserved.
- [Android 0.10.0-133da47](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25028715), code `25028715`, passed the
  [pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/39049278894), including 150 regression tests and original suites.
  Stable signing certificate, package/version, notification permission, WC icons,
  theme bootstrap/switch/controller, compiled native Appearance plugin and matching
  packaged HTML/CSS verified. No private keys or local fixtures are included.
- [Direct APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25028715/word-conquest-android.apk) is available without sign-in; anonymous download
  matches SHA-256 `c6f622a1224888898c67a44d3dbf5df7e7b7a8976ee57d2c28a0b0846ae80037` (4,977,170 bytes).
  Local APK: `dist/word-conquest-0.10.0.apk`; install over the existing pilot.
- Browser inventory remains empty. Rendered phone and physical native-bar
  acceptance are not claimed. No backend deployment, app-store submission,
  new permissions, infrastructure or costs.

## Compact game screen — 17 October 2026, 0.9.4

- The composer is one row: selected letters, undo and Play. Removed the Your word
  heading, starting-tile copy, minimum-length hints, calculation and ready text.
  Actual rejection/offline/pending feedback remains; rules and detailed totals are
  still available in the game menu and score cards.
- Phone layout budgets the visible viewport height, including safe areas and browser
  chrome. Header/cards/gaps are smaller, recent move is one compact row, long words
  scroll inside the composer, and score playback uses a compact caption. Short
  landscape phones use side-by-side board/controls. Accessibility text enlargement
  can still scroll the page rather than clip required controls.
- Zoom now has a bounded two-dimensional viewport. Drag to pan to every corner;
  tap a tile to select it or edit its joker. Fit mode retains drag-to-spell. Zoom
  opens around the last selected tile or board centre, keeps its centre on resize,
  and resets for another game or score playback. Keyboard focus reveals its tile.
- Cancellation, changed game/revision and disabled interaction cannot commit a late
  zoom tap. Panning remains available when waiting for the opponent.
- Browser inventory remains empty, so rendered iPhone/Android inspection and
  physical touch acceptance are not claimed. Controller regressions, fixture build,
  production assets and signed APK verification are tracked below when complete.
- No gameplay, backend, migration, infrastructure or cost changes. Original local
  prototype and both joker galleries remain available.

Local verification: all **143 regression tests** and original engine/scoring/supply
suites pass. Ten production DOM scenarios cover English/Swedish selection, jokers,
clear, waiting, stale, pending and finished states; CSS parses without warnings.
Production and isolated fixture builds pass. These are not rendered-layout tests.

Release verification:

- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `ba55394`, Pages `237a067`.
  All ten public assets match the tested build after line-ending normalization.
  The hosting change is confined to the online HTML/CSS/client bundle; the local
  prototype and both joker galleries are preserved.
- [Android 0.9.4-ba55394](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25021039), code `25021039`, passed the
  [pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/39040058619), including all 143 regression tests and original suites.
  Stable signing certificate, package/version, notification permission, WC icons,
  zoom controller, removed composer text and matching packaged HTML/CSS verified.
  No private keys or local test fixtures are included.
- [Direct APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25021039/word-conquest-android.apk) needs no GitHub sign-in. Anonymous download matches
  SHA-256 `838ec8c1096f11f6d8e084d8682278c9aab3aa77a0312f357d1cddb002a1aafb` (4,972,524 bytes).
  Local APK: `dist/word-conquest-0.9.4.apk`; install over the existing pilot.
- Rendered phone/touch acceptance remains unverified because browser inventory is
  empty. No backend deployment, migration, app-store submission or new costs.

## Word keys joker picker — 17 October 2026, 0.9.3

The owner selected option 2 from the faster joker gallery and requested no visible
instructions or other extra text. The production picker now contains only the word,
QWERTY letter buttons and a close icon. Swedish adds a separate Å/Ä/Ö row.

- A tap immediately assigns a letter; no rail, title, subtitle, helper copy or
  confirmation step. Blank jokers remain blank until chosen and retain zero points.
- The next unassigned joker opens automatically in the same dialog. Word slots can
  be edited independently; closing keeps previous assignments. All letters remain
  available, with no dictionary-based suggestions or gameplay changes.
- Native modal focus/Escape, Android Back and navigation dismissal are integrated.
  Screen-reader labels remain, without visible instruction text. Long words wrap
  within a bounded area; safe-area padding and opaque ivory avoid nested backgrounds.
- Old buttons from a prior choice cannot assign the next joker; held physical keys,
  modifiers and composition events are ignored. Game/revision/turn/selection guards
  recheck before every assignment; stale dialogs close without changing the board.
- Targeted controller and gesture checks pass. Full build/regression/release
  verification is recorded below after completion. Browser inventory is still empty;
  this turn does not claim rendered-phone inspection. The owner reviewed and selected
  the prototype on their phone.
- No backend, migration, dictionary, scoring, board distribution or account changes.
  Both design galleries and the original prototype remain available.

Release verification:

- All **135 regression tests** and original engine/scoring/supply suites pass.
  Production and isolated fixture builds pass. No browser/phone rendering claim.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `489b0f8`, Pages `22c47f3`.
  All ten public assets match the tested build after line-ending normalization.
  Only `online/app.js` and `online/online.css` changed on the hosting branch;
  root prototype and both design galleries are preserved.
- [Android 0.9.3-489b0f8](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-25018969), code `25018969`, passed
  [CI](https://github.com/xNorbertx/word-conquest/actions/runs/39037654134). Verified stable signing certificate, package/version, notification
  permission, WC icons, Word keys markers, removal of the old rail, and matching
  packaged HTML/CSS. No private keys or local fixtures are included.
  [Direct APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-25018969/word-conquest-android.apk) is downloadable without sign-in and matches SHA-256
  `077ca565c6edad26a0f239043dfe80c07cf0053a4d883e6bfb51ad3bdcb439d9` (4,970,878 bytes).
  Local APK: `dist/word-conquest-0.9.3.apk`; install over the existing pilot.
- No backend deployment, migration, app-store submission, infrastructure or new costs.

## Faster joker studies — 17 October 2026, review in progress

The owner likes the Letter lens but finds scrolling to a letter too slow. Three
new isolated prototypes explore direct selection, with blank jokers and no text
fields: **Open lens** (full alphabet, one tap), **Word keys** (QWERTY, one tap), and
**Big letters** (letter group then oversized keys, two taps).

- Sources: [design/joker-speed](../design/joker-speed/README.md). Fixtures use
  current English/Swedish rules and dictionaries with checked scoring. English and
  Swedish, one/two jokers, edits, cancellation, reset and valid sample play work.
- Letter selection is immediate, advances to the next blank, and can be edited.
  Native dialogs provide focus containment/Escape; reduced motion is respected.
- Mobile uses a continuous ivory root/body/game/sheet, without nested phone frames,
  texture/gradient layers or partially transparent paper. One viewport backdrop,
  safe-area padding, dynamic height and decoration reduction protect small screens.
- Functional checks: 18 interaction scenarios plus all 165 concept/language/letter
  combinations passed; JS/CSS parsed without warnings. Fixtures validated 4 samples.
  No network/storage/analytics, new dependencies or production imports.
- **Rendered phone verification is still blocked:** browser inventory is empty,
  both IAB and Chrome tab creation report unavailable, and opening a local preview
  is queued.
  Requested browser access from the owner. DOM checks do not establish appearance.
  Requested review sizes: 320×568, 360×640, 393×852, 430×932 and short landscape.
- The production web app/APK and original preview gallery remain unchanged.
  No backend deploy, data changes, app release or new costs for these studies.

[Preview gallery](https://xnorbertx.github.io/word-conquest/previews/jokers-fast/) published from source `21eafe8`,
Pages `25c78e2`. Hosting reports built; all seven public assets
match the checked source after line-ending normalization, without sign-in. Only
`previews/jokers-fast/` changed on the hosting branch. This confirms publication,
not the outstanding rendered mobile review. Local preview is on port 4179.

## Compact Games toolbar — 17 October 2026, 0.9.2

- Removed the welcome greeting and waiting-turn total from Games, including their
  render logic and unused CSS. Playing/Finished and New game share one toolbar;
  the optional notification prompt sits below it. The Playing count is preserved.
- Narrow-screen spacing keeps all three labeled controls in one row. Existing
  filtering, creation, game cards, invitations and notification actions remain.
- Presentation-only update; no backend, data, rules or dictionary changes.
  Production/fixture builds, nine existing Games/presentation tests and markup/CSS
  inspection passed. No new tests were added for this presentation-only change.
- [Web](https://xnorbertx.github.io/word-conquest/online/) published from source `c138151`, Pages `cd63564`.
  All ten public assets match the tested build after line-ending normalization.
  The original prototype and design gallery remain unchanged.
- [Android 0.9.2-c138151](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24963455), code `24963455`, passed
  [CI](https://github.com/xNorbertx/word-conquest/actions/runs/38974808904) and its full 132-test regression suite plus original suites.
  Verified the existing signing certificate, package/version, notifications,
  WC icons, toolbar markup and matching packaged HTML/CSS. No private keys/fixtures.
  [Anonymous APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-24963455/word-conquest-android.apk) matches SHA-256
  `372625d814aafbf3f9e7092293186fe6d53c32d4db68c4cc6b67a649d778ac32` (4,970,629 bytes).
  Local APK: `dist/word-conquest-0.9.2.apk`; install over the existing pilot.
- Browser inspection was unavailable (no browser surfaces; IAB creation rejected
  as unavailable). Rendered phone layout remains a manual acceptance check.
  No backend deployment, data changes, new infrastructure or costs.

## Username-only Friends — 17 October 2026, 0.9.1

- Removed My code, code formatting/copy/share controls, code rows in search and
  friend options, code-based hints, CSS and fixture fields. Friends starts directly
  with Username search. Internal IDs remain action/relationship keys, not UI text.
- Moved blocked-player management to You → Blocked players, including fresh data,
  unblocking and empty state. Delayed loads cannot open it after navigation/account
  changes. Username editing remains in the profile; game invitation links remain.
- Non-destructive migration 202610170001_username_only_friends.sql replaces search
  and social payload functions. Search matches usernames only, preserving Unicode,
  case-insensitive exact names, short exact names, partial matching, block filters,
  unfinished/deleting-account exclusion and service-only access. No data deleted.
  Legacy code storage remains inert for rollback; API responses omit friend_code.
- All 132 regression tests plus original suites pass. New integration tests verify
  preservation of accounts/friendships/games/invitations, failed code/UUID lookups,
  block/unblock, permissions and API payload filtering. Production/fixture builds
  and DOM checks for search/results/options, Invite, hidden IDs and unblocking pass.
  DOM checks do not substitute for a rendered phone layout check.
- Applied only the expected migration and deployed game-api to existing project
  aumiyyjsdqdazzmdmprl. Live checks using isolated accounts confirm username lookup,
  rejection of raw/lowercase/formatted codes and UUIDs, code-free profile/social
  responses and preservation of the existing friendship. No hosted game, profile
  or friendship mutations were needed. Evidence: work/username-search-live-result.json.
- Released source `5163782`. [Web](https://xnorbertx.github.io/word-conquest/online/) is live from Pages
  `fb1d674`; Pages succeeded and all ten public assets match the
  tested build after line-ending normalization. Root prototype and gallery remain.
- [Android 0.9.1-5163782](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24962913), code `24962913`, passed
  [CI](https://github.com/xNorbertx/word-conquest/actions/runs/38973868635). Verified stable signing certificate, package/version,
  notifications, WC icons, matching HTML/CSS, absence of friend-code UI/logic,
  and no private keys/fixtures. [Anonymous APK](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-24962913/word-conquest-android.apk) matches
  SHA-256 `cbe15a13b8893e69759841fb42dd75b35ace9f1b54d135c8292208867bda11a0` (4,970,685 bytes).
  Local copy: `dist/word-conquest-0.9.1.apk`; install over the existing pilot.
- No new costs, infrastructure, game rules or dictionary changes. Phone layout
  acceptance remains a manual check; DOM behavior and packaged assets are verified.


## Letter lens and balanced castle jokers — 16 October 2026, 0.9.0

- Owner selected prototype 3, Letter lens, with blank unassigned jokers. The live
  implementation replaces text fields with a native modal: local board context,
  enlarged letter, swipeable alphabet, word preview and Use letter confirmation.
  Tap a selected joker on the board or in the word to edit it. Cancel preserves
  the assignment; confirmation sends a small letter animation back to the tile.
- English A–Z and Swedish A–Z/Å/Ä/Ö work without invoking a phone keyboard.
  Keyboard arrows/letter shortcuts, accessible joker labels, native dialog focus,
  Android Back and reduced motion are supported. Drag selection opens the lens
  after release; pointer cancellation does not open it. Revision/turn changes
  invalidate an open picker before it can assign a stale letter.
- New English autumn-v4 and Swedish autumn-sv-v2 openings keep six jokers: one
  per starting block and one neutral joker adjacent to each corner castle. Each
  left/right pair is reflected for equal access, with varied nearby offsets;
  neutral jokers stay outside starting neighborhoods and are never adjacent to
  another joker. The old generator balanced left/right reach but did not ensure
  top/bottom castle coverage. Letter category budgets and scoring stay unchanged.
- Previous pinned engines/configs and existing game boards remain unchanged.
  The server creates and persists new layouts; create retries retain them.
  Both clients must advertise the new version to join/play a new-layout game.
- Verification: 127 regression tests plus original engine/scoring/supply suites,
  including 800 seeded bilingual openings, legacy-generation equivalence,
  picker confirmation/cancellation, immediate swipe confirmation, keyboard and
  gesture handling, stale assignment rejection and server joker scoring.
  Four production-app DOM scenarios cover both new/legacy language versions;
  CSS parsing and production build pass. These are not rendered-browser tests.
- Deployed game-api to the existing project aumiyyjsdqdazzmdmprl. Two isolated
  hosted test games passed four joker-word turns (including Swedish accents),
  balanced placement, create/turn retries, stale/old-client guards, invitation
  acceptance, opponent reload, game summaries and statistics. Both test games
  ended by resignation; no real player games were changed. Evidence is in the
  ignored work/lens-live-result.json. No migration, dictionary change or new cost.
- Released source `e0d6ae8`. [Web app](https://xnorbertx.github.io/word-conquest/online/) is live from Pages commit
  `03d28b0`; Pages built successfully and all ten public assets match
  the tested build (normalizing Windows line endings where needed). Original root
  prototype and separately published joker gallery remain available.
- [Signed Android 0.9.0-e0d6ae8](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24962119), code `24962119`, passed
  [CI](https://github.com/xNorbertx/word-conquest/actions/runs/38972487191) including all tests and the native build. Package/version,
  notification permission, WC icons, Letter lens/new rules, packaged HTML/CSS,
  existing signing certificate and absence of private keys/fixtures were checked.
  [Anonymous APK download](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-24962119/word-conquest-android.apk) matches SHA-256
  `caa160facebc6c0000bf5aed54fc9007d62f998ac9036c04b21451d7ee6d2788` (4,971,079 bytes).
  Local copy: `dist/word-conquest-0.9.0.apk`. Install over the existing pilot.
- Physical phone scrolling, animation and small-screen/large-text acceptance
  remain open: browser tools expose no inspectable surfaces in this session.
  No new costs, app-store submission, migration or real-player data changes.


## Joker interaction prototypes — 16 October, design review

- Created an offline [comparison gallery](../design/joker-interactions/index.html)
  and three interactive HTML pages: Tile bloom, Word dock and Letter lens. Each
  uses the current board geometry, castles, palette and compact score cards.
- No text-field entry or system keyboard: choose directly near the tile, from a
  word-level letter pad, or from a swipeable preview with explicit confirmation.
  Symbols (asterisk/infinity/layered tiles), language, one/two jokers and reduced
  motion can be compared independently. Assigned tiles retain a wild marker and
  zero letter points; tapping the tile or word slot edits the letter.
- Generated four fixed-path fixtures with the pinned English/Swedish dictionaries
  and current game engine. Valid substitutions, WORD/FÅR examples and score totals
  are checked. No production dependency, gameplay, server or Android change.
- Sixteen DOM-level scenarios passed across all concepts/languages/joker counts:
  assigning/editing, lens cancellation, valid/invalid words, playing/restarting,
  symbol changes, full alphabets, keyboard activation and Escape. JavaScript and
  CSS parsing pass. This does not simulate real keyboard/touch or browser layout.
- Local gallery: http://127.0.0.1:4178/ (also opens directly from disk). The browser
  tool reports no available surfaces; opening the preview in Codex was queued.
  Actual rendering, small-screen layout and touch/animation feel need owner review.
  Superseded by the owner’s selection of option 3, Letter lens, above.
- At the owner’s request, published the gallery for phone review at
  [https://xnorbertx.github.io/word-conquest/previews/jokers/](https://xnorbertx.github.io/word-conquest/previews/jokers/). Pages commit
  `9ee8bed` built successfully. All seven public preview assets match the reviewed
  source. Only `previews/jokers/` changed in the hosting branch; app/prototype
  assets are preserved. Existing free hosting, no sign-in or new service costs.

## Mobile joker input — 16 October, 0.8.3

- Reproduced the reported pattern with the existing event handler: a composing
  keyboard shows a typed letter in its field while the board remains ?, and
  selecting another tile rebuilds the field from the empty joker map. A keyboard
  sending non-composing input updates correctly. The affected device/keyboard
  remains unconfirmed; this is a confirmed code defect and likely explanation.
- Joker letters now update the board, word validation and submission map on every
  input event, including composition. The input value is left untouched until the
  keyboard commits, blurs or reports a non-composing change. Removed the native
  character-length cap so combining marks can form Å/Ä/Ö. The shared normalizer
  still allows exactly one letter from the game's alphabet. Late events from
  detached/replaced fields cannot overwrite a new selection.
- Added event-sequence regression coverage and authoritative English/Swedish word
  acceptance while composition remains active. All 123 regression tests and the
  original engine/scoring/supply suites pass. Production/fixture builds pass.
  No browser surface was available; physical keyboard confirmation is still needed.
- Published source `a4372f5` to the [web app](https://xnorbertx.github.io/word-conquest/online/).
  Pages `e888d4d` built successfully; all ten public assets match the tested
  output after newline normalization. The original prototype remains unchanged.
- [Android 0.8.3-a4372f5](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24954421) (`24954421`)
  passed the [pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/38957367910) with all 123 tests. Verified stable signing,
  package/version, notification permission, WC icons, packaged joker handler,
  matching HTML/CSS and fixture/private-key exclusion. Anonymous APK download
  matches SHA-256 `9183e41e8327ccc78bdca36dda184f67b181e682f2a6dd0ac2358aa6e6419166`.
  Local APK: `dist/word-conquest-0.8.3.apk`. No backend changes or new costs.

## Remove redundant page titles — 14 October, 0.8.2

- Removed the visible Your games, Friends and Your corner page titles. Games keeps
  its greeting and New game action; Friends keeps My code above search; You opens
  directly with the profile card. Compact action rows close the old heading space.
- Named section landmarks preserve screen-reader navigation. Bottom navigation,
  controls, backend and game data remain unchanged.
- All 116 regression tests and original engine/scoring/supply suites pass. Web and
  fixture builds, built HTML/control checks and CSS parsing pass. Physical Seeker
  visual acceptance remains open.
- Published source `5aab793` to the [web app](https://xnorbertx.github.io/word-conquest/online/); Pages
  `7a837db` built successfully and all ten public assets match the tested build.
- [Android 0.8.2-5aab793](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24734923), version code `24734923`,
  passed the [pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/38524353462). Verified the stable signing certificate,
  package/version, notification permission, retained WC icons, packaged HTML/CSS,
  and anonymous APK download. SHA-256: `a147868fd8cd571cdbc7b75a57d119f6c15d6a41b0487fbb97ac6071d189dad7`.
  Local APK: `dist/word-conquest-0.8.2.apk`. No backend change or new service costs.

## Compact overview and supporting screens — 14 October, 0.8.1

- Games use two rows: opponent and scores, followed by status, language and updated
  time. Removed the separate language footer, divided score section, redundant
  avatar/status dot and invitation helper sentence. Scores remain prominent and
  always put You first. Long names truncate visually but remain complete in the
  button's accessible label and title; that label also identifies each score.
- Cards have smaller padding/gaps and fluid height; metadata can wrap at enlarged
  text sizes. Invitations/cancelled/declined invites omit misleading zero scores.
  An incoming invitation no longer sits above a redundant empty-games illustration.
- Incoming invitations show name plus Invitation/language. The acceptance sheet
  groups inviter and language in one summary row and keeps rules in a single short
  paragraph. Friends/activity rows and page headings have less excess space;
  an unused friend-search status strip collapses until needed. Account setting
  notes share their label row where space permits.
- Notification enablement is a compact inline banner with an explicit Enable
  control. Blocked/error explanations remain visible, with Settings/Retry and full
  accessible button labels. Enable/dismiss controls retain 44 px targets. Board,
  gameplay, backend, scoring, dictionaries and stored games are unchanged.
- Added a compact fixture with English/Swedish, long names, four-digit scores,
  incoming/outgoing invitations and completed results. Production/fixture builds
  pass. Browser inventory is empty and opening the in-app browser is unavailable;
  rendered 320/390 px, enlarged-text and physical Seeker acceptance remain open.
  All 116 regression tests and the three original engine/scoring/supply suites
  pass. CSS parses without warnings and production bundles exclude fixture/key
  material.
- Released source `86dc572` to the
  [web app](https://xnorbertx.github.io/word-conquest/online/). Pages `7c58370`
  built successfully; all ten public assets match the tested build after newline
  normalization. The original root prototype is unchanged. No backend deployment.
- [Android pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/38472419346) passed all 116 tests, compilation and stable signing.
  Published [0.8.1-86dc572](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24702098), version code `24702098`.
  Verified package/version, existing certificate, notification permission, WC icons,
  compact card/Swedish support, matching CSS and fixture/private-key exclusion.
  Anonymous download matches SHA-256 `1e2d3a07ae122389554480e94b22b8aee8cf5ef943ed115a4edaa74c1a29814f`.
  Local APK: `dist/word-conquest-0.8.1.apk` (4,964,665 bytes).
  Install over the current pilot. No new service costs or owner setup actions.

## Swedish games — 13 October, 0.8.0

- New game and direct friend invites now ask for English or Svenska first, remembering
  the last selection on the device. Invitations, game-card footers and game headers
  identify the language. The interface stays English.
- Added a pinned, MIT-licensed Martin Lindhe word-list snapshot: 400,901 lowercase
  words, listed inflections/compounds only. Å/Ä/Ö are distinct letters in generation,
  replacement, scoring and jokers; input normalizes decomposed Unicode. Swedish
  weights and letter-point groups are separate, while castle income, unlimited
  captures, random starter, six jokers and equal final turns are preserved.
- Rules/dictionary versions bind the language permanently. English games and frozen
  historical versions are unchanged; old clients must update to play Swedish games.
  Stats already separate versions. No schema migration or new service is required.
  Both dictionaries are server-only and lazily constructed for turn requests.
- Added automated coverage for pinned dictionary integrity/policy, 100 seeded boards
  and replacements, Å/Ä/Ö words and jokers for both seats, server score/animation
  agreement, rejected wrong-language dictionaries, saved mixed-language lists and
  boards, create retries, old-client guards, stale turns and a complete saved Swedish
  game with duplicate receipts and final scoring. Local Swedish board/list/invitation
  fixtures are available. Browser automation is unavailable in this session; visual,
  Seeker keyboard and Swedish vocabulary/balance acceptance remain open.
- All 116 tests and the three original engine/scoring/supply suites pass; production
  and fixture builds pass. The initial 10.56 MB API upload exceeded the service limit;
  gzip/base64 deployment payloads reduce it to 2.40 MB. Exact round-trip dictionary
  checks pass, and the browser bundle is 485 KB without either word list.
- Deployed game-api to the dedicated existing project, with no SQL migration.
  Existing isolated test accounts completed a fresh, unseeded Swedish friend game:
  30 words (all containing Å/Ä/Ö), 15 turns each, final scores 91–94. Verified link
  preview/cancellation, addressed invitation labels, old-client join/play gates,
  creation/turn retries, stale rejection, opponent reload, list totals and separate
  statistics. An English link game also accepted a dictionary word and completed
  through resignation. No real-player games or accounts were changed.
- Observed Swedish turns averaged 1,002 ms (first 1,033 ms); subsequent Games reads
  took 377 ms (Swedish test) and 530 ms (English test). These are individual hosted
  smoke measurements, not a performance guarantee or a controlled comparison.
- Released source `e30c641` (feature `b563faa`) to the
  [web app](https://xnorbertx.github.io/word-conquest/online/). Pages `4974c27`
  built successfully; all ten public assets match the tested build after newline
  normalization, including the unchanged root prototype. The final source change
  pins letter-weight metadata and does not change these runtime assets.
- [Android pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/38469352948) passed all 116 tests, compilation and stable signing.
  Published [0.8.0-e30c641](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24700666), code `24700666`.
  Package/version, notification permission, WC icons, Swedish language support,
  fixture/private-key exclusion and the unchanged pilot certificate were verified.
  Anonymous APK download matches SHA-256 `cfb8b79e28df561a630f583a84a8754ce581f588ca2616aa53d20342a2ae1982`.
  Local APK: `dist/word-conquest-0.8.0.apk` (4,964,344 bytes).
  Install over the current pilot. Both players need 0.8.0 or the current web app
  for Swedish games. No new recurring costs or owner setup actions.
  See [dictionary, balance and maintenance policy](LANGUAGES.md).

## Fortified castle territories - 13 October, 0.7.3

- Approved Fortified edges replaces small stars with gold battlement outlines.
  The centre has a taller middle tower and stronger border. Player fills, ownership
  dots/rings, letters and selection/focus feedback remain visible. Accessible tile
  labels include castle type, income and current territory value.
- A saved word's actual castle ownership changes animate together in 560 ms:
  lift, colour change, settle and one fading ripple. Playback happens after word
  points and before castle income/territory; no extra points are invented.
  Already-owned castles and refreshes do not play capture effects. Opponent moves,
  final replies and explicit recap replay share the same receipt-driven flow.
  Existing duplicate suppression, Skip, navigation/background cancellation and
  reduced motion apply. Reduced motion changes ownership without an added delay.
- This is a client update only: no backend, database, rules, dictionary or service
  changes. The original prototype remains available.
- All 108 tests pass (104 regression/receipt tests plus four controller tests),
  as do the three original engine/scoring/supply suites and production/fixture
  builds. New checks cover steals/neutral captures for both players and all rules
  versions, no animation on retained castles, multiple castles, final replies,
  exact score balances, reduced motion and cancellation during capture.
  Browser automation is unavailable in this session; visual inspection at phone
  sizes and the physical Seeker capture/upgrade check remain open.
- Released source `08cb0df` to the [web app](https://xnorbertx.github.io/word-conquest/online/).
  Pages `6e6d770` built successfully; all ten public assets match the local
  build after line-ending normalization, including the unchanged root prototype.
- [Android pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/38314206227) passed all 108 tests, compilation and stable
  pilot signing. Published [0.7.3-08cb0df](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24616906), version code
  `24616906`. APK package/version, notification permission, WC icons,
  castle capture bundle and absence of fixture/private-key material were verified.
  Anonymous download matches SHA-256 `a3c1a2af9fb1cb07ba09e5f2118346034da75bf07ead01201d64beddc2b87ad5`.
  Local APK: `dist/word-conquest-0.7.3.apk` (4,960,124 bytes).
  Install over the existing pilot; no additional cost or backend deployment.

## Saved screens and faster reads - 7 October, 0.7.2

- Games and the twelve most recently viewed boards survive reopening. A bounded,
  seven-day local cache is scoped to the current account and backend. It contains
  minimal profile/list data, boards and one recap, excluding emails, friend lists,
  inboxes, invitation tokens and full move logs. Sign-out, account change,
  unfinished username setup and lost access invalidate it. Storage failure falls
  back to memory. Cached boards are visibly Updating and cannot submit new turns
  until refreshed; existing saved operations retain their idempotent retry path.
- Opening a game link or Android notification loads that game first. The validated
  game reply includes the caller's profile; Games refreshes separately. Overlapping
  board reads share a request, and navigation/account/revision checks discard late
  responses. Confirmed moves update both cached board and list before returning.
  Account/Friends controls wait for complete profile fields omitted from the cache;
  early navigation cannot overwrite preferences or copy a missing friend code.
  Push reconnection starts after identity verification even when startup navigation
  changes before the original loading request completes.
- Service-only `wc_read_home` and `wc_read_game` combine the remaining data reads.
  Auth, rate limits, profile/onboarding checks, participant filtering and rules
  compatibility still run. Latest recap only on open; Move history loads fifty
  records at a time. Full logs, receipts and statistics remain on the backend.
  Old clients keep their original response, including single-player invitations.
- Allowed CORS preflights may be cached for ten minutes. Every actual request
  still authenticates. Server-Timing now separates auth, guards and data reads;
  dictionary Set construction is deferred until a turn actually needs it.
- Hosted comparison alternated four old/new read pairs on the existing isolated
  test identity, with no emails or game changes. Mean Games latency: 676 -> 542 ms
  (20% less); game open: 743 -> 555 ms (25% less). Ranges: Games 646-734 vs 514-594 ms;
  game 671-878 vs 482-599 ms. A 36-move game's initial response fell 44,219 -> 6,537
  bytes (85%); separately fetched history, boards, scores and stats matched exactly.
  Successful preflight returned max-age 600. Timing samples are observations,
  not a guarantee: network/edge overhead remains roughly 250-385 ms in this run,
  on top of 213-281 ms measured inside the optimized request handler.
- Browser checks with four-second response delays: cached boards appeared in
  217-266 ms from local fixture navigation; cached Games in 216-238 ms. No home
  or history request blocked the first board. Cached input remained disabled until
  verification. Rapid navigation, failure/recovery, logout/cleared-cache sign-in,
  pagination through 62 moves, and a lost turn response retried with one commit
  passed. Updated totals immediately appeared in Games. 320/390-wide checks fit;
  browser warnings/errors were absent. These are desktop browser fixtures, not
  measured Seeker startup times. Web still needs its application files to load.
- Additive read migrations and compatible API deployed to the dedicated project.
  All 102 automated tests and the three original engine/scoring/supply suites pass;
  production browser/function bundles build successfully. New SQL/API/cache tests
  cover access gates, legacy invitations, pagination, corruption/quota/expiry,
  owner isolation, bounded storage, score equivalence and preflight authentication.
  Physical Seeker upgrade/reopening responsiveness remains acceptance.
  No new infrastructure, scheduled keep-alive, paid plan or scoring-rule change.
- Released final source `f86c1df` (main implementation `069b43f`) to the
  [web app](https://xnorbertx.github.io/word-conquest/online/). Pages `592f274` built;
  all ten checked public assets match the final build after line-ending normalization,
  including the preserved original prototype.
- [Android pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/37687076619)
  passed all tests/build/signing checks at that source. Published
  [0.7.2-f86c1df](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24181646),
  version code `24181646`. Package, version, stable signing certificate, native WC
  icons, notification permission and new client bundle were verified; no fixtures
  or private-key material are packaged. Anonymous download matches SHA-256
  `701523db37ca2185b05e65c2dca072a5bd9faf8be7563b51a74c04f3afe448bf`.
  Local artifact: `dist/word-conquest-0.7.2.apk` (4,959,222 bytes).

## Games performance and UI refinements - 7 October, 0.7.1

- Removed the redundant opponent-waiting card and the Record section on You.
  The client no longer requests statistics when opening You; backend results,
  statistics and exports remain intact for the future analytics surface.
- Replaced player-facing table/seat metaphors across loading, signup, invitations,
  game options, profile editing and privacy. Internal identifiers and the preserved
  prototype/design reference are not product copy.
- Shared WC monogram: a curved C frames a W. Vector paths in assets/monogram.json
  drive the web header, Android launcher/splash and monochrome notification icon.
- Investigation: Games navigation waited for the home endpoint, which returned
  every board, ran independent reads sequentially and looked up names once per
  game. The new client displays its current session's saved list immediately,
  refreshes in the background and shares overlapping requests. Confirmed game
  snapshots update the list before navigation. Request generations and account
  checks discard reads started before a newer move or a session change.
- The API batches opponent names, overlaps independent queries and returns compact
  game summaries to capable clients. Older APKs still get the full game shape.
  Authentication, participant filtering, rate limits and username gates remain.
  There is no database migration or scoring change.
- Hosted read-only comparison on an existing isolated test identity (seven games):
  response shrank from 48,834 to 7,491 bytes (84.7%). Four before samples were
  1,193 / 1,219 / 1,025 / 971 ms; immediately after deployment 2,097 / 1,690 /
  678 / 719 ms. Cold deployment/network variability remains; these are observations,
  not a latency guarantee. Test authentication sent no email and changed no games.
- Validation: original engine suites and all 90 tests passed. New coverage includes
  shared reads/retries, account isolation, invalidation, batched/scoped name lookup,
  exact scores for all three rules versions, legacy clients and access gates.
  Phone browser checks: Games appeared within a 98 ms tool round trip while its
  server reply was deliberately delayed four seconds; three repeated taps shared
  one request. A later refresh did not navigate away from You. A newly accepted
  83/55 score appeared immediately when returning to Games. 320/390-wide views fit
  without horizontal overflow; console errors were absent.
- Backend optimization deployed to the existing dedicated Supabase project.
  Hosted checks matched all seven summary scores/names to legacy full-board
  responses, loaded saved game/history and confirmed statistics remain available.
- Released source `72713e1` to the [web app](https://xnorbertx.github.io/word-conquest/online/).
  Pages `818e90b` built successfully; all ten public assets match
  the verified build after line-ending normalization. The root prototype is preserved.
- [Android pipeline](https://github.com/xNorbertx/word-conquest/actions/runs/37538519588) passed at the same source.
  Published [0.7.1-72713e1](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24098852), code `24098852`.
  APK signature/package, new UI and icon resources, notification permission and
  absence of test fixtures/private keys verified. Anonymous download matches
  SHA-256 `2e8e1a423efd82c6520aec54632dbeccdd776165035c4f9cfad56e7725a36c64`. Local APK: `dist/word-conquest-0.7.1.apk`.
  Remaining owner check: in-place Seeker upgrade, icon and responsiveness on device.
  No new services, paid infrastructure or ongoing costs.

## Board score animation and simpler player cards - 6 October, 0.7.0

- Implemented the owner's chosen option 3 in the actual online/Capacitor client.
  Letter points and length bonus, held-castle income, territory gains and territory
  deductions rise from the board and travel to the relevant player's balance.
  Castle income only appears when the saved receipt closes a round, including
  both owners and final replies. Refresh turns can show earned castle income too.
- Cards now show only You/opponent name, the large total and the existing shape
  marker/seat colour. A quiet border marks the current turn; the turn line stays.
- Animation plans reconcile server-reported before/after totals and the latest
  receipt; missing, stale or inconsistent receipts fall back to the saved board.
  The saved game is never modified by playback. Old letters are reconstructed for
  the animation; the real replacement letters return when it finishes.
- New submitted and received moves play once per account/game/revision on this
  device. The local seen marker is claimed before playback, so cancellation,
  duplicate updates and retries cannot replay automatically. Returning players see
  the latest unseen opponent move; the last-move sheet also has Replay points.
  Skip, navigation, backgrounding, layout changes and scroll restore current state.
  Reduced motion uses static point labels and sequential balance updates.
- Validation: three original engine suites plus 86 tests passed, including nine
  new receipt/ledger tests covering both seats, both castle owners, legacy rules,
  incomplete/final rounds, jokers, refresh income, inconsistent receipts, duplicate
  revisions, device reopening, account isolation and unavailable storage.
- Local browser checks passed own moves in both seats, incoming moves, skip,
  leaving/reopening during playback, manual replay, a lost-reply retry with one
  commit, final-game restoration, and the forced reduced-motion fixture. The
  320-wide long-name layout fits without horizontal overflow; no console errors.
- Released source `f76456c` to the existing [web app](https://xnorbertx.github.io/word-conquest/online/).
  Pages build `8642e7c` succeeded; all ten checked public assets match the built
  files after Git line-ending normalization. The root prototype is unchanged.
- [Android CI run](https://github.com/xNorbertx/word-conquest/actions/runs/37525868326)
  passed at that source. Published [pilot 0.7.0-f76456c](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24092536),
  version code `24092536`, using the existing stable signer. APK package/version,
  signature, notification permission, new animation bundle and absence of test
  fixtures/private-key material were checked. Anonymous APK download matches
  SHA-256 `bbf32b49bea92ca7e7c8f11b2e521e6aa5ef873c16705485c9392d6c742c8935`.
  Local copy: `dist/word-conquest-0.7.0.apk`.
- Remaining owner acceptance: install over the existing Seeker pilot and judge
  animation timing/feel on the physical device. No backend migration, scoring-rule
  change, new service or added ongoing cost.

## Score animation concepts - 6 October, local design review

- Added four separate HTML/CSS/JS prototypes and a comparison gallery in
  `design/score-animations/`: score ribbon, paper receipt, points from the board,
  and round-end reveal. Each has replay, normal/slow/quick speed, reduced motion,
  and a skip-to-result control. Uses the current ivory/sage/walnut style.
- Shared fixture is generated and asserted against the real autumn-v3 engine
  and dictionary: GARDENS earns 19 word points, 6 castle income and 6 territory;
  the opponent loses 3. Totals move from 84/79 to 115/76. Castle income is paid
  after a full round, not every turn. The board option splits the 9 letter points
  and 10 length bonus, plus separate 2/4 castle payments.
- Local browser checks verified all four sequences and intermediate totals,
  replay interruption, skip, reduced motion and responsive 390/320-wide layouts.
  No horizontal overflow. Very short screens can scroll. Fixture assertions and
  JavaScript syntax checks passed. Browser automation tested through localhost;
  direct file URLs are blocked by the browser tool, so file-opening support is
  based on plain relative scripts/styles without imports, fetches or dependencies.
- The gallery awaits the owner's design choice. Live game, server, scoring,
  original prototype and APK are unchanged. No deployment or ongoing cost.

## Separate first-time username setup - 5 October, 0.6.2

- Owner clarified the flow: signup uses email/password only; authenticated new
  accounts see a separate username screen. The screen contains Username,
  Randomize, Continue and Sign out, without field explanations. Existing names
  remain set and those accounts skip this screen.
- Migration `202610050001_username_onboarding.sql` and `game-api` deployed.
  `profiles.username IS NULL` is the durable incomplete flag. App reopening,
  another device, recovery and deep links cannot bypass it. Game/social actions
  are gated in the API; unnamed accounts are excluded from search, including code
  search, and cannot send/receive friend requests. Signup metadata cannot set a name.
- Randomize proposes an availability-checked readable name; Continue claims it
  under the unique index. Row locking makes first completion win across devices;
  retries return the existing name, including after a later normal profile rename.
  Pending invitations and notification targets resume after setup. Existing
  accounts and the original prototype are preserved.
- Three original engine suites plus 77 tests pass. Added database/API coverage
  for missing-name persistence, metadata bypass attempts, uniqueness, concurrent
  completion/retries, clearing prevention, short-code search exclusion, access
  controls, deletion before setup, and bounded random suggestions.
- Browser fixtures verified email/password-only signup, confirmation handoff,
  separate setup after sign-in, Randomize, duplicate feedback, unfinished setup
  after reload, saved-name retention after a lost reply/retry/reload, invitation
  resumption and 390x844/320x640 layouts. Physical Seeker acceptance remains open.
- Hosted verification passed with one retained example.invalid test account:
  account creation without username; two-session pending state; blocked game,
  friend and profile actions; hidden friend-code lookup; old-client update message;
  random suggestion without reservation; duplicate-name 409; two simultaneous
  completions returning the same winner; delayed retry and sign-out/relogin
  retaining the saved name; completed profile becoming searchable. All eight
  pre-existing profiles retained their names/IDs. No email or push sent and no
  real player/game changed.
- Source: `5d76bf119599aa34841ba7004661317a568d6c7d`. Web build pushed to
  gh-pages commit `b25252d7685c5ccca8d22d9eb0d4b26d448e71d6`. Pages reports
  building and the public online assets still serve 0.6.1 at this checkpoint.
  The matching Android Actions run `37372286774` is queued. GitHub reports
  [runner assignment/start delays](https://www.githubstatus.com/incidents/3q1yb5m7ltvb)
  since 19:11 UTC on 5 October. Do not describe either queued job as passed.
- Built locally instead using the installed JDK/SDK: Gradle succeeded, then
  package/version, notification permission, original pilot signing certificate,
  bundled onboarding code and absence of private keys/fixtures were checked.
  APK: `0.6.2-5d76bf1`, version code `24008064`, 4,948,708 bytes.
  SHA-256: `703574ae246609ca80ab021696171b0f30dc37a282be55b3afa8ffbe1be5b96d`.
  Local file: `dist/word-conquest-0.6.2.apk`.
- [Pilot release](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-24008064)
  published from that verified local artifact. Anonymous download returned HTTP
  200 with the expected checksum. It bundles the new UI and connects to the live
  migrated backend independently of the pending Pages rollout. No new cost,
  service, data deletion or app-store submission. Physical Seeker upgrade and
  post-queue web asset verification remain open; existing players keep working.

## Unique usernames - 4 October, 0.6.1

Historical release; its signup-name requirement is superseded by 0.6.2 above.

- Owner promoted unique names into this iteration. Signup requires a username;
  it is also the visible identity in games, Friends, recaps and notifications.
  Existing six profile names (three player accounts and three test accounts) were
  verified unique and migrated unchanged, preserving IDs, games and friendships.
- Migration `202610040002_usernames.sql` and `game-api` deployed. Auth creation
  and profile reservation share a transaction; a partial unique index enforces
  case-insensitive uniqueness after NFKC normalization and outer-space trimming.
  Existing display_name stays synchronized for installed APKs and RPCs. Renames
  enforce the same rule, including legacy payloads. Auth metadata edits do not
  change the displayed identity. Deletion retries remain safe and anonymized.
- Signup availability exposes a boolean only, with clear conflict feedback beside
  the field. Email/password login and recovery remain unchanged. Unconfirmed
  accounts reserve their username until renamed/deleted; no automatic cleanup.
  Policy and reuse semantics are in PRIVACY.md. Names use 1–40 letters/numbers,
  spaces and simple punctuation, with at least one letter or number.
- Three original engine suites and 70 integration/service/controller tests pass,
  including 11 new username tests. Local phone browser checks cover required
  signup entry, duplicate-name feedback, email-confirmation handoff, sign-in,
  rename conflict/success, and 390x844/320x640 layouts.
- Hosted verification: concurrent real Auth creations with the same username
  produced exactly one account/profile; missing username failed atomically.
  Anonymous availability rejected case/width variants, profiles stayed hidden,
  rename conflict returned 409, old payload remained compatible, and home/search
  displayed canonical names without emails. All six existing names/IDs remained
  unchanged after the checks. One isolated example.invalid test account was added
  and retained; no email/notification sent or real player/game changed.
- Release source: `5ba714eb60f9574210b640f82b6c5d75a4627990`. Pages commit
  `4041f2f6d066382faaeaa425830bfa6f1834eb71` built successfully; all nine public
  assets match the verified build, including the unchanged root prototype.
  Live signup screen inspected; API CORS preflight 204 and unauthenticated 401.
- Android CI [37227714472](https://github.com/xNorbertx/word-conquest/actions/runs/37227714472)
  passed tests/build. APK `0.6.1-5ba714e`, code `23915880`, 4,948,256 bytes;
  package/notification permission and stable original pilot certificate verified.
  No private keys or fixtures included. Local APK: `dist/word-conquest-0.6.1.apk`.
  SHA-256: `3be2cf5d4003fc214b76bb30bb864be4b78467a4caa0845ded255a4b2ab60e93`.
- [Pilot release](https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23915880)
  published; anonymous APK download returned 200 with the verified checksum.
  Install over the existing app. Existing-account login remains compatible with
  older APKs; new account creation requires the username UI in 0.6.1 or the web.
  Physical Seeker upgrade acceptance remains open. No new ongoing cost or service,
  account deletion, game-rule change, or app-store submission.

## Web publishing - 2 October

- Built static app pushed to dedicated gh-pages branch; Pages source configured there.
- Public app URL: https://xnorbertx.github.io/word-conquest/online/.
- Original root prototype preserved; source main untouched.
- Supabase public CORS, APP_URL and Auth Site URL configured; localhost retained.
- All three original test suites and 14 integration tests pass.
- Support inbox deferred by owner; sender chosen as no_reply@word-conquest.com.
- Authentication email delivery confirmed by owner on 3 October. Full signup/reset
  flow acceptance, multi-device/multi-day testing and backup/restore remain.
- Turn-alert email and its scheduling are out of scope by owner decision.
- No new paid plan enabled; existing hosting free-tier limits still apply.

## Hosted backend connected — 30 September

- Official Supabase CLI 2.118.0 installed locally and authenticated. Repository linked
  to the dedicated Free project `aumiyyjsdqdazzmdmprl` (Word conquest, Paris EU).
- Empty public schema verified before applying migration `202609290001_online.sql`.
  Both `game-api` and `notify` deployed using server-side bundling; no Docker needed.
- Ignored `online/config.local.js` contains only the project URL and publishable key.
  Initial localhost-only origin was expanded for public hosting on 2 October.
- Hosted smoke test completed 36 turns, including 35 dictionary words. Final scores
  72–90, equal turn counts, one completed-game result. Every accepted turn was reloaded
  independently from the remote database. Real Auth sessions, invitations, create and
  turn retries, stale rejection, participant access, direct-write denial, recaps,
  statistics, inbox, and unauthenticated function rejection all passed.
- Three isolated `example.invalid` test accounts and their completed game remain in
  the dedicated project. No records were deleted; no email sent. Test passwords/tokens
  were generated and held only in process memory, never logged or committed.
- Reproducible opt-in test: `node scripts/hosted-smoke.mjs aumiyyjsdqdazzmdmprl --create-test-data`.
  Each run creates additional test data; do not run routinely or against another project.
- At this September checkpoint SMTP was pending; on 3 October configured SMTP
  was verified and the owner confirmed receipt of a recovery email. No turn-email
  delivery job enabled or required for the current scope. No paid plans or store releases. Public frontend publishing followed on 2 October.

Local implementation and remaining acceptance work are detailed below.

## Delivered locally

- Root prototype preserved. Separate online web app with Autumn Sunday typography,
  palette, ownership symbols, keyboard selection, joker inputs, score preview, narrow
  layout and board enlargement. A visual-only preview is explicitly labelled.
- Supabase migration and deployed-function source: verified Auth identity, participant
  access, service-only writes, row locking, revision compare-and-swap, actor-bound
  operation receipts, transactionally saved state and inbox events.
- Server validates paths, dictionary, capture limits and turn order; computes points,
  ownership and replacement letters. Secure server randomness. No client scores used.
- Licensed, hashed dictionary snapshot and frozen v1 engine/rules. Existing prototype
  rules and all original engine files are untouched.
- Persistent client pending actions with stable retry IDs, stale-board reload, focus/
  reconnect/visible polling, invitation links/codes, expiry/accept/decline/cancel,
  account login/confirmation/recovery UI, names, lists, recaps and full move history.
- Resignation, mutual draws, unranked 30-day abandonment; grouped completed-game stats;
  inbox/preferences; isolated retrying Resend email function; data export and deletion
  with recent-auth check, account revocation and shared-history anonymization.
- Rate/request limits, active-game cap, RLS/grants, log redaction, operational runbook,
  single owner setup checklist and privacy policy draft. Reuse existing Resend + Zoho.
- Web/function builds and generated/synchronized Android Capacitor project. Native
  directories are ignored; no signing credentials or public store submission.

## Verification completed

- Three original rule/scoring/supply test programs pass.
- PostgreSQL migration executed in PGlite; integration tests check participant RLS,
  service-only grants, invite races/retries, exactly one receipt/inbox event per turn,
  stale rejection, lost-response retry, a complete game reloaded from SQL every turn,
  lifecycle and deletion behavior.
- Server tests cover actor spoofing, wrong turns, illegal words, client score injection,
  rules mismatch, missing dictionary, input bounds and authentication/origin rejection.
- Notification worker tests cover secret enforcement, opt-out, failure retry, stable provider
  idempotency and bounded delivery window. Worker remains dormant/out of scope.
  Separately, a real authentication recovery email was delivered on 3 October.
- Browser preview inspected on desktop and narrow viewport; keyboard selection and
  joker input exercised. No horizontal document overflow observed on narrow layout.
- Package audit after updating Capacitor to 7.6.9 reports zero known vulnerabilities.

## Explicitly incomplete / release gates

- Hosted Auth/API/PostgREST tests pass with isolated confirmed test accounts. Recovery
  email delivery is verified; fresh signup and complete password reset/sign-in still
  need explicit end-to-end acceptance.
- Browser-level interrupted HTTP submission, cross-device session recovery and a
  human multi-day playtest remain required. The automated retry test is not a
  substitute for real-device network interruption testing.
- Public web deployment verified at https://xnorbertx.github.io/word-conquest/online/.
  No separate staging environment provisioned.
- No external monitor, backup job, restore drill or retention job. Turn-email Cron
  is no longer a requirement.
- Dedicated support inbox deferred for friend pilot; operator details and
  privacy/retention approval remain broader-release work.
- No APK/IPA compiled, no signing, no physical-device testing. Android SDK absent;
  installed Java is 19, so a supported build JDK is also required. iOS needs Mac/Xcode. Native deep links, secure token-storage review and APNs/FCM
  are mobile release work; web links currently remain in the web app.
- No public matchmaking/messaging, therefore their conditional moderation milestone
  is not launched. No public app-store release authorized.

The first-online milestone remains pending recovery-flow, operational and
real-device acceptance; hosting and authentication email delivery are verified. Backend deployment alone is not release acceptance.

## Clear game exit - 3 October

Added a visible Cancel game / Quit game button above the board. Waiting games cancel their invitation; active games use the existing authoritative, retry-safe resignation. Successful exits return to Your games to create another invitation. Returning home clears the game URL so reloading does not reopen the exited game. Existing history is retained.

## Live game updates - 3 October

Games now publish updates through Supabase Realtime under the existing participant-only RLS policy. Authenticated clients reload authoritative state on changes and subscription recovery, retaining 20-second polling and focus/reconnect checks as fallback. Test subscriptions received updates for both isolated participants in 303 ms; outsider received none. All existing regression suites passed. Dictionary remains the unchanged 274,804-entry Letterpress-derived v1 snapshot added with the September backend.

## Owner playtest and revised priorities - 3 October

Owner reports real play with 20 actions (19 words and one refresh). This is human
play evidence, not proof of multi-day recovery or of final-result correctness.
Consonant-heavy distribution noted; no balancing change requested. Owner will
run the multi-day test. Turn-alert emails are removed from iteration scope;
authentication email stays, and native push is planned for mobile.
Next: engineering interruption/resume/session tests, then backups/restore and
monitoring. Visual design improvements are deferred.

## Android implementation started - 3 October

Owner approved a directly installable APK, free build-tool installation and push
in the first Android iteration. Target test device: Solana Seeker, Android 16.
Installed dedicated per-user JDK 21 and Android SDK tools/platform 35/build-tools
35.0.0 under LOCALAPPDATA/WordConquestBuild. Existing global Java unchanged.
Added official Capacitor App and Push Notifications plugins. Repeatable Windows
build command: powershell -File scripts/build-android.ps1 (Node 24 bundled path).
Firebase project selection/configuration is pending; Supabase remains the game
backend and FCM is only Android push delivery. Native push is not complete yet.
No APK has passed physical-device acceptance. No paid service enabled.
`scripts/build-android.ps1` subsequently completed successfully, producing a debug APK with current native lifecycle changes. Push configuration and physical-device verification remain pending.

## Android push and automatic APKs - 3 October

Implemented per-phone Android notification consent, turn/invitation-response push,
notification tap routing, logout cleanup and registration refresh. Deployed push
registration/queue migration, push worker, game API wakeup and one-minute Cron retry.
FCM service-account OAuth succeeded; a validation-only request reached FCM and was
rejected only for its deliberately fake device token. No real phone delivery is
claimed. Worker authorization and empty-queue execution passed against hosted Supabase.
Three original rule suites and all 18 integration/service tests pass. Current APK
compiles. Device delivery/permission/cold-start/upgrade acceptance remains pending.

Added a GitHub Actions source-push APK workflow, stable pilot signing, reproducible
native preparation, increasing version codes and downloadable artifact metadata.
Workflow execution status is recorded after its first run. See docs/ANDROID.md.

Verified Android APK pipeline run (supersedes the initial compilation-only runs):
https://github.com/xNorbertx/word-conquest/actions/runs/37155587261
Version `0.2.0-10135a0`, version code `23837708`, 4,910,205 bytes. Downloaded the
actual CI artifact and independently verified its checksum, original pilot signing
certificate, package/version metadata, notification permission and absence of PEM
private-key material. Local copy: `dist/word-conquest-0.2.0.apk`.
APK SHA-256: `b7aecff58ff1457e5013e829ce83a44bfcedbbeeb223e39f144296bb3c0ea6ba`.
The first CI artifacts used a runner-generated signing identity; use the verified
run above or a later successful run. CI now checks both the supplied key and the
resulting APK certificate before upload. Source changes trigger builds; docs-only
changes do not. APK installation remains manual; no public store release occurred.

Native-origin hosted API registration and disable passed with an isolated test
identity; client token-table reads were denied. The test registration remains
explicitly disabled. Local APK signature verified. Physical Seeker delivery and
notification-tap/upgrade checks remain the only way to confirm device behavior.

## Android download without GitHub sign-in - 3 October

Published the verified 0.2.0-10135a0 APK as an Android pilot prerelease:
https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23837708
An anonymous download returned HTTP 200 and matched the previously verified
SHA-256 checksum. Phone users can now use Releases > Assets without a GitHub
account. CI build artifacts remain available separately behind GitHub sign-in.
No app-store publication or new paid service was involved.

## UX overhaul - 4 October

Rebuilt the online client around Games, Activity and You, focused word play,
contextual sheets and one primary action per flow. Removed folds and persistent
technical clutter. Added accessible SVG icons, selection order, ownership rings,
clearer pending/retry feedback, quiet waiting states and compact records.
Updated Android launcher/splash to match. Package version is 0.3.0.
All three original rule suites and 23 integration/service/presentation tests pass;
local Android compilation passes. Controlled browser checks include one-commit
lost-response recovery, stale boards, rejected words, jokers, game navigation,
profile/activity, final results and agreed draw. See docs/UX.md for the scope and
remaining physical-device/owner acceptance. Publication evidence follows below.

Published UX build evidence:

- Source commit: 6ff2644ed5ab7d9522d2e48477d832c8ac240dac.
- Web deployment: gh-pages commit 3be706a57eec077dc6cc1f7e62e28303f3762f31.
  All nine checked public assets returned HTTP 200 and matched the local build;
  the five root prototype files remain unchanged. Published sign-in was visually
  checked at 390 x 844 with no browser warnings/errors. API preflight returned 204
  and an unauthenticated request remained correctly denied with 401.
- CI passed: https://github.com/xNorbertx/word-conquest/actions/runs/37160098609
- APK: 0.3.0-6ff2644, version code 23842588, 4,934,623 bytes.
  Stable pilot signer independently verified; notification permission present;
  no PEM private-key material or local test adapter in APK.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23842588
  Anonymous APK download returned HTTP 200 and matched SHA-256
  dab83ee0b677f1ca80ad653b104635d95a19787e2deae71e99c341181e973ce9.
- Local verified APK: dist/word-conquest-0.3.0.apk.

No new recurring costs or backend migrations. Install over the previous pilot;
physical upgrade and push acceptance are still pending owner/device checks.

## Android notification recovery - 4 October

Owner reported Android permission granted but no turn alerts. Hosted diagnostics
initially found no enabled phone registration. Enabling notifications inside the
app registered the Seeker; a targeted generic FCM test was accepted by Firebase
and the owner confirmed it appeared. This confirms delivery to the real phone;
normal turn/background/cold-start routing and the updated APK still need device
acceptance. No owner game was modified for testing.

Version 0.3.1 adds a home opt-in prompt (dismissible for seven days), confirmed
connection states, retry after failed registration, Android app/channel settings,
and a self-test for only the signed-in account's registered phone. Foreground
notifications now request native presentation and show brief in-app feedback.
Consent survives temporary failures; reconnect happens on resume/sign-in/online.
The server rejects cross-account or disabled-device tests and never returns tokens.

Deployed game-api and push functions; no schema migration or new service.
All three original rule suites and 32 integration/service/controller tests pass.
Local Android compilation passes. Browser fixtures cover opt-in, opt-out, retry,
blocked settings and self-test feedback. No phone is attached to ADB; real device
receipt above is owner-confirmed, not simulated. Release evidence follows below.

Published notification fix evidence:

- Source: 17b2017807f5ee9b419b5bc9713170b06a7ddad3.
- Web: gh-pages 0875d83; nine checked public assets match the local build,
  including the unchanged root prototype. API preflight 204; unauthenticated 401.
- Hosted push_test API rejects unknown, disabled and another account's phone
  with 409, verified using an isolated test identity without sending messages.
- CI: https://github.com/xNorbertx/word-conquest/actions/runs/37192576334
- APK: 0.3.1-17b2017, version code 23880867, 4,937,926 bytes. Stable pilot
  signing certificate verified; notification permission present; no PEM private
  key or local fixture adapter in the package.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23880867
- Anonymous APK download: HTTP 200; SHA-256
  ff967632881c2b6f31697d635e11dc99f748d1556b3d9206940c4d236a6608c4.
- Local verified copy: dist/word-conquest-0.3.1.apk.

Install over the existing pilot. No added recurring costs or store publication.
Device acceptance still covers normal turn/background/cold-start routing, the
new foreground presentation, settings handoff and the APK upgrade.

## Opponent name and points in turn alerts - 4 October

Deployed the owner-requested server notification wording: "Norbert played a turn
for 18 points. Your turn." Points are the authoritative total gain (word points
plus territory), matching the Play word value. The worker resolves the exact
notification revision's stored operation and its actor's profile, never the latest
move. Refresh and game-ending turns have appropriate copy; deleted names fall
back to Your opponent. Lookup outages retry rather than sending a guessed score.

All three original rule suites and 35 integration/service/controller tests pass,
including delayed-revision correctness and queue-to-message integration. A real
saved turn was resolved read-only and its points matched the recorded total-score
change. Firebase accepted that payload in validation-only mode: no test alert sent.
Deployed worker returns 401 without its secret, 200 with it; queue was empty.
Updated notification/privacy docs and roadmap. No migration, client upgrade,
new cost or game-data change. The existing APK receives the new copy automatically.

## Clearer player identity and turn status - 4 October

Version 0.3.2 adds named YOU/opponent score cards, explicit sage-green/walnut-brown
labels, an outlined current player and a larger named turn indicator. Your owned
tiles have stronger borders; selection, path and play button use your own colour.
Game list turn badges are stronger and opponent avatars follow their actual side.
Preserved fixed board orientation and ownership mechanics.

Checked both accounts, walnut word submission, lost-response retry (one saved
turn), named waiting state, long names on a narrow phone, finished games and
no-territory reentry. Desktop and mobile browser layouts reviewed. Three original
rule suites and 35 integration/service/controller tests pass. Release evidence
follows below. No server/database change or added cost.

Published player-identity update evidence:

- Source: e6b8b278e514e7a292d89dd3784837e0f82b6dca.
- Web: gh-pages 60d2ead; all nine checked public assets match the build. Root
  prototype unchanged; API preflight 204 and unauthenticated request 401.
- CI: https://github.com/xNorbertx/word-conquest/actions/runs/37196225486
- APK: 0.3.2-e6b8b27, version code 23884955, 4,939,462 bytes. Stable pilot
  signing certificate and notification permission verified; no private key or
  local fixture adapter included.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23884955
- Anonymous download: HTTP 200, SHA-256
  ee59a42df349d90be31abd6ed931ad24ca9ca5d60024d8d5bc415a8cc6907224.
- Verified local APK: dist/word-conquest-0.3.2.apk.

Install over the existing pilot to preserve the session. Physical Seeker touch
and upgrade acceptance remain with the owner. The owner also confirmed the
previously deployed opponent-name/points notification wording works.

## Unlimited opponent captures experiment - 4 October

Version 0.4.0 introduces autumn-v2 for games created by updated clients. Legal
words can cross and capture any number of opponent tiles. Existing v1 games
retain the three-tile cap. Engine, dictionary, scoring, letter supply and all
other rules are preserved. Both versions are pinned and selected by the server
and client from the stored game version; client rule overrides are ignored.

Old clients can still play/create v1 but must update before joining or opening
v2. New-game/invitation help and in-game rules identify the experiment. Stats
keep classic and unlimited-capture records separate. No data migration needed.

Three original rule suites and 42 integration/service/controller tests pass.
Coverage includes five-opponent captures for either seat, castle/total points,
replacement letters, no-territory reentry, dictionary/adjacency/jokers, immutable
v1 behavior, version compatibility and a real local Postgres save/retry with
exactly one receipt and notification. Browser verification and publication
evidence follow below. Playtesting is still needed to judge balance.

Published unlimited-capture experiment evidence:

- Source: 828a8ad9369b25f2be92995cbdfcef633d35e8d2.
- Server: deployed game-api to aumiyyjsdqdazzmdmprl, no migration. Real
  isolated v2 turn captured five enemy tiles plus one neutral, earned 19 word
  and 8 territory points (27 total), and removed 7 from the opponent. Saved
  ownership/replacement letters matched for the opponent on reload. Retry
  returned the same receipt; a different stale operation was rejected.
- Hosted v1 test preserved the cap and remained playable without a client
  capability header. Old clients could preview v2 invites but could not join,
  open or submit. Test games used existing example.invalid identities with
  no registered phones, were resigned afterward, and were retained. No owner
  games were edited. One earlier harness run left an unused test invitation;
  it expires normally.
- Browser: on a phone-sized board, GARDENS accepted five enemy captures,
  previewed 27 and saved scores 69:38 from 42:45. Classic selection stopped
  before the fourth enemy tile. Help correctly explained each stored ruleset.
- Web: gh-pages a6b497ad4aec73c1ebf43c35443293fd2cf98fc6; all nine checked
  public assets match the build, including the unchanged root prototype.
  API preflight 204, unauthenticated request 401.
- CI: https://github.com/xNorbertx/word-conquest/actions/runs/37197997411
- APK: 0.4.0-828a8ad, version code 23886825, 4,939,981 bytes. Original
  pilot certificate, notification permission and absence of private keys
  and local fixtures verified. Local copy: dist/word-conquest-0.4.0.apk.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23886825
- Anonymous APK download: HTTP 200; SHA-256
  d13e6e6cb97e0f858e96af0c4be859146bf027a698ba7b3f3dc6dd178a9dad7b.

No new costs or services. Physical Seeker upgrade and capture-balance playtesting
remain owner acceptance tasks. Existing multi-day/backup/monitoring backlog is
unchanged. Both rule bundles must remain available during future rollback.

## Offline gameplay balance study - 4 October

Completed 8,736 complete self-play games across 33 configurations (215,748 turns),
plus 640 sampled continuations from five predetermined midgame decisions. Tiny
smoke/verification reruns are excluded from the published study count. The actual
pinned engine validates/scores/replaces letters; isolated research adapters add
experimental income, maturity, joker and objective mechanics. No live backend,
accounts or player data were accessed. Production sources and pinned versions
are unchanged; this documentation-only work does not trigger an APK build.

Saved the source harness, pinned research dependencies, exact stage/seed/model
parameters, source/cache hashes, summarized results, eight full replays, ratings
and recommendations under docs/research/. Raw per-game logs and the frequency
cache stay in ignored work/balance/. The report is a self-contained HTML file;
node docs/research/balance/serve-report.mjs also serves it locally on 4176.

Most promising human tests: land 2 / castles 5; separately 45 tiles / four jokers;
then mature territory as a defense incentive without recurring income. Higher
land values increased modeled territorial word sacrifices from 12.2% to 20.1%,
but first-player and final-reply concerns remain. All-tile holding income supplied
about 64% of points in the larger limited-attention comparison. The report also
retains negative counterfactuals: four of five early/midgame territorial choices
had a lower estimated final margin, so aggression alone is not the target.

Nine research tests pass: legal/complete trie search on a small reference board,
engine score/result agreement, deterministic mirroring, holding timing/caps,
new-capture delay, one-time rewards, maturity and joker enforcement. There were
no recorded search-node-limit cutoffs. Verified comparison selection, whole-game
replay navigation, alternate word values and contained table scrolling on desktop
and a phone-sized browser. The exact SONG/PEACE endgame wins by 2 versus losing
by 2. Bot results and subjective /5 ratings do not establish human enjoyment.

No new costs, infrastructure, online rules, APK or store publication.

## Castle income follow-up - 4 October

Completed a separate 3,248-game / 87,456-turn study in response to the owner's
request to revisit recurring castle points. Twelve point configurations and four
full-round-hold timing variants preserve the current board, word scoring, jokers,
dictionary, replacement letters and unlimited captures. Production sources and
the previous research harness remain unchanged.

Main experiment: after both players move, each owned side castle earns its rate,
and the centre earns its separate rate, including the final round. Banked income
survives later loss. Final castle values replace normal tile values. Side 1 /
centre 2 income and final 3 / 5 produced 36.1% combined territory score (16.4%
recurring income); side 2 / centre 4 produced 45.7% (28.9% recurring income).
The current control produced 22.8% territory. A full round of uninterrupted
ownership reduced the owner's example to 33.9% territory.

The model matters: exhaustive familiar-word search reduced the example to 17.8%
territory because longer words score more and shorten the game. Stronger income
also showed more second-player advantage. The next human comparison is 1 / 2
versus 2 / 4 income, holding final values 3 / 5 and other rules constant, alternating
starters and reviewing payout timing. Simulation fractions are not human-fun
ratings or calibrated predictions.

Saved the report, standalone PNG/SVG chart, all per-player component scores,
seed parameters, source/input/raw hashes and reproduction instructions under
docs/research/. Full turn logs and plotting dependencies are ignored local work.
Nine new research tests and nine prior research tests pass. Every simulation
finished without a search cutoff; all selected words use engine validation.
Audit checks all game score components, dictionary membership and payout timing,
plus exact reproduction of six complete games.

No app/backend deployment, player-data change, new ongoing cost or APK build.


## Castle income implementation - 4 October

Version 0.5.0 adds autumn-v3 for new games: side castles pay 2 and the centre 4
after a complete round; their current/final ownership values are 3 and 5.
Earned income is permanent. The server draws and persists the starting player
with cryptographic randomness; colours/participant seats stay fixed. Both
players receive equal turns, with the second starter receiving the final reply.
The last complete round also pays. Resignation, draw offers and other lifecycle
commands do not mint extra income.

Immutable engine-v1, rules-v1 and rules-v2 remain available. The v3 engine wraps
the old legality/word/replacement logic; version selection controls scoring.
The API rejects old-client v3 opens, joins and turns. Older clients retain their
creation defaults. Existing games are not migrated. No database migration is
needed: state and receipts already store the new fields transactionally.

Score cards show the current income rate; score breakdowns separate earned
income from ownership. Move previews include the actor's round payment and
explain any simultaneous opponent payment. Recaps show both payments. Help and
invitation/new-game copy explain the rules.

Verification before deployment: three original engine suites and 51
integration/service/controller tests pass. New coverage includes both starters,
final replies/payments, center steals, unchanged legacy behavior, saved create
retries, join preservation, stale submissions and exactly-once payments/receipts.
Complete dictionary-valid games finish for both starting seats. Mobile fixture
GARDENS previews/saves 19 word +10 territory +4 income =33, with the opponent
losing 9 territory and earning 2 income. Scores 50:62 become 83:55; the recap and
score breakdown agree. Physical phone acceptance remains a user playtest.

Released and verified:
- Source implementation: 6654bdce8eac086828cbd352248780609aa7e012.
- game-api deployed to the existing aumiyyjsdqdazzmdmprl project, no migration.
- Isolated hosted games 46fa9b7f-8cc6-4c60-bea1-bbfd0765a75a and
  12b4dc37-81da-4a29-ac60-7bf7c53406fa verify both starting-order fixtures,
  simultaneous income, final reply, stale rejection, one payout on retry and
  exact opponent reload. Both completed and were retained. Both server draws
  happened to choose player 2; the first fixture then deliberately exercised
  player 1 starting. Deterministic tests cover both sides of the random draw.
  Test identities are existing example.invalid accounts with no push devices;
  no owner games changed.
- Pages 501d7048d27878a1e64de9f38614c46377d08e39 built successfully. All nine
  public assets match the build, including the untouched root prototype.
  API preflight 204 and unauthenticated request 401.
- Android CI 37205389608 passed: 0.5.0-6654bdc, version code 23894600,
  4,941,968 bytes. Original pilot signing certificate and notification permission
  verified; no private keys or local fixtures included.
- Anonymous release APK download is HTTP 200 with verified SHA-256:
  a79816c91a8755a483b762202c5bd268c81d68a7f52ad9eb0c8a6f7449ada52a.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23894600
- Local APK: dist/word-conquest-0.5.0.apk.

Physical Seeker installation/gameplay remains owner acceptance. No new costs,
services, database changes or app-store submission.


## Friends first-iteration feature - 4 October

Version 0.6.0 replaces the central Activity tab with Friends, with search at the
top, friend requests and an accepted friends list with direct Invite buttons.
Activity remains under You. Owner explicitly chose signed-in display-name search
without opt-in; emails remain private. Duplicate display names are disambiguated
by unique friend codes. Unique names and their migration are added to ROADMAP.

The additive Friends migration is deployed to the existing Supabase project.
Friendships need mutual acceptance; friend invitations reserve a seat for one
account. Actions retain retry IDs, request generations reject stale acceptance,
and game creation/notification enqueue are atomic. One pending addressed invitation
per direction is allowed. Blocks hide both players, stop new contact and cancel
pending addressed invitations; active games are preserved. Request limits,
row-level access, account export and deletion cover the new records.

Verification: three engine suites and 59 integration/service/controller tests
passed. Eight new database tests exercise duplicate-name search, limited response
fields, requests/acceptance, retries/cross-requests, stale generations, targeted
invitations, blocking, push cancellation, deletion, RLS and daily request limits.
Hosted test game 8734d471-771c-42e3-9089-d5db997dab60 completed using existing
example.invalid accounts without push devices. Search, two-account acceptance,
one game/notification on retry, recipient preview, old-client update feedback,
normal v3 play, social export and Realtime events all passed. No owner game or
account was modified and no email or physical-phone alert was sent by the test.

Phone browser verification: 390x844 and 320x640, including request acceptance,
name search, adding a friend, direct invitation, long names, friend-code sheet and
Activity under You. Physical Seeker upgrade, friend flow and invitation push tap
remain user acceptance. Game rules/dictionary and the original prototype are unchanged.
No new service, ongoing cost or app-store submission.


Friends release verification:
- Source: 634371ffa318d9c22a140066270dbf3a4bc952ab.
- Supabase migration 202610040001_friends plus game-api/push deployed successfully.
- Pages commit 82a6c8f8505881f9e627b24342336a3118e5e8e4 built; all nine public
  assets match the local build. Original root assets remain unchanged. Auth rejects
  unauthenticated API calls (401); allowed-origin preflight succeeds (204).
- Android CI 37225809567 passed, including all 59 tests. Build 0.6.0-634371f,
  version code 23914106, 4,947,128 bytes. Package and notification permission match;
  stable original pilot certificate verified; no private keys or fixtures bundled.
- APK SHA-256: 85ca02741ce1196d946312937500aa77a3f27bb96c59727c5b2e15c6c2a8f879.
- Release: https://github.com/xNorbertx/word-conquest/releases/tag/android-pilot-23914106
- Anonymous APK download verified HTTP 200 and matching checksum.
- Local APK: dist/word-conquest-0.6.0.apk. Install over the existing pilot.
