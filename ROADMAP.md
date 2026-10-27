# Word Conquest — app roadmap

## End-game result designs — 27 October 2026

- [x] Create three isolated, interactive result-screen prototypes with confetti.
- [x] Include word letters, length bonuses, total castles, final territory and best word.
- [x] Preserve the same stats when reopening; no repeated confetti.
- [x] Review phone layouts and player colours, including dark mode.
- [x] Publish and verify the dedicated preview gallery.
- [ ] Owner selection, then implementation using authoritative game receipts.

## Player colour and game-screen refinements — 0.16.3

- [x] Match joker placeholder, selected state and letter flight to the playing side.
- [x] Remove the lower player label during scoring; preserve accessible attribution.
- [x] Widen the letter-supply track responsively, keeping room for turn text.
- [x] Regression suite and production board DOM checks.
- [x] Publish and verify web and signed Android APK.
- [ ] Rendered phone review; in-app browser unavailable this session.

## Board and word bar cleanup — 0.16.2

- [x] Remove filled/outlined ownership dots from board rendering and animations.
- [x] Add letter-only points beside the selected word without another row.
- [x] Remove previous-move points, retaining the word and history navigation.
- [x] Verify selection, backtrack, clear, joker edits and reset using production DOM.
- [x] Publish and verify web and signed Android APK.
- [ ] Rendered phone review; native browser access approval timed out this session.

## Section skipping and invalid-word dialog — 0.16.1

- [x] One tap completes word/bonus, castles or territory; double-tap ends all.
- [x] Exact intermediate receipt totals, cancellation/replay safety and a brief
  final-tap shield to prevent accidental Play/history clicks.
- [x] Centered modal only for dictionary rejection, large Close action, native
  focus/inert background and preserved selected letters/jokers.
- [x] Regression and production DOM interaction checks, both themes and languages.
- [x] Publish and verify normal web assets and signed Android APK.
- [ ] Physical phone review; browser access is unavailable in this session.

## Minimal app copy — 0.16.0

- [x] Audit all production screens, empty states, dialogs, status/error copy.
- [x] Remove slogans/filler; use concise titles and actions throughout.
- [x] Compact language picker, empty states, Friends, notifications, dialogs,
  You and Analytics; preserve touch/keyboard accessibility and warm palette.
- [x] Verify version-correct help, confirmations, invitation/auth flows and
  unaffected game/history/scoring interactions with production DOM checks.
- [x] Publish verified normal web app and signed Android APK.
- [ ] Rendered phone review in light/dark; browser and device access unavailable.

## Reliable opening screen — 0.15.1

- [x] Restore Games when an expired login emits TOKEN_REFRESHED before INITIAL_SESSION.
- [x] Keep cached Games visible during refresh; coalesce startup and protect recovery,
  sign-out, account switching and existing game navigation.
- [x] Bound session waits and offer a working retry when startup cannot connect.
- [x] Regression coverage includes the installed Supabase SDK's actual event order.
- [x] Publish and verify normal web assets and signed Android pilot.
- [ ] Device acceptance: reopen after a long idle on iPhone and Seeker, with/without
  connectivity. No connected browser or physical device was available locally.

## Scoring creation fix — 19 October 2026

- [x] Reject new games using retired rules; preserve existing-game/retry behavior.
- [x] Verify both invitation paths, all languages, missing-version clients and
  agreed length bonuses on the deployed server. See docs/PROGRESS.md.


## Dutch language — 0.15.0

- [x] OpenTaal pinned, filtered, licensed and reproducibly imported.
- [x] Dutch board/replacements/scoring, pre-invitation language selection,
  labels, jokers and Analytics; existing versions preserved.
- [x] Regression, production-bundle and live backend verification.
- [x] Publish normal web and signed Android pilot; record release evidence.
- [ ] Physical Dutch gameplay acceptance on the Seeker/iPhone.


Follow-up 0.14.0:
- [x] Replace Activity under You with private current-rules Analytics.
- [x] Add outcomes, best game/date, best word, longest word, largest single-turn
  capture and total castle captures. Do not retrofit incompatible old games.
