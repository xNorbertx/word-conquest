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
