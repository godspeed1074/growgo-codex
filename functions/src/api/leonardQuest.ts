import {createHash} from 'node:crypto';
import {HttpsError,onCall,type CallableRequest} from 'firebase-functions/v2/https';
import {runtimeConfig} from '../config/runtimeConfig';
import {getAdminFirestore} from '../firebaseAdmin';
import {requireAuthenticated,requireAppCheckIfEnabled} from '../security/requireAuthenticated';
import {requireInvitedUserAccess} from '../security/requireInvitedUserAccess';
import {requireActiveDeviceSessionIfEnabled} from '../domain/players/activeDeviceSession';
import {asObject,assertAllowedKeys,requireString,requireFiniteNumber} from '../validation/requestValidation';
import {readStoredPlayerDocument,serializePlayerSnapshot} from '../domain/players/playerStore';
import {getActivePlayerCaptureRadiusMultiplier} from '../domain/players/playerBuffs';
import {startLeonardPilot,startLeonardIntroduction} from '../domain/quests/leonardStart';
import {acquireLeonardAutomaticLocations} from '../domain/quests/leonardAutomaticLocations';
import {createLeonardLookupTransport,reserveLeonardStart} from '../domain/quests/leonardLookupTransport';
import {prepareLeonardArea} from '../domain/quests/leonardPreparation';
import {automaticLeonardEnabled} from '../domain/quests/leonardAccess';
import {leonardReplay} from '../domain/quests/leonardReplay';
import {commitLeonardProgress} from '../domain/quests/leonardProgressTransaction';
import {hatchLeonardDove} from '../domain/quests/leonardHatch';
import {verifyLeonardActionLocation} from '../domain/quests/leonardActionLocation';
import type {LeonardAction} from '../domain/quests/leonardProgress';
import type {LeonardLandmark,LeonardPlace} from '../domain/quests/leonardLocations';
import {calculateHaversineDistanceMetres} from '../domain/pins/canonicalPinGenerator';

