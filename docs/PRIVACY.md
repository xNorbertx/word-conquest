# Pilot privacy and account policy — owner review required

Not approved for public release until the operator name, support address, hosting
region, backup destination and retention have been confirmed in SETUP.md.

The app stores an email address for confirmed login and recovery in Supabase Auth,
a player-chosen display name, game boards and moves,
invitation capabilities, and an inbox. No contacts upload, public directory,
advertising, chat or analytics scripts are included. Optional Android push stores
a random installation ID and FCM registration token, linked to the signed-in account.
Firebase messaging auto-initialization is off until the user enables notifications.

Only participants can read their game records. The game API exposes names only to
participants and a minimal inviter name to an authenticated invitation-link holder.
Links are bearer invitations: share privately, cancel if exposed, and expect them
to expire in seven days. Logs contain request IDs and error categories, never tokens,
email addresses, board contents or request bodies. Supabase's own platform logs may
contain connection metadata under its platform policy.

Resend sends signup confirmation and recovery mail. Turn-alert emails are out of
scope. Google Firebase Cloud Messaging delivers opted-in Android game alerts;
turn alerts include the opponent display name and points gained, as requested by
the owner on 4 October. Payloads also contain an event ID and game reference;
they do not include email addresses, board contents or played words.
Google handles installation identifiers and delivery metadata. Disable alerts in
Account or Android Settings. Sign-out disables the device registration; deletion
removes its registration and queued deliveries. Pilot support is through the inviter;
the owner deferred a dedicated inbox. No notification preference enables marketing.

The Account screen exports the profile and all shared game snapshots, whose logs
contain played words and scoring. Account deletion requires explicit typed confirmation
and recent sign-in. Private inbox, profile and login are deleted; active games are
abandoned without a ranked result. Retained shared game records replace the departing
user ID and name, preserving the opponent's history and completed results. Operational
receipts retain anonymized action history for retry/integrity purposes. This is not a
promise that an opponent cannot remember who they played.

Recommended pilot retention: active/completed game history while participants use
the app; expired unused invites purged after 30 days; read inbox events after 90 days;
encrypted backups retained 7 days, with deletions re-applied after restoration before
opening access. These retention jobs are not yet scheduled. The owner must confirm
and operate retention before public release. Do not describe backup erasure as instant.

Dictionary: exact membership in the pinned Letterpress-derived ASCII list. Inflections,
slang and archaic words count only when listed; no stemming or spellchecker guesses.
Punctuation and spaces are excluded. Proper names/acronyms are not added separately;
the inherited lowercased list may include ambiguous entries. Offensive words are not
filtered in this private adult pilot. Public/family positioning would require a reviewed,
versioned policy/list and abuse controls. No public opponents or free-text messages ship.
