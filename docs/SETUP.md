# One manual setup checklist

29 September 2026. Only owner actions are listed here. Implementation, migrations,
builds and verification are the agent's work once access exists. Never paste secrets
in chat, commit them, or put service-role keys in the browser.

## First online version — private friend pilot

| Done | Owner action / exact location | Recommended default and why | Blocks |
|---|---|---|---|
| [x] | Sign in at https://supabase.com/dashboard and create a **dedicated Word Conquest** project in a free organization (or identify an existing dedicated project). Choose an EU region; store the generated database password in your password manager. | Free plan, no card/upgrade/add-ons. One service supplies identity, recovery, database and functions. Do not reuse another app's database. Free projects can pause after a week of low activity; this pilot is not an always-on production guarantee. | Remote persistence, identity, server turns, cross-device friend test. |
| [x] | Project Settings → API: place project URL and **publishable/anon** key in `C:\repos\word-conquest\online\config.local.js`, following `config.example.js`. For deployment, authenticate the Supabase CLI locally (`supabase login`) and retain the database password locally when linking. | Public URL/key are safe in a web bundle; privileged credentials are not. Supabase provides server secrets to deployed functions automatically. Use Dashboard → Edge Functions → Secrets for `APP_ORIGIN` (exact web origin) and `APP_URL` (full `/online/` URL). | Deploying and connecting this project's backend. |
| [ ] | At https://github.com/xNorbertx/word-conquest/settings/pages, verify existing Pages access and sign in locally to GitHub/Git Credential Manager if publishing is wanted. | Keep the root prototype. Publish the built online client under `/online/` only after checks. Existing GitHub Pages URL is sufficient; no domain purchase is needed. No authenticated deployment access was found during audit. | Hosted shareable web link; local implementation is unaffected. |
| [ ] | **Reuse your existing Resend account.** In https://resend.com/domains choose an already verified domain whose identity you want on Word Conquest mail. Create an app-specific sending key, scoped to that domain where available. Supabase → Authentication → Email/SMTP: enter Resend's documented SMTP settings and the chosen sender there. | Required for signup confirmation and recovery before friends join. No new email service or domain; no DNS changes if the selected domain is already verified. Keep the existing app's keys/settings untouched. Store credentials only in Supabase secret settings/password manager. | Friends signing up and recovering accounts. Optional turn emails can wait. |
| [ ] | Supabase → Authentication → URL Configuration: set Site URL to the online app; allow its exact callback URL and localhost pilot URL. Disable unused providers. | Confirm email on. Production redirects only to the actual app. Invitation code is retained locally through sign-in. Configure production Auth rate limits before broader use. | Confirmation and recovery on actual devices. |
| [ ] | **Reuse your existing Zoho receiving service.** Choose an existing support address or add a Word Conquest alias in Zoho Mail Admin Console under your verified domain; put that public support/privacy address and operator name in local `online/config.local.js`. Review `docs/PRIVACY.md`. | Invite-only, no public profiles, no chat, no ad analytics; email stays in Auth. Opponents see display names and shared game history only. Deleted accounts are anonymized in shared games; private notifications/profile removed. Confirm this shared-history policy before admitting real users. No new inbox service is needed. | Real-user pilot privacy notice and support. |
| [ ] | For email game alerts, use the same verified Resend sender and put `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` and a random `NOTIFY_SECRET` in Supabase Edge Function Secrets. Configure a Supabase scheduled job to call `notify` every 5 minutes using a secret from Vault, following `docs/OPERATIONS.md`. | In-app inbox always works; email is opt-in and contains only a generic event and game link. No separate notification service, SMS, APNs or FCM needed for web pilot. | Background email turn alerts. Core turn persistence does not depend on delivery. |
| [ ] | Choose an encrypted backup destination you control and a person/address to receive service failures. Use the backup/restore runbook in `docs/OPERATIONS.md`; provide access locally, not in chat. | Daily export and a restore drill before calling the pilot reliable. Built-in platform logs first; no new paid monitoring service. | Operational acceptance, recovery from data loss. |

Material owner decisions, bundled here: retain $0 pilot limits or explicitly approve
an always-on plan later; approve EU hosting/private shared-history retention and
identify the operator/support contact. Default is **no spending and no public
release**. Supabase Pro is currently advertised from $25/month; this is not a hard
total-cost cap. SMTP/domain costs depend on existing services. Do not enable paid
usage merely to pass a test.

## App-store release only — does not block the web pilot

| Done | Owner action / exact location | Recommended default and why | Blocks |
|---|---|---|---|
| [ ] | Apple https://developer.apple.com/programs/enroll/ and Google https://play.google.com/console/signup: enroll under the intended owner and complete identity/terms/payment yourself, or grant access to existing accounts. | Defer fees until web acceptance. Confirm current fees at enrollment; no purchase is authorized. | Store distribution only. |
| [ ] | Provide access to a Mac with supported Xcode and an iPhone; install Android Studio/SDK on the Windows build machine and supply an Android test device. | Capacitor retains web/JS; this machine has Java but no discovered Android SDK, and cannot build iOS. | Native builds and physical-device testing. |
| [ ] | Confirm a permanent application ID and store owner before signing. Create/retain iOS signing access in Apple/Xcode and Android upload keystore in a password manager/CI encrypted secret store. | `com.wordconquest.app` is a placeholder until ownership is confirmed. Never send signing keys/passwords here. | Signed store builds. |
| [ ] | If native push is included at release, enable APNs and FCM in Apple Developer / Firebase Console and put server credentials in backend secret storage; configure capabilities and consent. | Keep email + inbox until native push passes device tests. Credentials are not required for web play. | Native push only. |
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
