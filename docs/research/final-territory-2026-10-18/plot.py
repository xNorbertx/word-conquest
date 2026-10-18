import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('work/castle-income-deps').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
root=Path('docs/research/final-territory-2026-10-18')
data=json.loads((root/'results.json').read_text())
rows=[r for r in data['datasets'] if r['stage']=='main']
names=['No territory bonus','+1 per final owned tile']
colors=['#46624d','#a4b591','#c29442','#e3c983','#946b50']
keys=['letters','bonus','sideIncome','centreIncome','finalTerritory']
labels=['Letter values','Length bonus','Side-castle income','Centre-castle income','Final territory']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':'#342a24','axes.labelcolor':'#342a24','xtick.color':'#655e56','ytick.color':'#342a24','svg.fonttype':'none'})
fig,ax=plt.subplots(figsize=(11,5.4),facecolor='#faf7ef');ax.set_facecolor('#faf7ef')
for i,r in enumerate(rows):
 left=0
 for j,k in enumerate(keys):
  val=100*r['shares'][k]
  ax.barh(i,val,left=left,height=.52,color=colors[j],edgecolor='#faf7ef',linewidth=1)
  if val>6:ax.text(left+val/2,i,f'{val:.1f}%',ha='center',va='center',fontsize=10,color='white' if j in [0,4] else '#342a24')
  left+=val
ax.set_yticks(range(2),names);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xticks([0,25,50,75,100],['0%','25%','50%','75%','100%']);ax.tick_params(length=0,pad=10)
ax.set_xlabel('Share of both players’ combined final score',labelpad=13)
for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'A modest reward for the land you keep',fontsize=21,weight='bold')
fig.text(.035,.87,'512 games per setup · same 256 board seeds, each with both starting orders',fontsize=10)
fig.legend(handles=[Patch(color=c,label=l) for c,l in zip(colors,labels)],loc='lower center',bbox_to_anchor=(.5,.075),ncol=3,frameon=False,fontsize=10)
fig.text(.035,.025,'Mean per-game shares. Main model: 12 sampled familiar words per turn. Automated play, not human playtests.',fontsize=9)
fig.subplots_adjust(left=.25,right=.96,top=.76,bottom=.35)
for ext in ['png','svg']:fig.savefig(root/f'distribution.{ext}',dpi=170,facecolor=fig.get_facecolor())
plt.close(fig)
fig,axes=plt.subplots(1,3,figsize=(11,5.1),facecolor='#faf7ef')
for ax,(key,title,limit) in zip(axes,[('attackRate','Word turns taking enemy land',100),('lateAttackRate','Attacks in the final quarter',100),('lastMoveReversal','Last-move lead reversals',15)]):
 ax.set_facecolor('#faf7ef')
 for i,r in enumerate(rows):
  val=100*r[key];ax.bar(i,val,color=['#a4b591','#946b50'][i],width=.6);ax.text(i,val+limit*.025,f'{val:.1f}%',ha='center',va='bottom',weight='bold')
 ax.set_ylim(0,limit);ax.set_xticks([0,1],['No bonus','Final territory']);ax.set_title(title,fontsize=11,pad=20);ax.tick_params(length=0,pad=8);ax.set_yticks([])
 for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'More land tactics. More late reversals.',fontsize=21,weight='bold')
fig.text(.035,.88,'Main comparison · 512 games per setup',fontsize=10)
fig.text(.035,.055,'Late = turns starting after 90 of 120 letters used. Reversal = the projected pre-final-move leader loses;',fontsize=9)
fig.text(.035,.025,'current territory is included in that projection. Tied pre-move positions excluded. Bot results, not measured enjoyment.',fontsize=9)
fig.subplots_adjust(left=.045,right=.97,top=.7,bottom=.2,wspace=.3)
for ext in ['png','svg']:fig.savefig(root/f'gameplay.{ext}',dpi=170,facecolor=fig.get_facecolor())
for filename in ['distribution.svg','gameplay.svg']:
 svg=root/filename;svg.write_text('\n'.join(line.rstrip() for line in svg.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8')
print('Saved distribution and gameplay charts (PNG/SVG).')
