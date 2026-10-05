# Pilot privacy and account policy — owner review required

Not approved for public release until the operator name, support address, hosting
region, backup destination and retention have been confirmed in SETUP.md.

The app stores an email address for confirmed login and recovery in Supabase Auth,
a player-chosen unique username, game boards and moves,
invitation capabilities, friendships, blocks, and an inbox. No contacts upload, anonymous public directory,
advertising, chat or analytics scripts are included. Optional Android push stores
a random installation ID and FCM registration token, linked to the signed-in account.
Firebase messaging auto-initialization is off until the user enables notifications.

Only participants can read their game records. Owner decision, 4 October: signed-in
players can search usernames without an opt-in step. Results contain a name,
friend code, opaque ID and the caller's own friendship state; no email, game record,
statistics or device information. Friend codes can also be shared as an exact
lookup. Partial search requires three characters; shorter usernames match exactly. Search returns at
most 20 matches, and is covered by authenticated API rate limiting.

Owner clarification, 5 October: account creation uses email/password. Authenticated
new accounts choose their username on a separate required screen, with an optional
Randomize suggestion. Existing account names are retained. A database unique index ignores case;
Unicode NFKC normalization and outer-space trimming precede reservation. Names
contain 1–40 letters, numbers, spaces or `. _ - ( ) '` and at least one letter/number.
`profiles.username IS NULL` is the persistent incomplete-setup state; no local flag
or editable Auth metadata can skip it. Names are reserved only when Continue saves
them. Unnamed accounts cannot play or use Friends and do not appear in friend search,
including by code. Random suggestions are availability-checked, editable and not
reserved until saved; the unique index handles a competing claim at save time.
Completion uses a locked transaction, so lost replies or another device completing
setup cannot overwrite a saved name. The legacy availability endpoint remains public
for older clients and exposes only a boolean, not a directory, profile or email.
Auth's signup/email limits remain enabled. Saved usernames have no automatic expiry;
no accounts are deleted by this feature. An authenticated
rename releases the old name, and account deletion releases the name. Names may
therefore be reused; friendships, invitations and games identify accounts by UUID,
never by username. Auth metadata cannot set or change a username. `display_name` remains a synchronized database
alias for installed older clients.

Friend requests require acceptance. Users can decline, cancel, remove or block;
blocks hide both players from each other's search and stop new requests/invitations.
Existing active games remain available to leave explicitly. Requests are limited
to 20 per day and 100 accepted/pending relationships, with a one-day resend cooldown.
Action receipts preserve retries; they are private and removed on account deletion.

Shared links are bearer invitations: share privately, cancel if exposed, and expect them
to expire in seven days. Logs contain request IDs and error categories, never tokens,
email addresses, board contents or request bodies. Supabase's own platform logs may
contain connection metadata under its platform policy. Invitations sent from Friends
are restricted to the addressed account even if someone obtains the link. Account
deletion also removes friendships, blocks and pending invitations to the account.

Resend sends signup confirmation and recovery mail. Turn-alert emails are out of
scope. Google Firebase Cloud Messaging delivers opted-in Android game alerts;
turn alerts include the opponent username and points gained, as requested by
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
