import { createHash, randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { chooseGlobalBirdLanding } from './globalBirdLanding';
import { DOVE_ENCOUNTER_MS } from './t1BirdQuests';
import { BIRD_LANDING_RETRY_MS } from './expiredBirdTravel';
import { SHARED_DOVE_COLLECTION, SHARED_DOVE_DOCUMENT, isActiveBirdDeployment, shouldMoveExpiredBird, type SharedDoveDeployment } from './sharedBirdDeployment';

export function birdDeploymentDocument(uid:string,birdId:string) {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||!/^[A-Za-z0-9_-]{1,160}$/.test(birdId))throw Error('Invalid bird identity');
  // Preserve the existing pilot in place; other birds get distinct records.
  if(birdId===`alpha-dove-${uid}`)return SHARED_DOVE_DOCUMENT;
  return `bird-${createHash('sha256').update(JSON.stringify([uid,birdId])).digest('hex')}`;
}

// Internal transaction service only. Not exposed until callable, quest offers,
// map rendering and reward routing all understand the selected bird ID.
export async function changeOwnedBirdDeployment(db:Firestore,input:{uid:string;birdId:string;
  action:'deploy'|'recall'|'relocate';expectedVisitId?:string},
  fixedNow:Date|undefined=undefined, choose=chooseGlobalBirdLanding) {
  const documentId=birdDeploymentDocument(input.uid,input.birdId);
  if(fixedNow&&!Number.isFinite(fixedNow.getTime()))throw Error('Invalid server time');
  const visitRef=db.collection(SHARED_DOVE_COLLECTION).doc(documentId);
  const legacy=input.birdId===`alpha-dove-${input.uid}`;
  const birdRef=legacy?db.collection('birdQuestPlayers').doc(input.uid)
    :db.collection('playerBirdhouses').doc(input.uid).collection('birds').doc(input.birdId);
  const visitId=randomUUID();
  return db.runTransaction(async tx=>{
    // Refresh on transaction retries so a concurrently created visit is not
    // mistaken for a future/invalid visit by this request's old start time.
    const now=fixedNow??new Date();
    const ownerSnap=await tx.get(birdRef),visitSnap=await tx.get(visitRef);
    const owner=ownerSnap.data(),bird=legacy?owner?.bird:owner;
    if(owner?.schemaVersion!==1||owner.uid!==input.uid||bird?.id!==input.birdId||bird.level!==1
      ||(!legacy&&bird.species!=='dove'))throw Error('This bird does not belong to you');
    const current=visitSnap.data() as SharedDoveDeployment|undefined;
    if(current&&(current.ownerUid!==input.uid||current.birdId!==input.birdId))throw Error('Conflicting bird visit; nothing changed');
    if(input.action==='recall'){
      if(!current||current.id!==input.expectedVisitId)throw Error('Bird has moved; refresh first');
      if(current.status==='deployed')tx.update(visitRef,{status:'recalled'});
      return {...current,status:current.status==='deployed'?'recalled' as const:current.status};
    }
    if(input.action==='relocate'){
      if(!current||current.id!==input.expectedVisitId||!shouldMoveExpiredBird(current,now.getTime()))return current??null;
    }else if(input.action==='deploy'){
      if(isActiveBirdDeployment(current,now.getTime()))return current;
    }else throw Error('Unknown bird action');
    const landing=await choose({db,tx,ownerUid:input.uid,now,excludePinId:current?.landing.id});
    if(!landing){
      if(input.action==='relocate'&&current){
        const nextLandingAttemptAt=now.getTime()+BIRD_LANDING_RETRY_MS;
        tx.update(visitRef,{nextLandingAttemptAt});return {...current,nextLandingAttemptAt};
      }
      throw Error('No eligible planted plot found; your bird remains in the Birdhouse');
    }
    const profile=(await tx.get(db.collection('players').doc(input.uid))).data();
    const next:SharedDoveDeployment={schemaVersion:1,id:visitId,birdId:input.birdId,
      ownerUid:input.uid,ownerName:typeof profile?.displayName==='string'?profile.displayName:'Dove owner',
      landing,createdAt:now.getTime(),expiresAt:now.getTime()+DOVE_ENCOUNTER_MS,status:'deployed'};
    tx.set(visitRef,next);return next;
  });
}
