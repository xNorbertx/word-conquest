# Dutch games — OpenTaal

Choose **Nederlands** before creating a link invitation or inviting a friend.
The choice is remembered per account and appears on game cards and invitations.
Games pin `autumn-nl-v1` and `dutch-opentaal-v1-0a831728bab0`; existing English and
Swedish games retain their exact rules and dictionaries. Older clients must
update before opening or joining a Dutch game. This adds a game language, not
a translation of the app interface.

## Source and spelling policy

355,792 distinct playable forms from [OpenTaal's wordlist.txt](https://github.com/OpenTaal/opentaal-wordlist/tree/b250510dda431785f962019167d1415198ff3905),
revision `b250510dda431785f962019167d1415198ff3905` (9 February 2025).
The upstream version file still identifies 2.20.23, dated 10 March 2023; the
commit and content checksums identify our exact input.

- Listed lowercase words only, including listed inflections and compounds.
- Accents fold to the plain letter: café → CAFE, zeeën → ZEEEN,
  reünie → REUNIE. No extra accent tiles.
- Internal apostrophes and hyphens are omitted: auto's → AUTOS,
  zee-egel → ZEEEGEL. Spaces, digits, other punctuation and dangling fragments
  are rejected. Compound words are never invented at runtime.
- IJ takes two tiles, I and J; the lowercase ĳ ligature normalizes to ij.
- Capitalized names and initialisms are rejected before normalization. This
  heuristic cannot guarantee that no name or abbreviation appears in lowercase.
- Three to 69 letters, matching the existing board and minimum word length.
- Only `wordlist.txt` is imported. No corrections, fragments, Roman-numeral
  supplement or spellchecker-generated forms are added.

OpenTaal is a general spelling resource, not a tournament adjudicator or a
family-safe list. Rare, offensive and specialist words may occur, and valid
Dutch words can still be missing. Future corrections require a new pinned
dictionary/rules version, with tests, rather than changing ongoing games.

## Letters and scoring

All 26 letters are supported. Relative letter weights come from occurrences
in the filtered dictionary; these are word-list frequencies, not prose/corpus
frequencies. Existing vowel, flexible-letter and rare-letter quotas still govern
board generation and replacements. J is ordinary because IJ is common in Dutch.
The existing six balanced jokers and random starting player remain.

| Points | Letters |
| --- | --- |
| 1 | A E I N O R T |
| 2 | D G L S U |
| 3 | B H K M P |
| 4 | C F J V W Z |
| 5 | Q X Y |

These are initial game values, not official Scrabble/Wordfeud values. Jokers
score zero. The length bonus starts at six letters: 1, 3, 5, 7… . Side/centre
castles earn 3/5 only after surviving an opponent's move or refresh. Every owned
tile earns one point at the finish. No immediate territory points, deductions
or additional final castle bonus. Dutch games contribute to personal Analytics.

## Reproduction, licensing and operation

Selected license: **BSD-3-Clause**. OpenTaal also offers CC BY 3.0. The original
complete license and author notices are preserved in `DUTCH-LICENSE.txt`, with
source and modification notice in `DUTCH-NOTICE.txt`. Both ship in the web/APK
dictionary licenses. OpenTaal does not endorse this app.

Download `wordlist.txt` and `LICENSE.txt` from the exact revision above, then run:

```sh
node scripts/pin-dutch.cjs /path/to/wordlist.txt /path/to/LICENSE.txt
npm test
npm run build
node --expose-gc scripts/check-dictionary-bundle.cjs
```

The importer checks both original SHA-256 hashes and refuses to overwrite a
different snapshot. The build checks dictionary and rules integrity and packs
the server dictionary; no word list is downloaded by the browser or APK.
Deploy `game-api` before publishing the client. No database migration, new
account, service, credentials or paid plan is needed. Existing hosting limits
still apply. No new fixed ongoing cost. See PROGRESS.md for release evidence
and device-testing limits.
