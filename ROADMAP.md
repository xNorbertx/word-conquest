# Word Conquest — app roadmap

Updated: 4 October 2026

This is an acceptance checklist. The original local two-player prototype remains
available; a separate online implementation now exists. Rules remain experimental.
See [implementation and verification status](docs/PROGRESS.md) and the single
[manual setup checklist](docs/SETUP.md). Boxes remain unchecked until their hosted
and real-device acceptance checks pass, not merely because source code was written.

Current status: web app published on GitHub Pages, authoritative Supabase backend
deployed, and authentication email delivered successfully through Resend. Automated
hosted play completed 36 turns; owner reported a real 20-action play session on
3 October. Live updates and visible game exit controls are deployed. Android push
is implemented/deployed and a versioned, signed pilot APK passed GitHub Actions.
Physical Seeker notification and upgrade acceptance remains pending.

Owner decisions: no turn-alert emails for this iteration; retain authentication
confirmation/recovery email. In-app updates serve the web pilot; native push is the
mobile notification goal. Owner will run the multi-day playtest and report results.
Keep letter distribution unchanged; record consonant-heavy play as feedback.

Owner advanced Android packaging and push ahead of remaining reliability work.
The build pipeline is ready; next mobile acceptance is real Seeker delivery,
notification taps and an in-place APK upgrade. Engineering work still includes
interrupted submissions, resume/session recovery, backup/restore and monitoring.

UX revision 0.3.0: rebuilt navigation, board presentation, invitations, identity,
activity and account screens. Browser checks and regression suites pass; owner
visual feedback is positive; physical-phone acceptance remains open. See [UX review](docs/UX.md).

UX revision 0.3.2 makes your name, YOU label, sage/walnut side, starting tiles and
current turn explicit. Selection and Play word colours follow your actual seat;
both player perspectives and narrow-screen states have browser verification.
Seeker touch/upgrade acceptance remains a device check.

First milestone: invite a friend and reliably finish a game over several days.

## Must-have — first asynchronous friend-play app

- [ ] Product design: a coherent visual identity, readable board, clear score breakdown, selection feedback, loading/error states, and a short introduction to the rules.
- [ ] Mobile and accessible interaction: comfortable touch targets, different screen sizes, clear joker entry, and ownership indicators that do not rely only on color.
- [ ] Persistent player identity: sign-in, a simple profile/name, account recovery, and access to the same games across devices.
- [x] Persistent game service: save the board, letters, ownership, scores, remaining letter budget, current player, rules, and move history so games survive closing the app.
- [x] Server-authoritative play: validate players, turn order, paths, words, captures, and scores on the server; generate replacement letters there too. A modified client must not be able to award itself points.
- [ ] Reliable turn submission: retries cannot submit the same move twice; reconnecting restores the accepted state; stale boards cannot overwrite newer turns. Clearly distinguish pending and accepted moves.
- [ ] Invitations: share a link or code, accept or decline, and cancel unaccepted invitations. Opening an invitation should lead to the right game after sign-in.
- [ ] Game list: show invitations, active games, whose turn it is, and completed games.
- [x] Web pilot notifications: in-app inbox and live game updates, with participant-only access. Turn-alert email is out of scope by owner decision.
- [ ] Mobile notifications: native push for turns/invitations, preferences, and links to the relevant game; verify permissions, background delivery and logout/token cleanup on devices.
- [ ] Opponent-move recap: show the word, traced path, captures, score changes, and replaced letters when returning to a game.
- [ ] English dictionary validation: choose a word list with suitable usage rights. Define treatment of inflections, slang, proper nouns, abbreviations, and offensive words. Explain rejected words clearly.
- [ ] Game lifecycle rules: define resignation, draws, inactive opponents, and abandonment, including their effect on statistics. Make the ending and final-reply rule clear.
- [ ] Basic statistics: wins, losses, draws, highest final score, and best-scoring turn/word. Record completed games and moves so richer statistics can be added later; do not count a result twice.
- [x] Versioned rules and dictionaries: games retain the versions they started with. Keep records comparable by separating statistics for materially different rulesets and languages.
- [ ] Privacy and account controls: decide what profile/results information is public, collect only needed data, and provide account/data deletion.
- [ ] Operational basics: backups and recovery, error reporting, service monitoring, and a way to investigate a broken game or receive a bug report.
- [ ] Verification before release (owner is handling the multi-day playtest; engineering handles interruption/resume tests): scoring and rule tests, interrupted-submission/reconnection checks, and real-device playtests of a complete asynchronous game.

