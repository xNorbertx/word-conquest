# Android pilot and build pipeline

Target test phone: Solana Seeker / Android 16. Package: `com.wordconquest.app`.
The APK uses the same Supabase accounts and games as the web app.

Verified pilot build: `0.5.0-6654bdc` (version code `23894600`), from
[this successful pipeline run](https://github.com/xNorbertx/word-conquest/actions/runs/37205389608).
Local APK: `dist/word-conquest-0.5.0.apk`. Earlier compilation-only artifacts are
superseded; use this build or a later successful build for the stable pilot signer.

New games in 0.5.0 use castle income: side 2 / centre 4 per full round,
with final ownership values 3 / 5. The server randomly chooses who starts and
preserves equal turns. Unlimited captures remain enabled. Both players should
update or reload the web app and start a new game. Existing v1/v2 games keep
their original rules. The game's How to play menu identifies its rules, and
statistics stay separate.

## Install and use

On your Android phone, open the repository's [Releases page](https://github.com/xNorbertx/word-conquest/releases).
Open the newest published Android pilot and, under **Assets**, download
`word-conquest-android.apk`. No GitHub account or ZIP extraction is needed.
[Direct verified APK download](https://github.com/xNorbertx/word-conquest/releases/download/android-pilot-23894600/word-conquest-android.apk).
Open the downloaded APK and allow installation from your browser if Android asks.
Updates install over the existing pilot app; do not uninstall it, because that
removes locally saved sessions and pending actions.

In Word Conquest, use the Games notification prompt or open
**You > Notifications > Enable notifications** and accept Android's permission prompt.
The status becomes **Connected on this phone** only after server registration.
If setup fails, use Retry connection; if Android blocks the app or Game updates
channel, use Open Android settings and return. Dismiss the home prompt to snooze
it for seven days. **Send a test notification** targets only this phone and account;
Firebase acceptance is reported separately from an actual receipt. Preferences are per account and phone. Turning notifications
off disables server delivery; signing out disables registration and removes
delivered notifications. Signing in again restores a previously enabled preference.
Turn notifications include the opponent display name and total points gained
(word points plus territory gained and any castle income earned on that turn), matching the Play word total. The worker
reads the saved receipt at the notification revision, so delayed delivery cannot
accidentally quote a newer move. Refreshes say the opponent refreshed their letters;
final turns retain their score and say the game finished. Other alerts stay generic.
Payloads include the game reference, but not email, board contents or played words.
Tapping one opens the saved game after sign-in. This wording is server-controlled;
the existing pilot APK receives it without an upgrade.
Invitations are share links: push reports acceptance/decline to known players;
there is no way to push an initial link to an unidentified recipient.

Verify on the phone: foreground update, background and closed-app delivery, tap
to correct game, denial/opt-out, sign-out, account switching, and an APK upgrade
without losing the session. Android force-stop, notification settings, battery
restrictions and locked Private Space can suppress delivery. Push is best-effort;
saved games and the in-app inbox are authoritative.

## Automatic APKs

`.github/workflows/android.yml` runs tests and builds on source pushes (all branches
except `gh-pages`; documentation/design-only pushes are skipped). Each successful
run uploads an APK, build metadata and SHA-256 checksum, retained for seven days.
These Actions artifacts require GitHub sign-in. Public phone downloads are published
separately in Releases; the verified pilot above is available without signing in.
This is build automation, not automatic installation on your phone. It does not
deploy database migrations/functions or publish an app-store release.

The standard Linux runner is free for this public repository. No paid runner or
Firebase billing account is required. Public-repository Actions/artifact terms
still apply. Do not change repository visibility or runner class without reviewing
costs. Publishing a push creates a new APK only if the checks pass.

Version name includes package version and source commit. Version code is seconds
since 2026-01-01 UTC, so later builds upgrade earlier ones. Concurrent obsolete
builds on the same branch are cancelled. Build-only GitHub repository secrets:

- `WC_PUBLIC_CONFIG`: public Supabase URL/publishable key and public contact fields.
- `GOOGLE_SERVICES_JSON`: Android Firebase configuration for this app.
- `ANDROID_DEBUG_KEYSTORE`: base64 of the existing local pilot debug key, ensuring
  local and CI APKs share a signing identity. This key is for direct pilot builds,
  not a production store signing key. Never regenerate it for routine updates.

CI explicitly selects that key using `WC_ANDROID_KEYSTORE` and verifies the APK
certificate SHA-256 `306e097ad7c8d10fe0a5829e4e49420de84ac258e5056f9583447bdcc944c266`
before upload. A build with a different certificate fails instead of publishing.

The Firebase service-account private key is never uploaded to GitHub or bundled
in the app. A future store release needs reviewed release signing and distribution.

## Local build

On this Windows machine: `powershell -File scripts/build-android.ps1`.
The script uses the dedicated JDK/SDK under `%LOCALAPPDATA%/WordConquestBuild`.
`scripts/prepare-android.cjs` reproduces native configuration, notification icon,
version metadata and backup exclusion, including on a fresh CI checkout.
Output: `android/app/build/outputs/apk/debug/app-debug.apk`.
The same script also creates the Autumn Sunday launcher, splash and system-bar palette.
Generated Android source remains ignored; customizations live in the preparation
script and tracked Java sources in native/android/.

## Push backend

Supabase migration `202610030002_android_push.sql` registers devices through the
authenticated game API and queues notifications transactionally. Registration
tokens and delivery records are service-only. Device ownership, opt-out, read
status and account deletion are checked before queued work is claimed. The worker
checks device ownership and token again before sending. Lease-based claims keep
concurrent workers separate, with bounded retry/backoff and a 24-hour expiry.
FCM has no exactly-once send contract: stable Android tags collapse duplicate
alerts for a game, but a delivery whose acknowledgment was lost may be retried.

Edge Function `push` uses secrets `FCM_SERVICE_ACCOUNT_JSON` and `PUSH_SECRET`.
The authenticated game API uses the same FCM secret for the per-phone test action.
Tests are rate-limited with other API actions and cannot target another account.
The game API wakes it after successful invitation/turn transactions; `wc-push-retry`
Cron checks once a minute and invokes it only when deliveries are due, using Vault
secret `wc_push_secret`. Reapply `supabase/operations/schedule-push.sql` to restore
that named schedule; it preserves the queue and games.
The email worker remains dormant. Inspect delivery outcome counts, not tokens.
Invalidated tokens are disabled; renewed tokens register on app resume/sign-in.
No paid plan enabled; monitor Supabase function/database and FCM usage limits.

To disable delivery temporarily, disable `wc-push-retry` and unset `PUSH_SECRET`
from the game API environment; preserve the queue and game data. To rotate sending
credentials, replace the Edge Function secret and revoke the previous Google key.
