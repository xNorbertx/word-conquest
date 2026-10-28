"""Reproduce the language profiles. Research dependencies: ../balance/requirements.txt.
Derived profiles: CC BY-SA 4.0; see README.md. No wordfreq library ships in the app.
"""
import sys, json, pathlib, unicodedata, math, hashlib
from collections import Counter
root = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root/'work/balance-deps'))
from wordfreq import get_frequency_dict
out = root/'work/edges'; out.mkdir(exist_ok=True)
profiles = {}
for lang, filename in [('en','dictionary-v1'),('sv','dictionary-sv-v2'),('nl','dictionary-nl-v1')]:
    raw = (root/f'server/versions/{filename}.json').read_bytes()
    legal = set(json.loads(raw))
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + ('ÅÄÖ' if lang == 'sv' else '')
    def fold(word):
        return ''.join(c if lang == 'sv' and c in 'åäö' else ''.join(x for x in unicodedata.normalize('NFD',c) if not unicodedata.combining(x)) for c in unicodedata.normalize('NFC',word.lower())).replace('ĳ','ij')
    vocabulary = {}
    for word, frequency in get_frequency_dict(lang,wordlist='large').items():
        # Exclude punctuation/multiword entries; never invent accepted forms.
        if not word.isalpha(): continue
        normalized = fold(word)
        zipf = round(math.log10(frequency)+9,2) if frequency else 0
        if 3 <= len(normalized) <= 7 and zipf >= 3.5 and normalized in legal and all(c in alphabet for c in normalized.upper()):
            vocabulary[normalized.upper()] = max(zipf,vocabulary.get(normalized.upper(),0))
    counts = Counter(); pairs = Counter()
    for word in vocabulary:
        counts.update(set(word))
        pairs.update(set(''.join(sorted((a,b))) for a,b in zip(word,word[1:])))
    utility = {a:round(math.sqrt(counts[a]/max(counts.values())),5) for a in alphabet}
    compatibility = {a:{b:round(pairs[''.join(sorted((a,b)))]/math.sqrt(max(1,counts[a]*counts[b])),5) for b in alphabet} for a in alphabet}
    profiles[lang] = {'dictionarySha256':hashlib.sha256(raw).hexdigest(),'words':len(vocabulary),'utility':utility,'pairs':compatibility}
    (out/f'{lang}-words.json').write_text(json.dumps(vocabulary,ensure_ascii=False),encoding='utf-8')
    print(lang,len(vocabulary), ' '.join(f'{a}:{counts[a]}' for a in sorted(alphabet,key=lambda a:-counts[a])[:12]))
(out/'profiles.json').write_bytes((json.dumps(profiles,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
