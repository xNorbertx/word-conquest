# Implementation and verification — updated 3 October 2026

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
