// The server derives opponent/language from the completed game. Keep a stable
// creation ID through lost replies; the server also deduplicates across devices.
export function createRematchSender({api,storage,namespace='',uuid=()=>crypto.randomUUID()}){
  const pending=new Map(),ids=new Map();
  return (actor,sourceGameId)=>{
    const key=`wc-rematch:${namespace}:${actor}:${sourceGameId}`;
    if(pending.has(key))return pending.get(key);
    let id=ids.get(key);try{id??=storage?.getItem(key);}catch{}
    if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id||''))id=uuid();
    ids.set(key,id);try{storage?.setItem(key,id);}catch{}
    const request=Promise.resolve().then(()=>api({action:'rematch',sourceGameId,gameId:id},actor)).then(result=>{
      ids.delete(key);try{storage?.removeItem(key);}catch{}return result;
    }).finally(()=>pending.delete(key));
    pending.set(key,request);return request;
  };
}
