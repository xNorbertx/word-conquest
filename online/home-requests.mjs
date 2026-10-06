// Share overlapping navigation/realtime/resume reads, scoped to this signed-in session.
export function createHomeRequests(load){
 let pending=null;
 return {
  get(actor){
   if(pending?.actor===actor)return pending.promise;
   const job={actor};pending=job;
   job.promise=Promise.resolve().then(()=>load(actor)).finally(()=>{if(pending===job)pending=null;});
   return job.promise;
  },
  reset(){pending=null;}
 };
}
