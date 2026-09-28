import type {Firestore} from 'firebase-admin/firestore';
import {startLeonardIntroduction} from './leonardStart';
import {commitLeonardProgress} from './leonardProgressTransaction';
import {acquireLeonardAutomaticLocations} from './leonardAutomaticLocations';
import {createLeonardLookupTransport,reserveLeonardStart} from './leonardLookupTransport';
import {prepareLeonardArea} from './leonardPreparation';
import {verifyLeonardActionLocation} from './leonardActionLocation';
import {requireString} from '../../validation/requestValidation';
import type {LeonardAction} from './leonardProgress';

// Called only after authenticated owner + server-owned replayEnabled checks.
export async function leonardReplay(db:Firestore,uid:string,email:string,p:Record<string,unknown>,location:()=>{latitude:number;longitude:number;accuracyMetres:number}){
 const ref=db.collection('leonardIntroductionReplays').doc(uid),access=db.collection('leonardPilotAccess').doc(uid);
 const action=requireString(p.action,'action',1,20);
 if(action==='prepare')return prepareLeonardArea(db,uid,location());
 if(action==='start'&&!(await ref.get()).exists){
  const origin=location();await reserveLeonardStart(db,uid);
  const evidence=await acquireLeonardAutomaticLocations(db,uid,origin,createLeonardLookupTransport(db));
  await startLeonardIntroduction(db,{uid,email,emailVerified:true},origin,async tx=>{
   if((await tx.get(access)).data()?.replayEnabled!==true)throw Error('Replay is disabled');return evidence;
  },true,Date.now,undefined,true);
 }else if(action==='progress'){
  const kind=requireString(p.kind,'kind',1,24),stage=requireString(p.stage,'stage',1,24),runId=requireString(p.runId,'runId',1,128);
  if(!['talk','collect-egg','collect-stick','buy-cotton','craft-nest'].includes(kind))throw Error('Replay stops before incubation. Your original egg is safe.');
  const next={kind,stage,...(kind.startsWith('collect-')?{pinId:requireString(p.pinId,'pinId',1,200)}:{})} as LeonardAction;
  await commitLeonardProgress(db,{uid,runId,action:next},async(tx,state)=>{
   const [q,a]=await Promise.all([tx.get(ref),tx.get(access)]);if(a.data()?.replayEnabled!==true)throw Error('Replay is disabled');
   verifyLeonardActionLocation(state,next,q.data()!.actionLocations,kind==='craft-nest'?undefined:location(),100);
  },Date.now,true);
 }else if(action==='end-replay'){
  await access.update({replayEnabled:false});return {ok:true,replayEnded:true};
 }else if(!['status','start'].includes(action))throw Error('Replay cannot reset your original quest or hatch another bird.');
 return {ok:true,replay:true,preparationEnabled:true,run:(await ref.get()).data()??null};
}
