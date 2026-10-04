"""Research-only vocabulary cache; not included in the app or committed.
wordfreq 3.1.1 by Robyn Speer/Elia Robyn Lake: https://github.com/rspeer/wordfreq
Code Apache-2.0; underlying data CC BY-SA 4.0 and additional source notices.
Frequency is a corpus proxy, not a claim about a player's vocabulary.
"""
import sys, json, pathlib
root=pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'work/balance-deps'))
from wordfreq import zipf_frequency
words=json.loads((root/'server/versions/dictionary-v1.json').read_text())
freq={w:zipf_frequency(w,'en') for w in words if 3<=len(w)<=12}
out=root/'work/balance';out.mkdir(exist_ok=True)
(out/'frequency.json').write_text(json.dumps(freq,separators=(',',':')))
print(json.dumps({'total':len(freq),'common35':sum(v>=3.5 for v in freq.values()),'common40':sum(v>=4 for v in freq.values())}))
