# Autumn Sunday UX revision - 4 October 2026

## Rematch — 0.17.1

Keep View board and Rematch on one row at the bottom of the result card. Rematch
is the primary action with a small refresh icon; no explanation or language picker.
While sending, show Inviting and disable repeat taps. Keep errors inside the popup.
Success opens the addressed invitation in the existing flow. Closing while sending
must prevent the response from unexpectedly navigating away from the finished board.

## Victory seal result — 0.17.0

Use the approved first concept: one centred result card, castle seal, short
outcome title, two prominent scores, four quiet scoring rows and best word.
The player's own score/seal/action follow their side in both themes. Display
letters separately from length bonuses; best word includes both. Keep the
opponent's name below their score and use “You” for the player.

Show the modal after final scoring. A first win gets brief confetti; subsequent
opens, losses, draws and reduced-motion settings do not. View board and a 44px
close control dismiss it; View result on the board reopens it. Native dialog
semantics block background interaction and support Escape/Android Back. Smaller
screens compress spacing; short landscape permits scrolling without clipping.

## Joker ownership colour and supply width — 0.16.3

Body-level joker controls must explicitly receive the playing side and use the
same ownership palette as the table, including dark mode and the letter flight.
Keep one visible player byline during scoring; do not repeat it below the word.
The supply bar shares roughly half the turn row, fills its available width and
caps at 220px. Retain room for the turn label and ellipsis for long player names.

## Compact letter-point preview — 0.16.2

Board ownership is conveyed by tile color and accessible labels; no small dot or
ring on owned tiles, including during scoring. The word row has a compact numeric
letter-point preview with a small “pts” label between the word and Undo. Keep it
hidden for an empty selection; reserve no extra vertical space. The previous-move
row keeps its text and history action without a trailing points figure.

## Scoring controls and word rejection — 0.16.1

Single tap skips the current scoring section; double-tap skips all. Group word
letters with the length bonus, and group both recipients within castles or
territory. No visible skip button or instructional copy. Preserve readable
letter timing, reduced-motion support and exact balances when skipping midway.

Unknown words use a centered modal on phone and desktop: short title, prominent
selected word, one large full-width Close button, subdued blurred backdrop.
Background controls are inert until dismissed. Keep the word available to edit.
Use native dialog focus/Escape/Back handling and existing light/dark colors.
Other warnings and popups are unchanged in this iteration.

## Minimal copy and components — 0.16.0

Keep the ivory/sage/walnut palette and board-inspired identity. Copy is direct:
name the screen or action, show the result, and explain only necessary choices
or consequences. No Sunday/cozy metaphors, slogans, motivational empty states,
decorative eyebrows or repeated instructions. Prefer “New game”, “Reset password”,
“No active games”, “Notifications” and “Delete account?”. Do not shorten destructive
consequences, privacy disclosures, scoring timing or accessible control names into
ambiguity. Keep a brief junk-mail reminder in email confirmation/reset flows.

Empty states are small and borderless. New-game languages share one row, with
native radio semantics and visible keyboard focus. Invitations put optional rules
behind a disclosure. Help derives its numbers from each game's saved rules.
Friend search replaces the visible main list until cleared. Notification controls
use the same action rows as account settings. Dialogs have smaller spacing and no
large confirmation icon. Account/analytics layouts are tighter; touch targets stay
at least 44px and long names wrap. Board geometry and play controls are unchanged.

Production DOM interaction checks pass; rendered/mobile visual acceptance remains
open because no browser or physical device is connected.

## Focus and sign-out — 0.11.2

Touch/mouse interaction has no focus rectangles. Keyboard navigation uses a quiet
sage indicator, with polygon-only focus on board tiles. The global brown outline
is retired. Both Sign out entry points ask Sign out? with Cancel / Sign out;
dismissing the dialog leaves the session and notifications untouched.

## Approved login — 0.11.1

Round 2 concept 3 is approved with its large background WC removed. The game name
is built from real octagonal tiles above an ivory form. A small WC castle crosses
the boundary. Sign-in shows only the essential controls and privacy/support link;
signup/reset add a short mode heading. No slogans or duplicate navigation brand.
The saved dark preference also applies. Username onboarding remains separate.

## Dark mode — 0.10.0

You → Dark mode is an immediate, persistent device-level switch. Light remains
the default. Warm charcoal surfaces, cream type, sage/walnut territory and gold
castles preserve the Autumn Sunday identity. Ownership shapes and selected-path
geometry are unchanged. Dialogs, forms, status messages and scoring/joker motion
use the same palette. Native system bar icons/background follow the setting.

## Current game screen — 0.9.4

The phone game fits the available viewport with safe-area padding. The word bar
contains only selected letters, undo and Play. Score details stay behind the score
cards; rules/history remain in the overflow menu. Zoom is a bounded pan area:
drag to move around, tap to select; fit mode keeps drag-to-spell. Zooming centres
on the current word or board centre. Long words scroll within the word bar.

Jokers use the approved **Word keys** picker (0.9.3): immediate QWERTY letters,
Swedish extras, automatic next blank and no instruction/confirmation text.

## Letter lens — 0.9.0

Approved prototype: option 3, with empty joker tiles instead of a symbol. Selected
jokers are editable slots in the word; the board opens the same picker after a
tap or completed drag. A native dialog shows nearby tiles, the enlarged candidate,
word preview, swipeable alphabet and Use letter. Cancel does not save the draft.
There is no text input or mobile keyboard. Blank tiles retain zero points and
screen-reader labels. Confirmation returns the letter to the board with a short
animation; reduced motion skips it. New-game joker placement is versioned and
distributed around all four corner castles. Phone feel remains to be confirmed.


The 0.3.0 client replaces the previous utility-style online interface. The original
root prototype and all server rules, dictionary versions and letter balancing stay
unchanged. No new service, paid asset, tracker or font dependency was added.

## Navigation and information

- Games is the home screen. Your turns sort first; Playing and Finished separate
  current games from history. New game offers inviting a friend or opening a code.
- Games, Friends and You are the three persistent destinations in 0.6.0. Activity
  moves into You. Friends starts with username search and shows requests,
  accepted friends with Invite buttons, and sent requests. Usernames are unique;
  codes and account IDs are not displayed or searchable. Blocked players is under
  You. Name search has no opt-in step (owner decision).
  A game gets a
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

## Compact metadata and lists — 0.8.1

Game cards use two rows: name/score, then status/language/time. New metadata should
join an existing row where it fits; do not add a full-width footer for each new
field. Remove repeated information and decorative separation before shrinking text.
Scores stay readable and You comes first. A full card is the tap target. Long names
can truncate in a summary if their full text remains accessible and in the game.
Metadata wraps naturally with large text; do not enforce fixed heights or hide the
language/turn state to meet a size target.

Applied the same approach to incoming invitation cards, the invitation summary,
account notes and the notification prompt. Friends/activity rows and page headings
use less padding; empty friend-search status space collapses. Essential explanations
remain when notifications are blocked or registration fails. Enable/dismiss targets
are at least 44 px. Game interaction, server operations and acceptance confirmations
remain unchanged.

Use the local fixture's compact scenario for mixed languages, a long opponent name,
four-digit scores, incoming/outgoing invitations and finished results. Existing
push_off/push_blocked/push_error scenarios cover notification banner states.
Source/build verification is complete; no browser surface is available in this
session, so rendered phone widths, large text and physical Seeker checks are pending.

## Main tab titles — 0.8.2

Games, Friends and You rely on the selected navigation tab and named section
landmarks rather than repeating a large page title. Keep useful actions in compact
rows and let the profile card lead the You page.
