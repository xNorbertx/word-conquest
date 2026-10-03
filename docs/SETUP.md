# One manual setup checklist

29 September 2026. Only owner actions are listed here. Implementation, migrations,
builds and verification are the agent's work once access exists. Never paste secrets
in chat, commit them, or put service-role keys in the browser.

## First online version — private friend pilot

| Done | Owner action / exact location | Recommended default and why | Blocks |
|---|---|---|---|
| [x] | Sign in at https://supabase.com/dashboard and create a **dedicated Word Conquest** project in a free organization (or identify an existing dedicated project). Choose an EU region; store the generated database password in your password manager. | Free plan, no card/upgrade/add-ons. One service supplies identity, recovery, database and functions. Do not reuse another app's database. Free projects can pause after a week of low activity; this pilot is not an always-on production guarantee. | Remote persistence, identity, server turns, cross-device friend test. |
| [x] | Project Settings → API: place project URL and **publishable/anon** key in `C:\repos\word-conquest\online\config.local.js`, following `config.example.js`. For deployment, authenticate the Supabase CLI locally (`supabase login`) and retain the database password locally when linking. | Public URL/key are safe in a web bundle; privileged credentials are not. Supabase provides server secrets to deployed functions automatically. Use Dashboard → Edge Functions → Secrets for `APP_ORIGIN` (exact web origin) and `APP_URL` (full `/online/` URL). | Deploying and connecting this project's backend. |
| [x] | GitHub Pages publishing authorized and configured for the built `gh-pages` branch. | Online app: https://xnorbertx.github.io/word-conquest/online/; root prototype retained. Existing Git Credential Manager access works. | Hosted shareable web link. |
| [x] | Resend SMTP configured for `no_reply@word-conquest.com`; recovery email received by owner on 3 October. | Authentication mail remains required. No turn-alert emails requested. Full signup/reset flow acceptance is tracked separately. | Authentication email delivery verified. |
| [x] | Auth Site URL set to https://xnorbertx.github.io/word-conquest/online/; localhost callback retained. | Email confirmation remains enabled; unrelated remote settings preserved. | Hosted confirmation and recovery callbacks. |
| Deferred | Owner chose no support inbox for the private friend pilot. Friends contact their inviter; provide operator/privacy contact before broader release and review `docs/PRIVACY.md`. | No Zoho setup is needed now. Shared-history retention policy still needs owner review. | Broader release privacy/support readiness; not web publishing. |
| Out of scope | No setup required for turn-alert emails. | Owner chose in-app updates for the web pilot and native push for mobile. Keep the existing worker dormant. | Does not block first iteration. |
| [ ] | Choose an encrypted backup destination you control and a person/address to receive service failures. Use the backup/restore runbook in `docs/OPERATIONS.md`; provide access locally, not in chat. | Daily export and a restore drill before calling the pilot reliable. Built-in platform logs first; no new paid monitoring service. | Operational acceptance, recovery from data loss. |

Material owner decisions, bundled here: retain $0 pilot limits or explicitly approve
an always-on plan later; approve EU hosting/private shared-history retention and
identify the operator/support contact. Web publishing was explicitly authorized on 2 October. Default remains **no new spending and no app-store release**. Supabase Pro is currently advertised from $25/month; this is not a hard
total-cost cap. SMTP/domain costs depend on existing services. Do not enable paid
usage merely to pass a test.

## App-store release only — does not block the web pilot

| Done | Owner action / exact location | Recommended default and why | Blocks |
|---|---|---|---|
| [ ] | Apple https://developer.apple.com/programs/enroll/ and Google https://play.google.com/console/signup: enroll under the intended owner and complete identity/terms/payment yourself, or grant access to existing accounts. | Defer fees until web acceptance. Confirm current fees at enrollment; no purchase is authorized. | Store distribution only. |
| [ ] | Provide access to a Mac with supported Xcode and an iPhone; install Android Studio/SDK on the Windows build machine and supply an Android test device. | Capacitor retains web/JS; this machine has Java but no discovered Android SDK, and cannot build iOS. | Native builds and physical-device testing. |
| [ ] | Confirm a permanent application ID and store owner before signing. Create/retain iOS signing access in Apple/Xcode and Android upload keystore in a password manager/CI encrypted secret store. | `com.wordconquest.app` is a placeholder until ownership is confirmed. Never send signing keys/passwords here. | Signed store builds. |
| [ ] | For the planned mobile push notifications, enable APNs and FCM in Apple Developer / Firebase Console and put server credentials in backend secret storage; configure capabilities and consent. | Use in-app inbox for the web pilot; test native push on devices. Credentials are not required for web play. | Native push only. |
| [ ] | In App Store Connect / Play Console, provide operator/support details, privacy-policy URL, content rating, distribution countries, screenshots and required privacy/data-safety declarations; complete any account-specific testing requirements. | No ads, public matchmaking or messaging in first release. Owner reviews final listing/disclosures. | Store review submission. |
| [ ] | Explicitly authorize the final public release after reviewing signed builds and device evidence. | No public submission during implementation. | Public store release. |

Sources checked: https://supabase.com/pricing,
https://supabase.com/docs/guides/auth/auth-smtp,
https://supabase.com/docs/guides/platform/backups,
https://capacitorjs.com/docs/getting-started/environment-setup.

Resend's current Supabase SMTP instructions specify host `smtp.resend.com`, port
`465`, user `resend`, and the app-specific Resend API key as password. Enter these
directly in Supabase Authentication → Email → SMTP Settings, along with the verified
sender email and sender name. Source: https://resend.com/docs/send-with-supabase-smtp.
Zoho is receiving only; no Zoho password or API integration is needed by the app.

## Android push setup - owner actions

Use the existing Google account and a separate Word Conquest Firebase project.
Keep Spark/free, no billing account, Analytics disabled. No Firebase database,
hosting or authentication setup is required. This blocks Android push delivery,
not core gameplay. The existing Android package is com.wordconquest.app.

1. https://console.firebase.google.com/: create Word Conquest. Register an Android
   app with package com.wordconquest.app, nickname Word Conquest Android. SHA-1 is
   not needed for this FCM-only setup. Download google-services.json to
   C:\repos\word-conquest\android\app\google-services.json. Agent handles SDK/Gradle.
2. Project Settings > Cloud Messaging: confirm Firebase Cloud Messaging API (V1)
   is enabled; if necessary enable Firebase Cloud Messaging API in Google Cloud's
   API Library with this new project selected. Legacy messaging is not needed.
3. https://console.cloud.google.com/iam-admin/serviceaccounts: select the same new
   project and create word-conquest-push. Grant only Firebase Cloud Messaging API
   Admin (roles/firebasecloudmessaging.admin) on this project; skip optional user
   access. Open that service account > Keys > Add key > Create new key > JSON.
4. Save the downloaded private file, renamed firebase-service-account.json, to
   C:\Users\Norbert\AppData\Local\WordConquestBuild\secrets\firebase-service-account.json.
   This folder is outside the repository. Never paste the key in chat or place it
   in android/app or frontend assets. Agent will provision it in Supabase Edge
   Function secrets for server-side sending; the APK gets only google-services.json.
5. Tell the agent "Firebase files saved". No credentials need to be sent in chat.

References: https://firebase.google.com/docs/android/setup,
https://capacitorjs.com/docs/v7/apis/push-notifications,
https://firebase.google.com/docs/cloud-messaging/send/v1-api,
https://docs.cloud.google.com/iam/docs/roles-permissions/firebasecloudmessaging.