const OWNER='LkR8ugTK6lXGFfUlLvKSiqMoMBh1';
export async function leonardQuestHandler(request:CallableRequest<unknown>){
 const {uid}=requireAuthenticated(request);requireAppCheckIfEnabled(request);requireInvitedUserAccess(request);
 const globalEnabled=automaticLeonardEnabled(uid);
 if(request.auth?.token.email_verified!==true)
  throw new HttpsError('permission-denied','Verify your email before starting this quest.');
 if(!globalEnabled&&(uid!==OWNER||String(request.auth.token.email).toLowerCase()!=='godspeed1074@gmail.com'))
  throw new HttpsError('permission-denied','This quest test is reserved for Rubberlips.');
 const p=asObject(request.data,'Leonard quest');assertAllowedKeys(p,['action','runId','stage','kind','pinId','deviceId','latitude','longitude','accuracyMetres'],'Leonard quest');
 await requireActiveDeviceSessionIfEnabled({uid,deviceId:typeof p.deviceId==='string'?p.deviceId:undefined});
 const db=getAdminFirestore(),ref=db.collection('leonardIntroductionPlayers').doc(uid);
 // Server-only, owner-specific switch. No client can enable or provide targets.
 const configRef=db.collection('leonardPilotAccess').doc(uid);
 const config=(await configRef.get()).data();
 if(!globalEnabled&&config?.enabled!==true)throw new HttpsError('failed-precondition','Leonard’s quest is not ready yet.');
 const action=requireString(p.action,'action',1,20);
 const location=()=>({latitude:requireFiniteNumber(p.latitude,'latitude',-90,90),longitude:requireFiniteNumber(p.longitude,'longitude',-180,180),accuracyMetres:requireFiniteNumber(p.accuracyMetres,'accuracyMetres',0,100)});
 const status=async()=>{
  const [quest,player]=await Promise.all([ref.get(),db.collection('players').doc(uid).get()]);
  return {ok:true,preparationEnabled:globalEnabled,run:quest.data()??null,player:serializePlayerSnapshot(readStoredPlayerDocument(player.data()))};
 };
 if(config?.replayEnabled===true&&uid===OWNER&&String(request.auth.token.email).toLowerCase()==='godspeed1074@gmail.com'){
  try{return await leonardReplay(db,uid,String(request.auth.token.email),p,location);}
  catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('failed-precondition',e instanceof Error?e.message:'Replay could not be confirmed');}
 }
 if(action==='status')return status();
 try{
  if(action==='prepare'){
   if(!globalEnabled)return {ok:true,status:'disabled'};
   if((await db.collection('players').doc(uid).get()).data()?.profileComplete!==true)return {ok:true,status:'disabled'};
   return await prepareLeonardArea(db,uid,location());
  }
  if(action==='start'){
   const origin=location();
   if(globalEnabled){
    // Resume before remote lookup, including completed legacy Cowes quests.
    if((await ref.get()).exists)return status();
    const player=(await db.collection('players').doc(uid).get()).data();
    if(player?.profileComplete!==true)throw Error('Complete your player profile first');
    await reserveLeonardStart(db,uid);
    const evidence=await acquireLeonardAutomaticLocations(db,uid,origin,createLeonardLookupTransport(db));
    await startLeonardIntroduction(db,{uid,email:String(request.auth.token.email),emailVerified:true},origin,async()=>evidence,true);
   }else{
   await startLeonardPilot(db,{uid,email:String(request.auth.token.email),emailVerified:true},origin,async tx=>{
    const access=(await tx.get(configRef)).data();if(access?.enabled!==true)throw Error('Quest test is paused');
    if(access.locationSet!=='cowes-v1')throw Error('Cowes locations are not ready');
    const manifest=(await tx.get(db.collection('leonardPilotLocations').doc('cowes-v1'))).data();
    if(manifest?.verified!==true||manifest.schemaVersion!==1)throw Error('Cowes locations still need verification');
    if(!manifest.center||calculateHaversineDistanceMetres(origin,manifest.center)>7000)throw Error('Start this test in Cowes');
    const evidence=structuredClone(manifest.evidence) as {churches:LeonardLandmark[];parks:LeonardLandmark[];shops:LeonardPlace[]};
    const pins=[...new Map([...evidence.churches,...evidence.parks].flatMap(p=>p.basePins).map(p=>[p.id,p])).values()];
    if(pins.length>300||evidence.churches.length>20||evidence.parks.length>40||evidence.shops.length>40)throw Error('Quest location set exceeds safe limits');
    const captured=new Set<string>();
    // Bounded read-only historical check, never trusts a manifest capture flag.
    if(pins.length){const receipts=await tx.getAll(...pins.map(pin=>db.collection('playerCaptureStates').doc(uid).collection('pins').doc(createHash('sha256').update(pin.id).digest('hex'))));
     receipts.forEach((s,index)=>{if(s.data()?.pinId===pins[index].id&&s.data()?.capturedAt)captured.add(pins[index].id);});}
    for(const place of [...evidence.churches,...evidence.parks])for(const pin of place.basePins)pin.previouslyCapturedByPlayer=captured.has(pin.id);
    return evidence;
   },true);
   }
  }else if(action==='progress'){
   const runId=requireString(p.runId,'runId',1,128),kind=requireString(p.kind,'kind',1,24),stage=requireString(p.stage,'stage',1,24);
   if(!['talk','collect-egg','collect-stick','buy-cotton','craft-nest','use-nest'].includes(kind))throw Error('Unknown quest action');
   const next={stage,kind,...(kind.startsWith('collect-')?{pinId:requireString(p.pinId,'pinId',1,200)}:{})} as LeonardAction;
   await commitLeonardProgress(db,{uid,runId,action:next},async(tx,state)=>{
    const [q,player,access]=await Promise.all([tx.get(ref),tx.get(db.collection('players').doc(uid)),tx.get(configRef)]);
    if(!globalEnabled&&access.data()?.enabled!==true)throw Error('Quest test is paused');
    verifyLeonardActionLocation(state,next,q.data()!.actionLocations,
     ['craft-nest','use-nest'].includes(kind)?undefined:location(),
     100*getActivePlayerCaptureRadiusMultiplier(readStoredPlayerDocument(player.data()),new Date()));
   });
  }else if(action==='restart'){
   const runId=requireString(p.runId,'runId',1,128);
   await db.runTransaction(async tx=>{
    const [q,bird,access]=await Promise.all([tx.get(ref),tx.get(db.collection('playerBirdhouses').doc(uid).collection('birds').doc('leonard-introduction-dove')),tx.get(configRef)]);
    if(!globalEnabled&&access.data()?.enabled!==true)throw Error('Quest test is paused');
    if(!q.exists)return;
    if(q.data()?.runId!==runId)throw Error('Quest run changed; reopen the quest');
    if(q.data()?.stage==='completed'||bird.exists)throw Error('This dove has already been earned');
    // Explicit restart clears only this quest, never ordinary inventory or birds.
    // Any previously paid cotton purchase remains paid; UI warns before reset.
    tx.delete(ref);
   });
  }else if(action==='hatch'){
   await hatchLeonardDove(db,{uid,runId:requireString(p.runId,'runId',1,128)},async tx=>{
    if(!globalEnabled&&(await tx.get(configRef)).data()?.enabled!==true)throw Error('Quest test is paused');
   });
  }else throw Error('Unknown quest action');
 }catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('failed-precondition',e instanceof Error?e.message:'Quest action could not be confirmed');}
 return status();
}
export const leonardQuest=onCall({region:runtimeConfig.region,maxInstances:1,minInstances:0,timeoutSeconds:60},leonardQuestHandler);
