import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('work/castle-income-deps').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
root=Path('docs/research/castle-35-2026-10-18');data=json.loads((root/'results.json').read_text());rows=[r for r in data['datasets'] if r['stage']=='main']
names=['2/4, no final territory','2/4 + final territory','3/5 + final territory']
colors=['#46624d','#a4b591','#c29442','#e3c983','#946b50'];keys=['letters','bonus','sideIncome','centreIncome','finalTerritory'];labels=['Letter values','Length bonus','Side-castle income','Centre-castle income','Final territory']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':'#342a24','axes.labelcolor':'#342a24','xtick.color':'#655e56','ytick.color':'#342a24','svg.fonttype':'none'})
fig,ax=plt.subplots(figsize=(11,6),facecolor='#faf7ef');ax.set_facecolor('#faf7ef')
for i,r in enumerate(rows):
 left=0
 for j,k in enumerate(keys):
  val=100*r['shares'][k];ax.barh(i,val,left=left,height=.6,color=colors[j],edgecolor='#faf7ef',linewidth=1)
  if val>5.5:ax.text(left+val/2,i,f'{val:.1f}%',ha='center',va='center',fontsize=10,color='white' if j in [0,4] else '#342a24')
  left+=val
ax.set_yticks(range(3),names);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xticks([0,25,50,75,100],['0%','25%','50%','75%','100%']);ax.tick_params(length=0,pad=10);ax.set_xlabel('Share of both players’ combined final score',labelpad=13)
for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'Defended castles take a larger share',fontsize=21,weight='bold');fig.text(.035,.88,'512 games per setup · identical seeds, both starting orders · new 3/5 games; exact prior controls',fontsize=10)
fig.legend(handles=[Patch(color=c,label=l) for c,l in zip(colors,labels)],loc='lower center',bbox_to_anchor=(.5,.075),ncol=3,frameon=False,fontsize=10)
fig.text(.035,.025,'Main model, equal weight per game. No special end-game castle bonus. Bot simulations, not human playtests.',fontsize=9)
fig.subplots_adjust(left=.25,right=.96,top=.78,bottom=.32)
for ext in ['png','svg']:fig.savefig(root/f'distribution.{ext}',dpi=170,facecolor=fig.get_facecolor())
plt.close(fig)
stages=['main','sparse','exhaustive','planner','full_weight','late_weight'];labels=['Main','Fewer words noticed','Exhaustive word search','One-reply planning','Value land from start','Value land near end']
fig,ax=plt.subplots(figsize=(10,6.2),facecolor='#faf7ef');ax.set_facecolor('#faf7ef')
for i,stage in enumerate(stages):
 a=next(r for r in data['datasets'] if r['stage']==stage and r['id']=='final_territory');b=next(r for r in data['datasets'] if r['stage']==stage and r['id']=='final_territory_35');values=[100*(x['shares']['sideIncome']+x['shares']['centreIncome']) for x in [a,b]]
 ax.plot(values,[i,i],color='#ded8ca',linewidth=3)
 for j,(value,row) in enumerate(zip(values,[a,b])):
  low,high=[100*x for x in row['castleShareInterval']];ax.errorbar(value,i,xerr=[[value-low],[high-value]],fmt='o',color=['#46624d','#946b50'][j],capsize=3,markersize=7)
  ax.text(low-.6 if j==0 else high+.6,i,f'{value:.1f}%',ha='right' if j==0 else 'left',va='center',fontsize=10)
ax.set_yticks(range(6),labels);ax.invert_yaxis();ax.set_xlim(0,48);ax.set_xticks([0,10,20,30,40],['0%','10%','20%','30%','40%']);ax.tick_params(length=0,pad=10);ax.set_xlabel('Defended-castle share of total points',labelpad=12)
for s in ax.spines.values():s.set_visible(False)
fig.text(.035,.94,'The increase holds across playing models',fontsize=20,weight='bold');fig.text(.035,.88,'Green = 2/4 · brown = 3/5 · both include final territory · 95% seed-cluster intervals',fontsize=10)
fig.text(.035,.035,'Intervals cover board sampling within fixed bot policies, not uncertainty about human players.',fontsize=9)
fig.subplots_adjust(left=.28,right=.97,top=.78,bottom=.18)
for ext in ['png','svg']:fig.savefig(root/f'sensitivity.{ext}',dpi=170,facecolor=fig.get_facecolor())
for name in ['distribution.svg','sensitivity.svg']:
 p=root/name;p.write_text('\n'.join(line.rstrip() for line in p.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8')
print('Generated distribution and sensitivity figures.');
