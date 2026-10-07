# Implementation and verification - updated 7 October 2026

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