## Must-have when the relevant feature launches

- [x] Android pilot build automation: reproducible Capacitor APKs, increasing versions, stable pilot signing, tests and downloadable artifacts on source pushes. This does not complete device acceptance or app-store signing.
- [ ] Public opponents or free-text messaging: blocking, reporting, abuse handling, and appropriate moderation controls.
- [ ] App-store distribution: signing and release setup, icons/screenshots/listings, required privacy disclosures, device testing, and an update process. Check platform requirements when preparing the release.

## Nice-to-have — later iterations

- [ ] Matchmaking with similarly skilled opponents; ratings once the player population supports useful matching.
- [ ] Friends list and convenient repeat invitations.
- [ ] One-tap rematches with alternating starting players.
- [ ] Simple messaging; preset reactions can be an initial smaller version of this feature.
- [ ] Multiple languages, each with its own dictionary, letter distribution, scoring balance, and records. Interface translation is a separate task.
- [ ] Practice mode and a computer opponent.
- [ ] Full game replays and shareable results or best-word cards.
- [ ] Postgame word exploration: discover missed opportunities after the game is finished.
- [ ] Richer statistics: average word length, average turn score, captures, castle control, personal records, and progress over time.
- [ ] Casual and timed modes with clear inactivity policies.
- [ ] Offline move drafts, checked against the current server state after reconnecting.
- [ ] Spectating, tournaments, and private groups.
- [ ] Better board-generation evaluation using actual available words and fairness measurements.

## Open game-design questions

Keep these configurable and evaluate them through playtests rather than treating the current rules as permanent:

- Board size, shape, connectivity, and difficult edge tiles.
- Starting territory and first-player advantage.
- Letter category balance, replacement distribution, and luck over a full game.
- Joker count and placement.
- Starting a word on owned territory versus merely touching it.
- Enemy-capture limits, defense, and disconnected territory.
- Castle number, placement, and value.
- Word length bonuses, letter values, and the balance between permanent word points and territory points.
- Shared letter budget versus turn limits, ending fairness, and game length.
- Repeated words, refresh turns, stalemates, and comeback mechanics.

## Suggested delivery order

1. Define the first app's screens, dictionary policy, and game lifecycle.
2. Complete the friend-play loop: identity, invitations, authoritative saved games, dictionary, game list, recap, and reliable submissions.
3. Finish reliability acceptance, backup/restore, monitoring and full asynchronous playtesting; statistics and account controls already have implementation/test coverage.
4. Prepare mobile distribution once the complete loop works reliably.
5. Add later features in response to actual player needs.

## Technology decision — recommendation, not a commitment

For the next milestone, keep the working web client and add the asynchronous service. Consider gradually introducing TypeScript while retaining the separate game engine. Capacitor is a practical route to packaging a web client for iOS and Android, with native features through plugins. This preserves more of the current implementation; it still requires mobile design, device testing, notification integration, and release work.

Flutter is also a valid choice, especially if a mobile-first Flutter codebase is a strong preference. It targets iOS, Android, and web, but the existing HTML/SVG interface would need rebuilding and game logic would need porting or a deliberate integration approach. Keep server validation authoritative whichever client framework is chosen. If client and server use different languages, plan how scoring previews and validation remain consistent.

Official references:
- Capacitor: https://capacitorjs.com/docs
- Flutter platform support: https://docs.flutter.dev/platform-integration/web

The client framework does not replace the game server, storage, identity, or notification service. Choose those separately after defining the first online milestone.

Android update: opt-in FCM delivery, registration/logout handling and retry queue
are implemented and deployed. Automatic versioned APK builds pass in GitHub Actions.
The owner confirmed a real test notification on the Seeker after enabling in-app
registration on 4 October. Version 0.3.1 adds a home opt-in prompt, connection
status, retry/settings, a per-phone test and foreground alerts. Normal turn
delivery, notification taps and upgrade acceptance remain open.
Turn alert copy now includes the opponent display name and total points gained
from the saved turn (word points plus territory), including final scoring turns.
See docs/ANDROID.md for builds and tests.
