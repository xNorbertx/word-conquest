# Implementation and verification — updated 2 October 2026

## Web publishing - 2 October

- Built static app pushed to dedicated gh-pages branch; Pages source configured there.
- Public app URL: https://xnorbertx.github.io/word-conquest/online/.
- Original root prototype preserved; source main untouched.
- Supabase public CORS, APP_URL and Auth Site URL configured; localhost retained.
- All three original test suites and 14 integration tests pass.
- Support inbox deferred by owner; sender chosen as no_reply@word-conquest.com.
- SMTP/domain verification, email delivery, multi-device/multi-day acceptance,
  notification scheduling and backup/restore acceptance remain outstanding.
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
- Resend domain verification and SMTP are still pending. No reminder credentials or
  scheduled delivery job enabled. No paid plans or store releases. Public frontend publishing followed on 2 October.

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
- Notification tests cover secret enforcement, opt-out, failure retry, stable provider
  idempotency and bounded delivery window. No real email sent.
- Browser preview inspected on desktop and narrow viewport; keyboard selection and
  joker input exercised. No horizontal document overflow observed on narrow layout.
- Package audit after updating Capacitor to 7.6.9 reports zero known vulnerabilities.

## Explicitly incomplete / release gates

- Hosted Auth/API/PostgREST tests pass with isolated confirmed test accounts. Real
  signup confirmation and recovery email await Resend domain verification and SMTP.
- Browser-level interrupted HTTP submission, cross-device session recovery and a
  human multi-day playtest remain required. The automated retry test is not a
  substitute for real-device network interruption testing.
- No staging URL verified or deployed; GitHub remote exists, authenticated hosting
  access was not found. No push or Pages setting change made.
- No configured Cron, external monitor, backup job, restore drill or retention job.
- Owner support/operator identity and privacy/retention approval remain outstanding.
- No APK/IPA compiled, no signing, no physical-device testing. Android SDK absent;
  installed Java is 19, so a supported build JDK is also required. iOS needs Mac/Xcode. Native deep links, secure token-storage review and APNs/FCM
  are mobile release work; web links currently remain in the web app.
- No public matchmaking/messaging, therefore their conditional moderation milestone
  is not launched. No public app-store release authorized.

The first-online milestone must remain unaccepted until email, hosting, recovery and
real-device checks above pass. Backend deployment alone is not release acceptance.
