# Architecture and audit

The starting commit is bbb3d68. Root HTML/CSS/JS is a working local two-player
prototype. No package manifest, backend, auth, durable state or deploy config was
present. All three original test programs pass. ROADMAP.md and design/ were
untracked owner-provided requirements and are preserved. The approved image was
inspected: ivory paper, sage/forest green, walnut, espresso, restrained ochre.

Reuse: DOM-free engine and configurable scoring, pointer/keyboard board interaction,
existing GitHub remote https://github.com/xNorbertx/word-conquest.git and possible
Pages hosting (documented, not verified deployed). No cloud environment variable
names, project configuration, authenticated hosting CLI or browser sessions were
found. This is not evidence the owner has no accounts. Node 16 is installed globally;
the bundled Node 24 runtime can run tooling without changing the machine installation.
No Docker, Deno, PostgreSQL CLI or Android SDK was discovered. Windows cannot run Xcode.

Owner confirmed existing Resend sending and Zoho receiving accounts on another
domain. Reuse these with a dedicated sending key and chosen existing sender/support
identity; do not change the unrelated application's configuration. Signup/recovery
email is needed for the friend pilot; optional turn email can wait.

## Concrete choice

Static web app + Supabase Auth, Postgres and Edge Functions. No framework rewrite,
Redis, always-running Node server, separate queue service or realtime dependency.
Poll while visible and refresh on focus/reconnect. Package the built web assets with
Capacitor when SDKs are available. Prototype remains at root; online is separate.

Versioned engine/config snapshots execute on the server. Clients send intent only:
path, joker choices, action, expected revision and operation UUID. The server verifies
the JWT with Auth, checks membership and turn, validates against a pinned dictionary,
computes scores/captures/replacements and writes through a service-only Postgres RPC.
The RPC locks the game, checks revision, saves state/history/operation receipt and
inbox events in one transaction. A concurrent computation loses the compare-and-swap
and reloads; it can never replace accepted state. Idempotency binds operation IDs to
the actor and exact input; retries return the accepted revision without replaying.

RLS gives participants read access only; game writes and invitation transitions are
service-only. Stats derive from one current terminal record per game, preventing
double counting. Games pin rules and dictionary hashes. New rules get new versions;
never edit a released snapshot. No client-provided scores, users, RNG or rules.

Durable inbox doubles as notification outbox. Email delivery is independent of turn
commit, retried, and uses provider idempotency. No realtime socket is needed for a
game played over days. Resignation counts as a loss; mutual draw counts as draw;
abandonment after 30 days without play is unranked. Never silently award inactivity
wins. Invite links are bearer capabilities, expire in 7 days, and only show a minimal
preview before acceptance. Share privately.

## Acceptance boundaries

Local test results are not hosted acceptance. Migration/RLS/concurrency integration,
real email confirmation/recovery, restart/reconnect on two devices, backup restoration,
and complete multi-day game play remain release gates until actually observed.
