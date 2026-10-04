import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('work/castle-income-deps').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
data=json.loads(Path('docs/research/castle-income-2026-10-04.json').read_text())
ids=['current','flat_one','example','central_three','double','high']
rows=[next(r for r in data['datasets'] if r['stage']=='main' and r['id']==id) for id in ids]
labels=['Current rules','1 side / 1 centre','1 side / 2 centre','1 side / 3 centre','2 side / 4 centre','3 side / 5 centre']
colors=['#bcb8b0','#6f8d76','#97704e','#d7ac52']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':'#342a24','axes.labelcolor':'#342a24','xtick.color':'#655e56','ytick.color':'#342a24','svg.fonttype':'none'})
fig,ax=plt.subplots(figsize=(11.6,6.0),facecolor='#faf7f0')
ax.set_facecolor('#faf7f0')
for i,r in enumerate(rows):
 vals=[100*r['wordsShare'],100*r['ordinaryShare'],100*(r['sideEndShare']+r['centerEndShare']),100*r['incomeShare']]
 left=0
 for j,val in enumerate(vals):
  ax.barh(i,val,left=left,height=.61,color=colors[j],edgecolor='#faf7f0',linewidth=1)
  if val>=8:ax.text(left+val/2,i,f'{val:.0f}%',ha='center',va='center',fontsize=11,color='#ffffff' if j==1 else '#342a24')
  left+=val
 ax.text(104,i,f"{100*r['territoryShare']:.1f}%",va='center',ha='left',weight='bold',fontsize=12)
ax.set_yticks(range(len(rows)),labels);ax.invert_yaxis()
ax.set_xlim(0,113);ax.set_xticks([0,25,50,75,100],[f'{x}%' for x in [0,25,50,75,100]])
ax.set_xlabel('Share of both players’ combined final score',labelpad=10)
ax.tick_params(axis='both',length=0,pad=9)
for spine in ax.spines.values():spine.set_visible(False)
ax.set_axisbelow(True);ax.grid(axis='x',color='#e2dcd0',linewidth=.7)
fig.text(.035,.954,'How much of the score comes from territory?',fontsize=19,weight='bold')
fig.text(.035,.906,'Castle income per full round · final values: side 3 / centre 5 (current rules: 3 / 3)',fontsize=10.5,color='#655e56')
ax.text(104,-.69,'Territory\ntotal',ha='left',va='bottom',fontsize=10,color='#655e56')
fig.legend(handles=[Patch(color=c,label=l) for c,l in zip(colors,['Word points','Ordinary land','Final castle value','Castle income'])],loc='lower center',bbox_to_anchor=(.5,.087),ncol=4,frameon=False,fontsize=10)
fig.text(.035,.045,'128 simulated games per row · equal weight per game · about 4.5 letters per word',fontsize=10,color='#655e56')
fig.text(.035,.016,'Territory total = ordinary land + final castle value + castle income. Estimates depend on the playing model.',fontsize=9,color='#655e56')
fig.subplots_adjust(left=.22,right=.94,top=.79,bottom=.23)
for ext in ['png','svg']:fig.savefig('docs/research/castle-income-2026-10-04.'+ext,dpi=170,facecolor=fig.get_facecolor())
print('Saved PNG and SVG chart')

svg_path=Path('docs/research/castle-income-2026-10-04.svg')
svg_path.write_text('\n'.join(line.rstrip() for line in svg_path.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8')