# Game languages

## Current openings — 0.9.0

New English games use autumn-v4; new Swedish games use autumn-sv-v2. Both use
the same pinned opening-v4 generator: one joker in each starting block and one
adjacent to each corner castle, with random reflected offsets. The dictionaries,
alphabets, weights, category budgets, scoring and replacement rules are unchanged.
Existing autumn-v1/v2/v3 and autumn-sv-v1 games retain their original behavior.
Both players need the updated client for new-layout games. Letter lens supports
both alphabets and older games; unassigned jokers are visually blank with zero
letter points and an accessible Joker label.


Version 0.8.0 adds Svenska alongside English. Choose the language in New game,
including when inviting directly from Friends. The last choice is remembered on
that device for that account. Invitations, game cards and game headers identify
the language; the interface remains English. Both players need 0.8.0 or the latest
web client for Swedish games. Existing games remain English.

## Pinned Swedish dictionary

Source: [Martin Lindhe's Swedish word list](https://github.com/martinlindhe/wordlist_swedish),
commit `c1c4464df5d2232fcdd04f2b17bc491aba3cda27`, MIT, copyright 2014 Martin Lindhe.
The author describes a list compiled since 2007 without names. This is a community
word list, not SAOL or an official tournament dictionary; omissions and unusual
entries can occur. It is not an offensive-word filter.

Our snapshot keeps only lowercase, NFC-normalized, 3–69-letter entries containing
A–Z or Å/Ä/Ö, then deduplicates and sorts them. It contains **400,901** words under
`swedish-lindhe-v1-f214ceab2ae3`. Listed inflections and compounds count; no stemming,
automatic compounds, accent removal or proper-name additions. For example, får,
bär, öar, hund, hunden, hundar, hundarna, älg, älgar, äpple and smör are accepted.
Å, Ä and Ö are distinct letters. Q/W/X/Z remain available for listed loanwords.

The upstream and derived checksums, source URL, filtering policy and letter weights
are in `server/versions/dictionary-sv-v1.meta.json`. The complete licence is in
`server/versions/SWEDISH-LICENSE.txt` and the app's Dictionary licence screen.
To reproduce the identical snapshot with Node 22+:

```
node scripts/pin-swedish.cjs <path-to-swe_wordlist> <path-to-upstream-LICENSE>
npm run build
```

Download those inputs from the exact pinned commit above. The script checks the
source checksum and licence, and refuses to overwrite a different frozen output.
Do not replace a live dictionary snapshot: add a new version for future games.

## Swedish letters and scoring

`autumn-sv-v1` retains the current English castle-income mechanics: unlimited
captures, six jokers, a random starter, equal final turns, a 120-letter budget,
side/centre income of 2/4 per full round and ownership values of 3/5.

Board generation and replacements use Swedish letter-occurrence weights derived
from the pinned list. These are frequencies across dictionary spellings, not
natural-text usage or a claim of optimal play balance. The existing vowel/flexible
category shares and rare-letter limits remain in place. Swedish vowels include
Y/Å/Ä/Ö; J is ordinary. Every one of the 29 letters has a positive weight. A board
need not contain all three accented letters at once; jokers can represent them.

Word-letter points: `AEIOUYÅÄÖRSTLND` = 1; `BCFGHJKMPV` = 2; `QWXZ` = 4.
Jokers remain zero, and length bonuses are unchanged. These starting values should
be evaluated through real Swedish games before making a new balance version.

## Deployment and compatibility

The authoritative language is bound by each saved game's rules and dictionary
versions. No mutable language field or database migration is needed. The server
chooses both when creating the board; client-supplied dictionaries, scores or
replacement letters cannot override them. Once created, invitations and games
keep that language. Creation retry keys include language to prevent a failed
English invitation being accidentally reused for a Swedish one.

Build and deploy `game-api` before publishing the new web/APK client. English v1–v3
engines, rules, dictionary and saved games stay intact. Older clients can continue
English games, but the API asks them to update before joining/playing Swedish.
Keep the Swedish backend version available for the lifetime of its games, including
if the frontend is rolled back. Statistics already group by rules/dictionary.

Dictionaries stay on the server. The deployment bundle gzip-compresses both lists to fit the existing upload limit.
Their data and Sets load lazily when a
turn needs the selected list; game-list/board reads do not construct either Set.
There is no paid dictionary service, new account, recurring job or new cost.

Automated coverage includes Unicode joker input, letter generation/replacement,
both seats, score-animation reconciliation, dictionary separation, version gates,
save/reload, creation and turn retries, stale submissions and a complete saved game.
The local fixture has `?fixture=swedish` for the board, `?fixture=swedish_home`
for mixed-language cards and `?fixture=swedish_invitation` for an incoming link.
Swedish vocabulary quality, narrow-screen appearance and keyboard input on the
physical Seeker remain playtest acceptance.