- [x] Slow sequential letter scoring and give the length bonus a readable hold.
- [x] Guard the joker dialog against the opening gesture's trailing click.
- [x] Test scoring restoration, analytics attribution/access/paging, account
  isolation, picker gesture sequences and existing game-screen behaviour.
- [ ] Rendered phone-size review in light/dark and actual Android joker selection.
  Browser inventory is empty, opening IAB reports unavailable, and ADB has no
  attached device. Do not count DOM tests as visual or physical-device evidence.
Version 0.14.0 is live at the normal web URL as of 19 October; the signed Android
APK is available. Rendered visual/device acceptance remains open. Release evidence is maintained in [PROGRESS](docs/PROGRESS.md).

Updated: 18 October 2026

Combined game-screen release 0.13.0:
- [x] Waiting hourglass: one half-turn every five seconds, reduced-motion aware.
- [x] Word scoring: ordered letter points and ownership colours, length bonus last,
  zero-point jokers included, tap-anywhere skip retained.
- [x] Remove draw offer/accept controls from the current client; preserve historical
  games and older-client compatibility on the server.
- [x] Last-word shortcut opens Move history directly, with score columns and totals;
  remove the tile replacements / board-location recap.
- [x] Prefetch and cache history, deduplicate pending requests and reduce response
  size; test scoring attribution, paging, offline retry and account changes.
- [ ] Physical-phone acceptance: animation pacing, waiting icon and history layout
  in light/dark mode. No phone or browser surface was available for this run.
Web, compact-history backend and signed Android APK are released.
See [release evidence and limits](docs/PROGRESS.md).

- [x] Replace the scoring Skip button with an invisible full-screen tap target:
  one click finishes every remaining phase and restores the saved board/totals;
  the tap is consumed so underlying game controls do not activate.
- [ ] Confirm tap-anywhere scoring skip on the physical Android/iPhone builds.
  Web and signed APK released; all 180 tests pass. Evidence: [PROGRESS](docs/PROGRESS.md).

This is an acceptance checklist. The original local two-player prototype remains
available; a separate online implementation now exists. Rules remain experimental.
See [implementation and verification status](docs/PROGRESS.md) and the single
[manual setup checklist](docs/SETUP.md). Boxes remain unchecked until their hosted
and real-device acceptance checks pass, not merely because source code was written.

Android joker auto-open 0.12.1 fixes capture-transfer cancellation and preserves
board touch targets. All 174 tests and production DOM regression checks pass.
Web and signed Android APK are released and verified. Physical-phone confirmation
remains open; release details are in [PROGRESS](docs/PROGRESS.md).

The owner approved final territory + defended castles 3/5. Version 0.12.0
implements this for new English/Swedish games; see [timing and verification](docs/PROGRESS.md).
Historical games keep their rules. Web/server and signed Android pilot are live;
170 tests, two hosted complete games and seven hosted ending cases pass.
Deployment evidence is recorded there.

- [x] Implement a new pinned version, terminal tally, defender-only payouts,
  score animations/recaps and explicit resignation/draw/abandonment timing.
- [ ] Human-test the approved 3/5 rules: castle leads, late territory steals,
  fairness between starting seats and score legibility on both phones.

Historical research:

Defended-castle 3/5 extension is complete: 1,504 new English games on the same
seeds, compared with 2,880 exact previous controls. [Findings](docs/research/castle-35-2026-10-18/FINDINGS.md)
show 52.1% words / 34.0% castle income / 14.0% final land in the main model.
The 3/5 rules are now approved; recoverable leads and starting-order fairness
remain human-playtest questions.

- [x] Add 3/5 defended income with final territory to the research comparison;
  audit all 512 new main games, parameterized payouts and exact previous controls.
- [ ] Human-test 2/4 versus 3/5, with final territory in both; watch side castles,
  word-versus-position choices and whether early castle leads are recoverable.

Final territory follow-up is complete: 2,880 distinct English games comparing
words + defended castles with and without a final +1 per owned tile.
[Results](docs/research/final-territory-2026-10-18/FINDINGS.md) favour testing the
final bonus: 58.9% words / 25.4% castle income / 15.6% territory in the main model,
with more ordinary attacks and late reversals. Fairness remains unresolved.

