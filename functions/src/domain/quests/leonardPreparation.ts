import type {Firestore} from 'firebase-admin/firestore';
import {randomUUID} from 'node:crypto';
import {acquireLeonardAutomaticLocations,leonardArea} from './leonardAutomaticLocations';
import {createLeonardLookupTransport} from './leonardLookupTransport';

// Awaited by its own callable request, never fire-and-forget work after response.
// Only source caches and throttle records are written. No quest/reward is created.
export async function prepareLeonardArea(db:Firestore,uid:string,origin:{latitude:number;longitude:number},
 work=()=>acquireLeonardAutomaticLocations(
  db,uid,leonardArea(origin).center,
  createLeonardLookupTransport(db,fetch,Date.now,{cacheFailures:false}),true
 ),clock=Date.now){
 const area=leonardArea(origin),ref=db.collection('leonardPreparedAreas').doc(area.id);
 const user=db.collection('leonardPreparationLimits').doc(uid),lease=randomUUID();
 const state=await db.runTransaction(async tx=>{
  const [a,u]=await Promise.all([tx.get(ref),tx.get(user)]),now=clock(),data=a.data();
  if(data?.expiresAt>now)return 'cached';
  if(data?.retryAt>now||u.data()?.retryAt>now)return 'waiting';
  tx.set(ref,{retryAt:now+60000,lease},{merge:true});tx.set(user,{retryAt:now+300000});return 'work';
 });
 if(state!=='work')return {ok:true,status:state,retryAfterMs:300000};
 let success=false;
 try{await work();success=true;}catch{/* Quiet failure; bounded later retry. */}
 await db.runTransaction(async tx=>{const d=(await tx.get(ref)).data();if(d?.lease!==lease)return;
  tx.set(ref,{lease:null,retryAt:success?0:clock()+300000,expiresAt:success?clock()+23*3600000:0},{merge:true});});
 return {ok:true,status:success?'prepared':'waiting',retryAfterMs:300000};
}
