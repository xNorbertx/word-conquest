import {node,button,icon} from './ui.js';

export function renderAnalytics(root,data,{openGame}){
  const record=node('div',undefined,'analytics-record');
  for(const [key,label]of [['wins','Wins'],['losses','Losses'],['draws','Draws']]){
    const item=node('div');item.append(node('strong',data[key]),node('span',label));record.append(item);
  }
  const records=node('div',undefined,'analytics-records');
  const date=value=>{const d=new Date(value);return value&&!Number.isNaN(+d)?d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';};
  const entries=[['Best game',data.bestGame,'points','award',data.bestGame?date(data.bestGame.at):''],
    ['Best word',data.bestWord,'points','book',data.bestWord?.word],
    ['Longest word',data.longestWord,'letters','book',data.longestWord?.word],
    ['Biggest capture',data.biggestCapture,'tiles','territory',data.biggestCapture?.word],
    ['Castles captured',{value:data.castlesCaptured},'captures','castle','']];
  for(const [label,value,unit,symbol,detail]of entries){
    const item=value?.gameId?button('',()=>openGame(value.gameId),'analytics-item'):node('div',undefined,'analytics-item');
    item.replaceChildren();const copy=node('div',undefined,'analytics-copy'),amount=node('div',undefined,'analytics-amount');
    copy.append(node('span',label,'analytics-label'));if(detail)copy.append(node('strong',detail,'analytics-detail'));
    amount.append(node('strong',value?.value??'—'));if(label!=='Castles captured')amount.append(node('small',unit));
    item.append(icon(symbol),copy,amount);if(value?.gameId)item.setAttribute('aria-label',`${label}: ${value.value} ${unit}. ${detail||''}. Open game`);
    records.append(item);
  }
  root.replaceChildren(record,records,node('p','Current rules only','small-note analytics-scope'));
  if(!data.games&&!data.words)root.append(node('p','No games recorded yet.','small-note'));
}
