import sys,json,math
from pathlib import Path
sys.path.insert(0,str(Path('work/castle-income-deps').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
root=Path('docs/research/scoring-2026-10-18')
data=json.loads((root/'results.json').read_text())
rows=[r for r in data['datasets'] if r['stage']=='main']
names=['Current rules','Your proposal','First-claim territory','Words + castles']
colors=['#46624d','#a4b591','#9b7558','#583c2b','#c29442','#e3c983']
keys=['letters','bonus','ordinary','castleValue','sideIncome','centreIncome']
labels=['Letter values','Length bonus','Ordinary territory','Castle value','Side-castle income','Centre-castle income']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':'#342a24','axes.labelcolor':'#342a24','xtick.color':'#655e56','ytick.color':'#342a24','svg.fonttype':'none'})
fig,ax=plt.subplots(figsize=(11,6.2),facecolor='#faf7ef');ax.set_facecolor('#faf7ef')
for i,r in enumerate(rows):
 left=0
 for j,k in enumerate(keys):
  val=100*r['shares'][k]
  ax.barh(i,val,left=left,height=.58,color=colors[j],edgecolor='#faf7ef',linewidth=1)
  if val>6:ax.text(left+val/2,i,f'{val:.1f}%',ha='center',va='center',fontsize=10,color='white' if j in [0,2,3] else '#342a24')
  left+=val
ax.set_yticks(range(4),names);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xticks([0,25,50,75,100],['0%','25%','50%','75%','100%']);ax.tick_params(length=0,pad=10)
ax.set_xlabel('Share of both players’ combined final score',labelpad=13)
for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'What earns the points?',fontsize=21,weight='bold')
fig.text(.035,.88,'512 games per ruleset · 256 identical board seeds, each with both starting orders',fontsize=10)
fig.legend(handles=[Patch(color=c,label=l) for c,l in zip(colors,labels)],loc='lower center',bbox_to_anchor=(.5,.075),ncol=3,frameon=False,fontsize=10)
fig.text(.035,.025,'Main model: 12 sampled familiar words per move. Equal weight per game. Automated play, not measured human enjoyment.',fontsize=9)
fig.subplots_adjust(left=.23,right=.96,top=.79,bottom=.32)
for ext in ['png','svg']:fig.savefig(root/f'distribution.{ext}',dpi=170,facecolor=fig.get_facecolor())
plt.close(fig)
fig,ax=plt.subplots(figsize=(9,5.2),facecolor='#faf7ef');ax.set_facecolor('#faf7ef')
for i,r in enumerate(rows):
 val=100*r['firstWin'];lo,hi=[100*x for x in r['firstWinInterval']]
 ax.errorbar(val,i,xerr=[[val-lo],[hi-val]],fmt='o',color='#46624d',markersize=9,elinewidth=2,capsize=5)
 display=math.floor(val*10+.5)/10
 ax.text(73,i,f'{display:.1f}%  ({lo:.1f}–{hi:.1f})',va='center',fontsize=10)
ax.set_yticks(range(4),names);ax.invert_yaxis();ax.axvline(50,color='#9b7558',linestyle='--',linewidth=1);ax.set_xlim(25,96);ax.set_xticks([30,40,50,60,70],['30%','40%','50%','60%','70%']);ax.tick_params(length=0,pad=10)
ax.set_xlabel('Starting player win share (draws count half)',labelpad=12)
for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'The scoring changes shift starting-order advantage',fontsize=17,weight='bold')
fig.text(.035,.88,'95% seed-cluster bootstrap intervals · main model only',fontsize=10)
fig.text(.035,.035,'These intervals cover sampled boards, not uncertainty about human play or the choice of bot.',fontsize=9)
fig.subplots_adjust(left=.26,right=.98,top=.78,bottom=.19)
for ext in ['png','svg']:fig.savefig(root/f'fairness.{ext}',dpi=170,facecolor=fig.get_facecolor())
for filename in ['distribution.svg','fairness.svg']:
 svg=root/filename
 svg.write_text('\n'.join(line.rstrip() for line in svg.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8')
print('Saved distribution and starting-order charts (PNG/SVG).')
