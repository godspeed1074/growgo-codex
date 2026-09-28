// Quiet foreground prewarming. Login, map rendering and quest UI never await it.
export function installLeonardPreparation({current,position,prepare,visible=()=>document.visibilityState!=='hidden',clock=Date.now,schedule=setInterval,cancel=clearInterval}){
 let stopped=false,inFlight=false;const areas=new Map();let nextRequest=0;
 async function tick(){
  if(stopped||inFlight||!current()||!visible()||clock()<nextRequest)return;
  let p;try{p=position();}catch{return;}
  if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180||!Number.isFinite(p.accuracyMetres)||p.accuracyMetres<0||p.accuracyMetres>100)return;
  const key=`${(Math.round(p.latitude*100)/100).toFixed(2)}_${(Math.round(p.longitude*100)/100).toFixed(2)}`;
  const previous=areas.get(key);if(previous?.done||previous?.attempts>=3)return;
  areas.set(key,{attempts:(previous?.attempts??0)+1});if(areas.size>64)areas.delete(areas.keys().next().value);
  inFlight=true;nextRequest=clock()+300000;
  try{const r=await prepare({action:'prepare',latitude:p.latitude,longitude:p.longitude,accuracyMetres:p.accuracyMetres});
   if(!stopped&&current()&&['prepared','cached','disabled'].includes(r?.status))areas.set(key,{done:true});
  }catch{/* No popup, account mutation, or automatic tight retry. */}finally{inFlight=false;}
 }
 const timer=schedule(()=>void tick(),20000);void tick();
 return {tick,stop(){stopped=true;cancel(timer);areas.clear();}};
}