- [x] Compare final territory versus no territory using paired seeds, both starts,
  multiple word-search/strategy models and exact main-game accounting audits.
- [x] Choose the next human-playtest rules: final territory with defended castles 3/5.
- [ ] Human-test late territorial steals, score legibility and starting-order balance.
- [x] Implement as new pinned rules versions, including terminal presentation
  and lifecycle decisions for resignation/draw.

The research itself did not change live scoring; the approved implementation
is tracked above.

Scoring simplification research is complete: four systems, 4,800 English games
and 1,536 decision continuations. [Published findings](https://xnorbertx.github.io/word-conquest/research/scoring-2026-10-18/)
recommend human-testing the proposal against words-plus-defended-castles. Rule
selection and implementation are now complete. Starting-order fairness remains
a human-playtest question; existing games keep their pinned rules.

Focus/sign-out 0.11.2 is released on web and Android: touch focus boxes removed,
keyboard focus retained, and sign-out confirmation added. All 158 tests, DOM checks,
public assets and signed APK checks pass; see [evidence](docs/PROGRESS.md).
Physical-phone appearance remains an acceptance check.

Login 0.11.1 is released on web and Android: approved concept 3 without the
background logo. All 158 tests, auth DOM checks, web assets and signed APK checks
pass; see [evidence](docs/PROGRESS.md). Physical-phone visual acceptance remains open.

Swedish vocabulary 0.11.0 is released on web and Android: 991,634 forms, SALDO
supplementation and accent folding with Å/Ä/Ö preserved. All 158 regression tests,
reported-word checks and a complete 28-turn hosted game pass. Prior games keep
their dictionaries and balance. SAOL export access and vocabulary playtesting remain
open. See [release evidence](docs/PROGRESS.md) and [language policy](docs/LANGUAGES.md).

Dark mode 0.10.0 adds a saved device preference under You, a complete night palette
and matching Android activity/system bars. Light mode remains the default.
Rendered-phone acceptance remains open; see PROGRESS.md for verification.

Game screen 0.9.4 replaces the word panel with a compact word/undo/Play bar,
fits the board to available mobile height and makes zoom pan in both directions.
Physical iPhone/Seeker acceptance remains; see PROGRESS.md for verification.

Jokers 0.9.3 implement the approved Word keys design: immediate QWERTY selection,
Swedish Å/Ä/Ö, automatic next joker and no visible instruction text. The old
scrolling Letter lens is replaced; backend rules and existing games are unchanged.

Games 0.9.2 places Playing/Finished and New game in one row, with no welcome
greeting or waiting-turn summary.

Friends 0.9.1 uses username-only discovery. Friend-code UI and lookups are removed;
account IDs remain internal. Blocked players is available under You. Existing
relationships and games are preserved; regression and hosted checks pass.

Jokers 0.9.0 use the approved Letter lens with blank tiles and no text field.
New games have one neutral joker beside each corner castle plus one per starting
block. Existing boards keep their layout. Regression and hosted checks pass;
physical picker/animation acceptance remains. See PROGRESS.md for release evidence.

Current status: web app published on GitHub Pages, authoritative Supabase backend
deployed, and authentication email delivered successfully through Resend. Automated
hosted play completed 36 turns; owner reported a real 20-action play session on
3 October. Live updates and visible game exit controls are deployed. Android push
is implemented/deployed and a versioned, signed pilot APK passed GitHub Actions.
Physical Seeker notification and upgrade acceptance remains pending.

Owner decisions: no turn-alert emails for this iteration; retain authentication
confirmation/recovery email. In-app updates serve the web pilot; native push is the
mobile notification goal. Owner will run the multi-day playtest and report results.
Keep letter distribution unchanged; record consonant-heavy play as feedback.

Owner advanced Android packaging and push ahead of remaining reliability work.
The build pipeline is ready; next mobile acceptance is real Seeker delivery,
notification taps and an in-place APK upgrade. Engineering work still includes
interrupted submissions, resume/session recovery, backup/restore and monitoring.

UX revision 0.3.0: rebuilt navigation, board presentation, invitations, identity,
activity and account screens. Browser checks and regression suites pass; owner
visual feedback is positive; physical-phone acceptance remains open. See [UX review](docs/UX.md).

UX revision 0.3.2 makes your name, YOU label, sage/walnut side, starting tiles and
current turn explicit. Selection and Play word colours follow your actual seat;
both player perspectives and narrow-screen states have browser verification.
Seeker touch/upgrade acceptance remains a device check.

First milestone: invite a friend and reliably finish a game over several days.

## Must-have — first asynchronous friend-play app

- [ ] Product design: a coherent visual identity, readable board, clear score breakdown, selection feedback, loading/error states, and a short introduction to the rules.
- [ ] Visual scoring feedback: option 3 (points from the board) selected and implemented in 0.7.0. Confirmed word points, round castle income for both players, territory gains and opponent losses animate into the totals. Skip, recap replay, reduced motion and interruption handling verified locally; real Seeker acceptance remains open.
- [ ] Castle clarity: approved Fortified edges design in 0.7.3 replaces tiny stars with gold battlement outlines, a stronger centre castle, and a brief capture lift/ripple within confirmed score playback. Validate the appearance and feel on the Seeker; rules and income stay unchanged.
- [ ] Mobile and accessible interaction: comfortable touch targets, different screen sizes, clear joker entry, and ownership indicators that do not rely only on color.
- [ ] Persistent player identity: sign-in, a simple profile/name, account recovery, and access to the same games across devices.
- [x] Persistent game service: save the board, letters, ownership, scores, remaining letter budget, current player, rules, and move history so games survive closing the app.
- [x] Server-authoritative play: validate players, turn order, paths, words, captures, and scores on the server; generate replacement letters there too. A modified client must not be able to award itself points.
- [ ] Reliable turn submission: retries cannot submit the same move twice; reconnecting restores the accepted state; stale boards cannot overwrite newer turns. Clearly distinguish pending and accepted moves.
- [ ] Invitations: share a link or code, accept or decline, and cancel unaccepted invitations. Opening an invitation should lead to the right game after sign-in.
- [ ] Game list: show invitations, active games, whose turn it is, and completed games. Version 0.8.1 compacts cards into name/score and status/language/time rows, with smaller supporting lists and inline notification enablement; phone appearance remains acceptance. Version 0.7.2 retains Games/boards across reopening, refreshes safely, combines server reads, pages older moves and opens game links directly. Hosted reads averaged 20-25% faster; saved screens appeared in about 0.22-0.27 seconds in local browser fixtures. Measurements and limits are in PROGRESS.md. Seeker responsiveness remains owner acceptance.
- [ ] Friends (promoted to first iteration on 4 October): search usernames, mutually accept requests, keep a friends list, and invite a specific friend directly. Implementation, automated and hosted verification passed; Seeker acceptance remains open.
- [x] Unique usernames (promoted to first iteration on 4 October): case-insensitive database uniqueness, editable with conflict feedback, existing names preserved. Follow-up 0.6.2 uses email/password signup followed by a separate required username screen, with Randomize and persistent completion state across reopening/devices. Hosted and release verification recorded in PROGRESS.md; APK upgrade acceptance remains under mobile verification.
- [x] Web pilot notifications: in-app inbox and live game updates, with participant-only access. Turn-alert email is out of scope by owner decision.
- [ ] Mobile notifications: native push for turns/invitations, preferences, and links to the relevant game; verify permissions, background delivery and logout/token cleanup on devices.
- [ ] Opponent-move recap: show the word, traced path, captures, score changes, and replaced letters when returning to a game.
- [ ] Swedish games (0.8.0): choose English/Svenska before link or friend invitations, show language on game cards, use a pinned Swedish dictionary and 29-letter board/jokers. Automated gameplay and save/retry checks pass; hosted verification and physical Swedish playtest acceptance are recorded in PROGRESS.md. See [language policy](docs/LANGUAGES.md).
- [ ] Expanded Swedish dictionary: SALDO plus accent handling released and verified locally, on the hosted API and in the signed 0.11.0 APK. Obtain the openly licensed SAOL headword export from Språkbanken (documented API denied access), merge as a later pinned version, and confirm Swedish vocabulary quality through playtests.
- [ ] English dictionary validation: choose a word list with suitable usage rights. Define treatment of inflections, slang, proper nouns, abbreviations, and offensive words. Explain rejected words clearly.
- [ ] Game lifecycle rules: define resignation, draws, inactive opponents, and abandonment, including their effect on statistics. Make the ending and final-reply rule clear.
- [ ] Results for future analytics: preserve wins, losses, draws, highest final score and best word/turn in backend records without duplicate results. Owner removed the Record UI from You in 0.7.1; a separate analytics experience is deferred.
- [x] Versioned rules and dictionaries: games retain the versions they started with. Keep records comparable by separating statistics for materially different rulesets and languages.
- [ ] Privacy and account controls: decide what profile/results information is public, collect only needed data, and provide account/data deletion.
- [ ] Operational basics: backups and recovery, error reporting, service monitoring, and a way to investigate a broken game or receive a bug report.
- [ ] Verification before release (owner is handling the multi-day playtest; engineering handles interruption/resume tests): scoring and rule tests, interrupted-submission/reconnection checks, and real-device playtests of a complete asynchronous game.

## Must-have when the relevant feature launches

- [x] Android pilot build automation: reproducible Capacitor APKs, increasing versions, stable pilot signing, tests and downloadable artifacts on source pushes. This does not complete device acceptance or app-store signing.
- [ ] Public opponents or free-text messaging: blocking, reporting, abuse handling, and appropriate moderation controls.
- [ ] App-store distribution: signing and release setup, icons/screenshots/listings, required privacy disclosures, device testing, and an update process. Check platform requirements when preparing the release.

## Nice-to-have — later iterations

- [ ] Matchmaking with similarly skilled opponents; ratings once the player population supports useful matching.
- [ ] One-tap rematches with alternating starting players.
- [ ] Simple messaging; preset reactions can be an initial smaller version of this feature.
- [ ] Further languages beyond English/Swedish, each with its own dictionary, letter distribution, scoring balance and records. Interface translation is a separate task.
- [ ] Practice mode and a computer opponent.
- [ ] Full game replays and shareable results or best-word cards.
- [ ] Postgame word exploration: discover missed opportunities after the game is finished.
- [ ] Richer statistics: average word length, average turn score, captures, castle control, personal records, and progress over time.
- [ ] Casual and timed modes with clear inactivity policies.
- [ ] Offline move drafts, checked against the current server state after reconnecting.
- [ ] Spectating, tournaments, and private groups.
- [ ] Better board-generation evaluation using actual available words and fairness measurements.

## Open game-design questions

Keep these configurable and evaluate them through playtests rather than treating the current rules as permanent:

- Board size, shape, connectivity, and difficult edge tiles.
- Starting territory and first-player advantage.
- Letter category balance, replacement distribution, and luck over a full game.
- Joker count and placement.
- Starting a word on owned territory versus merely touching it.
- Enemy-capture limits, defense, and disconnected territory.
- Castle number, placement, and value.
- Word length bonuses, letter values, and the balance between permanent word points and territory points.
- Shared letter budget versus turn limits, ending fairness, and game length.
- Repeated words, refresh turns, stalemates, and comeback mechanics.

## Suggested delivery order

1. Define the first app's screens, dictionary policy, and game lifecycle.
2. Complete the friend-play loop: identity, invitations, authoritative saved games, dictionary, game list, recap, and reliable submissions.
3. Finish reliability acceptance, backup/restore, monitoring and full asynchronous playtesting; statistics and account controls already have implementation/test coverage.
4. Prepare mobile distribution once the complete loop works reliably.
5. Add later features in response to actual player needs.

## Technology decision — recommendation, not a commitment

For the next milestone, keep the working web client and add the asynchronous service. Consider gradually introducing TypeScript while retaining the separate game engine. Capacitor is a practical route to packaging a web client for iOS and Android, with native features through plugins. This preserves more of the current implementation; it still requires mobile design, device testing, notification integration, and release work.

Flutter is also a valid choice, especially if a mobile-first Flutter codebase is a strong preference. It targets iOS, Android, and web, but the existing HTML/SVG interface would need rebuilding and game logic would need porting or a deliberate integration approach. Keep server validation authoritative whichever client framework is chosen. If client and server use different languages, plan how scoring previews and validation remain consistent.

Official references:
- Capacitor: https://capacitorjs.com/docs
- Flutter platform support: https://docs.flutter.dev/platform-integration/web

The client framework does not replace the game server, storage, identity, or notification service. Choose those separately after defining the first online milestone.

Android update: opt-in FCM delivery, registration/logout handling and retry queue
are implemented and deployed. Automatic versioned APK builds pass in GitHub Actions.
The owner confirmed a real test notification on the Seeker after enabling in-app
registration on 4 October. Version 0.3.1 adds a home opt-in prompt, connection
status, retry/settings, a per-phone test and foreground alerts. Normal turn
delivery, notification taps and upgrade acceptance remain open.
Turn alert copy now includes the opponent display name and total points gained
from the saved turn (word points plus territory), including final scoring turns.
See docs/ANDROID.md for builds and tests.

Capture-limit experiment (4 October):

- [x] Version new games with unlimited opponent captures along a legal word path.
- [x] Preserve existing three-capture games and separate records by rules version.
- [x] Validate ownership/scoring/replacements and exactly-once turn persistence.
- [ ] Playtest whether unlimited captures improve conquest and comeback balance.

Gameplay balance research (4 October):

- [x] Run reproducible offline self-play against the actual pinned engine/dictionary: 8,736 games, 33 setups, 640 alternative continuations.
- [x] Compare word-first, territory-first, balanced, limited-attention and sampled-reply opponents; document model limits and failed ideas.
- [x] Evaluate territory values, recurring/bounded holding rewards, maturity, joker counts/placement/consumption, smaller maps, endings, letter balance and refresh rules.
- [x] Save ratings, uncertainty estimates, full methodology and selected interactive replays in docs/research/.
- [ ] Human comparison: current rules versus land 2 / castles 5, with alternating starters; inspect final-reply advantage.
- [ ] Separately playtest 45 tiles / four jokers; then consider mature territory if holding still feels missing.

Research changes no live rules or saved games. See [balance findings](docs/research/BALANCE-2026-10-04.md).

Castle income follow-up (4 October):

- [x] Simulate differentiated side/centre recurring income and final values: 3,248 new games across 12 point settings plus four full-hold timing variants.
- [x] Report words, ordinary land, final castles and banked castle income separately, including score shares, uncertainty and sensitivity to word length/opponent style.
- [ ] Human comparison: side 1 / centre 2 income versus side 2 / centre 4, with final values 3 / 5 and unchanged board/jokers.
- [ ] Review payout timing and starting-order fairness before promoting a recurring-income rules version.

Your proposed 1 / 2 income produced 36.1% territory points in the main simulation;
2 / 4 produced 45.7%. Longer-word search sharply reduces these proportions.
These focused results make recurring castle income a valid next comparison
alongside the earlier land-value proposal. No live rules changed.
See [castle income findings](docs/research/CASTLE-INCOME-2026-10-04.md).


Castle income pilot implementation (4 October):

- [x] Add versioned 2 / 4 recurring castle income with final values 3 / 5 for new games.
- [x] Randomly select and persist the starting player on the server; retain player colours and equal turns.
- [x] Pay both players once per completed round, including the final reply; preserve banked income after capture.
- [x] Add income previews, score breakdowns, per-round rates, recaps and rules help.
- [x] Preserve v1/v2 games and prevent incompatible clients playing v3.
- [ ] Human playtest 2 / 4 income on both devices; assess castle dominance and starting-order balance.

Random starting order distributes the starting/last-reply roles; it does not
prove that those roles have equal strategic value.
