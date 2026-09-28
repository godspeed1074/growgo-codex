import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {parseSafeFirestoreEmulatorHost}=require('../lib/infrastructure/pins/firestoreEmulatorHost.js');

test('automatic expired bird travel: different global plots, atomicity, throttling and state isolation',async t=>{
  const host=parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if(!host){t.skip('Local demo emulator required; never touches live accounts.');return;}
  Object.assign(process.env,{FIRESTORE_EMULATOR_HOST:host.normalizedHostPort,GCLOUD_PROJECT:'demo-growgo-bird-expiry',
    GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED:'false',GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'false',
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled'});
  const {initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore,Timestamp}=require('firebase-admin/firestore');
  const app=initializeApp({projectId:'demo-growgo-bird-expiry'},`expiry-${process.pid}`),db=getFirestore(app);
  t.after(async()=>{await db.terminate();await deleteApp(app);});
  const {moveExpiredBirdVisit,BIRD_LANDING_RETRY_MS}=require('../lib/domain/quests/expiredBirdTravel.js');
  const {birdQuestsHandler:handle}=require('../lib/api/birdQuests.js');
  const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');
  const {serializeSharedBasePinStateForStorage:store,sharedWorldDocumentId:hash}=require('../lib/domain/world/sharedWorld.js');
  const owner=`owner-${process.pid}`,visitor=`visitor-${process.pid}`,now=new Date(),day=86400000,six=21600000;
  const bird={id:`alpha-dove-${owner}`,name:'Test Dove',level:1,xp:100,questsCompleted:1};
  const ownerRef=db.collection('birdQuestPlayers').doc(owner),visitRef=db.collection('birdQuestDeployments').doc('alpha-dove-pilot');
  const call=(uid,data)=>handle({auth:{uid,token:{email:uid===owner?'godspeed1074@gmail.com':'visitor@example.test',email_verified:true}},data});
  for(const uid of [owner,visitor]){
    await db.collection('players').doc(uid).set({...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,
      displayName:uid===owner?'Rubberlips':'Visitor',gender:'male',country:'Australia',region:'oceania',state:'Victoria',coins:500,xp:100});
    await db.collection('playerMarketInventories').doc(uid).set({schemaVersion:1,items:{wheat:12,corn:5}});
  }
  await ownerRef.set({schemaVersion:1,uid:owner,bird,activeRunId:null,offer:null,cardCounts:{},updatedAt:Timestamp.now()});
  const a={pinId:'ggpin:v1:osm-way:98989888:1',latitude:-38.45,longitude:145.24,ownerUid:visitor,ownerName:'Visitor',
    ownerAvatarUrl:null,ownedAt:new Date(+now-day),updatedAt:now,level:1,replantEnabled:false,
    plant:{seedId:'corn_seed',plantedAt:new Date(+now-day),miracleGrownAt:null}};
  const b={...a,pinId:'ggpin:v1:osm-way:98989888:2',latitude:51.5,longitude:-0.1,ownerUid:owner,ownerName:'Rubberlips',
    plant:{seedId:'wheat_seed',plantedAt:new Date(+now-22*day),miracleGrownAt:null}};
  const plotRefs=[a,b].map(p=>db.collection('sharedBasePinStates').doc(hash(p.pinId)));
  for(const [i,p] of [a,b].entries()){
    await plotRefs[i].set(store(p));
    await db.collection('authoritativeWaterPinStates').doc(p.pinId).set({pinId:p.pinId,type:'base',latitude:p.latitude,longitude:p.longitude});
  }
  // Target B was harvested today by its owner. Bird movement must not reset it.
  const harvestRef=db.collection('sharedBasePinHarvests').doc(hash(b.pinId)).collection('players').doc(owner);
  const captureRef=db.collection('playerCaptureStates').doc(owner).collection('pins').doc(hash(b.pinId));
  await harvestRef.set({harvestDay:now.toISOString().slice(0,10),harvestedAt:Timestamp.now()});
  await captureRef.set({captureDay:now.toISOString().slice(0,10),capturedAt:Timestamp.now()});
  const protectedRefs=[...plotRefs,harvestRef,captureRef,ownerRef,...[owner,visitor].flatMap(uid=>[
    db.collection('players').doc(uid),db.collection('playerMarketInventories').doc(uid),db.collection('playerLeaderboardScores').doc(uid)])];
  const protectedBefore=await Promise.all(protectedRefs.map(async r=>(await r.get()).data()));
  const initial={schemaVersion:1,id:'expiry-first',birdId:bird.id,ownerUid:owner,ownerName:'Rubberlips',
    landing:{id:a.pinId,lat:a.latitude,lng:a.longitude},createdAt:+now-six,expiresAt:+now,status:'deployed'};
  await visitRef.set(initial);
  let moved;
  await t.test('multiple refreshes move once, to another continent and an already harvested own plot',async()=>{
    const results=await Promise.all(Array.from({length:4},()=>moveExpiredBirdVisit(db,initial.id,now)));
    assert.equal(new Set(results.map(d=>d.id)).size,1);moved=results[0];
    assert.notEqual(moved.id,initial.id);assert.equal(moved.landing.id,b.pinId);
    assert.equal(moved.createdAt,+now);assert.equal(moved.expiresAt,+now+six);assert.equal(moved.birdId,bird.id);
    assert.equal((await call(owner,{action:'snapshot'})).deployment.id,moved.id);
    assert.equal((await call(visitor,{action:'nearby',latitude:b.latitude,longitude:b.longitude,accuracyMetres:5})).birds[0].id,moved.id);
    const version=(await visitRef.get()).updateTime;
    await moveExpiredBirdVisit(db,moved.id,new Date(+now+six-1));
    assert.ok((await visitRef.get()).updateTime.isEqual(version),'No early reset');
  });
  await t.test('each later expiry starts exactly one fresh six-hour visit on a different plot',async()=>{
    const next=await moveExpiredBirdVisit(db,moved.id,new Date(moved.expiresAt));
    assert.equal(next.landing.id,a.pinId);assert.notEqual(next.id,moved.id);
    assert.equal(next.createdAt,moved.expiresAt);assert.equal(next.expiresAt-next.createdAt,six);
  });
  await t.test('recall and quest departure prevent future automatic movement; missing owner birds are not resurrected',async()=>{
    for(const status of ['recalled','departed']){
      await visitRef.set({...initial,status});const before=(await visitRef.get()).data();
      await moveExpiredBirdVisit(db,initial.id,new Date(+now+six));assert.deepEqual((await visitRef.get()).data(),before);
    }
    await visitRef.set(initial);await ownerRef.update({bird:null});
    assert.equal(await moveExpiredBirdVisit(db,initial.id,now),null);
    assert.deepEqual((await visitRef.get()).data(),initial);await ownerRef.update({bird});
  });
  await t.test('no alternative waits with a five-minute backoff, then retries without repeating the old host',async()=>{
    await plotRefs[1].set(store({...b,plant:null}));await visitRef.set(initial);
    const waiting=await moveExpiredBirdVisit(db,initial.id,now);
    assert.equal(waiting.id,initial.id);assert.equal(waiting.expiresAt,initial.expiresAt);
    assert.equal(waiting.nextLandingAttemptAt,+now+BIRD_LANDING_RETRY_MS);
    assert.deepEqual((await call(owner,{action:'snapshot'})).waitingDeployment,{id:initial.id});
    const remote=await call(owner,{action:'nearby',latitude:b.latitude,longitude:b.longitude,accuracyMetres:5});
    assert.deepEqual(remote.ownWaitingDeployment,{id:initial.id});assert.equal(remote.ownDeployment,null);
    assert.equal('ownWaitingDeployment' in await call(visitor,{action:'nearby',latitude:b.latitude,longitude:b.longitude,accuracyMetres:5}),false);
    const version=(await visitRef.get()).updateTime;
    for(let i=1;i<4;i++)await moveExpiredBirdVisit(db,initial.id,new Date(+now+i*30000));
    assert.ok((await visitRef.get()).updateTime.isEqual(version),'Waiting does not rewrite or extend its retry');
    await plotRefs[1].set(store(b));const next=await moveExpiredBirdVisit(db,initial.id,new Date(waiting.nextLandingAttemptAt));
    assert.equal(next.landing.id,b.pinId);assert.equal(next.expiresAt-next.createdAt,six);
    assert.equal('nextLandingAttemptAt' in next,false);
  });
  await t.test('authenticated map refresh automatically advances old visits; stale offers cannot accept the replacement',async()=>{
    const start={...initial,createdAt:Date.now()-six-1000,expiresAt:Date.now()-1000};await visitRef.set(start);
    await assert.rejects(handle({data:{action:'nearby',latitude:b.latitude,longitude:b.longitude,accuracyMetres:5}}),{code:'unauthenticated'});
    assert.deepEqual((await visitRef.get()).data(),start);
    const refreshed=await call(visitor,{action:'nearby',latitude:b.latitude,longitude:b.longitude,accuracyMetres:5});
    assert.equal(refreshed.birds[0].landing.id,b.pinId);assert.notEqual(refreshed.birds[0].id,initial.id);
    await ownerRef.update({offer:{id:'old-offer',origin:{latitude:b.latitude,longitude:b.longitude,accuracyMetres:5},
      landing:{id:b.pinId,lat:b.latitude,lng:b.longitude},expiresAt:Date.now()+3600000,questIds:['dove-1-flour-power'],candidates:[],
      deploymentId:initial.id,birdId:bird.id,birdOwnerUid:owner}});
    await assert.rejects(call(owner,{action:'accept',offerId:'old-offer',questId:'dove-1-flour-power',
      latitude:b.latitude,longitude:b.longitude,accuracyMetres:5}),{code:'failed-precondition'});
    await ownerRef.update({offer:null});
  });
  await t.test('the owner can recall a waiting visit and stop subsequent automatic retries',async()=>{
    await visitRef.set({...initial,nextLandingAttemptAt:Date.now()+BIRD_LANDING_RETRY_MS});
    await assert.rejects(call(visitor,{action:'recall',deploymentId:initial.id}),{code:'permission-denied'});
    const recalled=await call(owner,{action:'recall',deploymentId:initial.id});
    assert.equal(recalled.deployment,null);assert.equal(recalled.waitingDeployment,null);
    const version=(await visitRef.get()).updateTime;
    await moveExpiredBirdVisit(db,initial.id,new Date(Date.now()+six));
    assert.equal((await visitRef.get()).data().status,'recalled');
    assert.ok((await visitRef.get()).updateTime.isEqual(version));
  });
  assert.deepEqual(await Promise.all(protectedRefs.map(async r=>(await r.get()).data())),protectedBefore);
  assert.equal((await ownerRef.collection('mail').get()).size,0);
});
