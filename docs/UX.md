# Autumn Sunday UX revision - 4 October 2026

The 0.3.0 client replaces the previous utility-style online interface. The original
root prototype and all server rules, dictionary versions and letter balancing stay
unchanged. No new service, paid asset, tracker or font dependency was added.

## Navigation and information

- Games is the home screen. Your turns sort first; Playing and Finished separate
  current games from history. New game offers inviting a friend or opening a code.
- Games, Activity and You are the three persistent destinations. A game gets a
  focused screen with Back and one overflow menu. Browser Back follows navigation;
  delayed responses cannot override a newer destination.
- Rules, detailed scores, move history and account controls open in accessible
  dialogs. There are no expandable folds. Icons have text or accessible labels.
- The board and selected word lead. Your named YOU card is always on the left,
  labelled Sage green or Walnut brown. The current player has a heavier border
  and the turn line explicitly says Your turn or names the opponent. Your own
  territory has stronger outlines; sage dots and walnut rings preserve ownership
  cues beyond colour. Selected tiles, path and Play word button match your side.
  Selection has numbered steps, clear/undo behaviour and a visible score.
- Refresh, resignation and draws retain explicit consequence confirmations.
  Pending turns stay conspicuous with a retry action; dictionary rejection keeps
  the selected word available to correct. Routine support IDs are on demand.
- Sign-in, signup and recovery show one relevant form. Profile, records, data
  export/deletion and per-phone notification settings live under You.
- Android launcher, splash and system-bar colours follow the same palette.

## Verification

All three original rule suites and 23 service/integration/presentation tests pass.
Local Android compilation passes. Browser review used isolated test data with the
real engine and dictionary, without modifying owner games or sending email.

Checked 320 x 640 and 390 x 844 portrait layouts and 1280 x 900 desktop; inspected
home, selected-word board, account, invitations and contextual sheets. Long names
truncate or wrap without page overflow. Board zoom is contained within the board.
Keyboard controls use one board Tab stop, arrows, Enter/Space, Escape and Backspace.

Exercised signup/recovery presentation, malformed invitation feedback, game filters,
profile edit, activity/read-all, Back and rapid navigation, score breakdown, joker
input, dictionary rejection, stale response, waiting turn, leave-game cancellation,
finished games and accepting a draw. Simulating a lost response after committing a
word then retrying produced exactly one saved turn. That is a controlled browser
check, not a claim of multi-day or physical-phone acceptance.

During review, fixed a retry toast obscuring the pending action, a desktop draw
notice overlapping the composer, insufficient secondary-text contrast, and long-name
layout. No browser console errors were reported during the navigation checks.

## Repeat the design checks

Run `node scripts/ux-preview.cjs` and open http://127.0.0.1:4175/.
Its clearly labelled scenario selector supplies home, game, waiting, completed,
invitation, empty, authentication, joker, draw and long-name states. The walnut
and walnut_waiting scenarios sign in as the second player; reentry has no owned
tiles. Lose reply
commits a turn but drops its response; Stale rejects the next turn. Valid word:
WORD along -4,-1 / -4,-2 / -3,-3 / -3,-2. Reload resets fixture server state.

The adapter is only imported by this separate build into ignored work/ux-preview.
Production dist and the APK use the real Supabase client. The fixture server binds
only 127.0.0.1; never deploy it. Use `--build-only` to refresh its bundle.

## Remaining acceptance

Owner review of the design, actual Seeker touch/keyboard/system-bar behaviour,
notification delivery/taps, in-place upgrade, and multi-day recovery remain open.
The fitted 69-tile board is inherently dense on narrow phones; use Enlarge board
when larger targets help. This revision does not claim full accessibility
certification. Existing operational backup/restore and monitoring gates remain.

## Player identity and turn clarity - 0.3.2

Replaced the small three-column score strip with two named player cards and a
stronger turn line. YOU is explicit beside the signed-in profile name, colour
names sit beside matching ownership symbols, and the card for the current turn
is outlined. Own card comes first visually and in keyboard order. Long opponent
names truncate while the word "turn" remains visible. Unconfirmed submissions
say Saving your turn / Turn awaiting confirmation rather than implying acceptance.

Reviewed both sides at 390 x 844, long names and waiting at 320 x 640, and desktop
at 1280 x 900. Verified walnut selection and submission, one-commit response-loss
retry, the resulting named opponent turn, no-territory reentry, and finished games
without an active-turn highlight. Browser warnings/errors absent in checked flows.
All three original rule suites and 35 service/integration/controller tests pass.
No changes to rules, scoring, territory ownership or board orientation.
