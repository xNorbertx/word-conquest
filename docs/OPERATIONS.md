# Run, deploy and maintain

## Current deployment — 30 September 2026

Dedicated project `aumiyyjsdqdazzmdmprl`, Free plan, Paris EU. CLI authenticated locally
and linked; migration and both functions deployed. Local app's public connection is
in ignored `online/config.local.js`. Function origin and APP_URL currently point to
`http://127.0.0.1:4173` and `/online/`. Update those to the approved frontend host before
friend testing on other devices. SMTP, notification scheduling and backups are pending.
CLI is now pinned as a project dependency: run `npx supabase` with Node 22+.

## Local build

Use Node 22+ (the machine's default Node 16 is too old). The audit found a bundled
Node 24 at `C:\Users\Norbert\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`.
With a supported Node on PATH:

```
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:4173/online/. Root `/` still serves the unchanged local prototype.
Without connection configuration the online client shows setup and a clearly labelled
visual preview. It does not invent users or simulate saved games. `online/config.local.js`
contains only public URL/key/contact fields. Never put a service key in this file.
No runtime CDN scripts are used. Build bundles the client SDK and engine locally.

`server/versions` is immutable release input. Do not rerun snapshot generation to
update v1. New dictionary/rule changes need a new engine/config/list registry entry,
hash, migration plan and separate stats group. The build checks dictionary integrity.

## Supabase deployment — dedicated project only

After the owner provisions and authenticates access, install the official Supabase
CLI, `supabase login`, then `supabase link --project-ref <dedicated-project-ref>`.
Check the project name before any migration. Review `supabase db push --dry-run`,
then apply `supabase db push` to the empty dedicated staging project. Do not reset
remote databases or run destructive seed commands.

```
npm run build
supabase functions deploy game-api
supabase functions deploy notify
```

Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to functions. Set
APP_ORIGIN to the exact allowed browser origin (for example the actual GitHub Pages
origin, not a pathname). Multiple approved origins can be comma-separated. Add
`http://127.0.0.1:4173` only for development. Native packaging later needs explicit
`capacitor://localhost` and `https://localhost` origins; do not add wildcard origins.
APP_URL is the full online client URL including its `/online/` path.
The API intentionally performs `auth.getUser` itself on every request; gateway
verify_jwt is disabled to avoid confusing publishable keys with legacy JWT keys.
This never means anonymous game access. Postgres mutation RPCs are service-only.

Host **contents of dist/** on the existing static host. This keeps the root prototype
and adds `/online/`. Do not publish raw source `online/app.js`, which needs bundling.
For GitHub Pages use an artifact deployment of dist, not a switch to raw online source.
No CI workflow was enabled that could incur billed runner usage. No production alias
was changed and nothing was pushed during implementation.

## Mail and scheduling

Reuse Resend for SMTP confirmation/recovery and the existing Zoho support inbox.
For optional event email, set RESEND_API_KEY, MAIL_FROM, APP_URL, NOTIFY_SECRET in
Supabase Edge Function Secrets. Use a dedicated sender key, not another app's key.
Verify the exact SMTP settings from https://resend.com/docs/send-with-supabase-smtp.

In Supabase Dashboard → Integrations enable Cron and pg_net if not already present.
Store the scheduler secret in Vault as `wc_notify_secret`; create a job in the Cron
UI running every five minutes that POSTs to this project's `/functions/v1/notify`
with `Authorization: Bearer <Vault-resolved secret>`. Do not paste the secret into a
committed SQL file. Inspect the Cron job response and Edge Function logs. This needs
owner credentials; no remote job exists yet.

Only opted-in inbox events are emailed. Delivery never participates in the game
transaction, so mail outages cannot roll back or duplicate turns. Resend idempotency
keys are based on immutable event IDs. Retry delays grow up to an hour, with at most
6 tries inside 23 hours. Older/failed events stay visible in-app. Email is best-effort,
not guaranteed; do not promise exactly-once delivery beyond the provider window.
Auth confirmation/recovery emails are handled by Supabase SMTP, not this queue.

## Backups, recovery and monitoring

Free Supabase projects need owner-operated exports. Use `supabase db dump --linked`
for schema plus `--data-only --use-copy` for data, and `--role-only` for roles where
supported; consult current Supabase backup docs for managed auth/storage schemas.
App-table-only dumps cannot restore login accounts. Back up Auth users as supported
by the platform, app tables, migration files, version snapshots and secret references.
Keep actual secrets in the chosen secret store, never the dump repository.

Save exports daily to an owner-controlled encrypted destination; suggested retention
7 days. Record timestamp, row counts and checksum. Restore to a new isolated staging
project, restore Auth identities before FK-linked app data, apply grants/RLS, and
verify game versions, participants, state, receipts and counts. Test an interrupted
turn retry against restored state. Reapply account deletions after the backup date
before restoring access. Restore drill is a required acceptance gate and remains undone.
Never test by dropping live tables. Recreating anonymous users is not identity recovery.

Use Supabase database/function logs first. On failure, collect the client support code,
game ID, expected/accepted revision, timestamp and action type, not passwords/tokens.
Investigate `operations` versus `games.revision`; never manually award scores. For
correction, preserve the evidence and implement an audited repair transaction.

Monitor daily: errors by request ID/category, function latency, quota/egress, database
size, pending email age and attempts, failed Cron runs, backup age, and expired invites.
Add an owner-approved external uptime check only after hosting exists. A 401 from
game-api without credentials proves rejection, not successful DB/auth availability.
An authenticated read-only test account is needed for a meaningful end-to-end probe.
No external monitoring account or scheduled backup has been configured yet.

## Capacitor

The config targets dist/online. After build, `npx cap add android` / `npx cap add ios`
and `npx cap sync` generate/copy the project. Android Studio/SDK and a supported JDK
are needed for APK builds; Xcode on macOS is needed for iOS. Current identifier is
provisional; confirm ownership before signing. Generated native folders are ignored
and reproducible, so signing credentials cannot accidentally be committed with them.
Current auth links open the web app; native universal/app links, secure token-storage
review and push registration remain mobile release gates. Do not claim a store-ready
build from a successful web asset copy.

## Costs and rollback

No spending authorized or incurred. Intended pilot uses available free Supabase,
existing Pages, Resend and Zoho allowances. Supabase inactivity pausing can interrupt
a quiet pilot. Existing email subscriptions remain whatever the owner already pays.
No paid upgrade, additional domain, analytics, native push service or app-store fee
was purchased. Always-on production and enrollment fees need explicit owner approval.

Rollback the static deployment to the previous prototype artifact; leave database
and history intact. Server rollback must still serve all in-progress rules versions.
Never delete receipts or reset games as a rollback tactic.
