import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {parseSafeFirestoreEmulatorHost}=require('../lib/infrastructure/pins/firestoreEmulatorHost.js');

test('owners deploy and complete their own shared bird quests, once, without double rewards or changing host captures',async t=>{
  const host=parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if(!host){t.skip('Local emulator required; no live accounts accessed.');return;}
  Object.assign(process.env,{FIRESTORE_EMULATOR_HOST:host.normalizedHostPort,GCLOUD_PROJECT:'demo-growgo-bird-owner',
    GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED:'false',GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'false',
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled'});
  const {initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore,Timestamp}=require('firebase-admin/firestore');
  const app=initializeApp({projectId:'demo-growgo-bird-owner'},`owner-${process.pid}`),db=getFirestore(app);
  t.after(async()=>{await db.terminate();await deleteApp(app);});
  const {birdQuestsHandler:handle}=require('../lib/api/birdQuests.js');
  const {craftRecipeHandler}=require('../lib/api/marketplace.js');
  const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');
  const {sharedWorldDocumentId,serializeSharedBasePinStateForStorage}=require('../lib/domain/world/sharedWorld.js');
  const {generateCanonicalPinsForWay}=require('../lib/domain/pins/canonicalPinGenerator.js');
  const {createFirestoreAuthoritativeSourceCache,AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME}=require('../lib/infrastructure/pins/firestoreAuthoritativePinCache.js');
  const owner=`owner-${process.pid}`,visitor=`visitor-${process.pid}`,now=new Date();
  const location={latitude:-38.45,longitude:145.24,accuracyMetres:5};
  const auth=uid=>({uid,token:{email:uid===owner?'godspeed1074@gmail.com':'visitor@example.test',email_verified:true}});
  const call=(uid,data)=>handle({auth:auth(uid),data});
  for(const uid of [owner,visitor]){
    await db.collection('players').doc(uid).set({...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,
      displayName:uid===owner?'Rubberlips':'Visitor',gender:'male',country:'Australia',region:'oceania',state:'Victoria',coins:100,xp:100});
    await db.collection('playerMarketInventories').doc(uid).set({schemaVersion:1,items:{wheat:10}});
  }
  await call(owner,{action:'claim-test-dove'});
  const source={generatorVersion:1,sourceType:'osm-way',sourceId:'98989996',spacingMetres:50,
    orderedCoordinates:[{latitude:location.latitude,longitude:location.longitude},{latitude:-38.442,longitude:145.24}],fetchedAt:now.toISOString()};
  const [pin]=generateCanonicalPinsForWay(source);
  const cache=createFirestoreAuthoritativeSourceCache({firestore:db,collectionName:AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,readsEnabled:true,writesEnabled:true});
  await cache.write(source,{kind:'positive',source,cachedAt:now.toISOString(),expiresAt:new Date(+now+86400000).toISOString()});
  const candidates=[{id:pin.pinId,lat:pin.latitude,lng:pin.longitude}],plotRef=db.collection('sharedBasePinStates').doc(sharedWorldDocumentId(pin.pinId));
  await db.collection('authoritativeWaterPinStates').doc(pin.pinId).set({pinId:pin.pinId,type:'base',latitude:pin.latitude,longitude:pin.longitude});
  const depRef=db.collection('birdQuestDeployments').doc('alpha-dove-pilot');
  // This demo project can survive repeated test runs. Do not inherit the prior
  // run's expired visit and incorrectly treat its only fixture plot as a repeat.
  await depRef.delete();
  const ownerRef=db.collection('birdQuestPlayers').doc(owner),bagRef=db.collection('playerMarketInventories').doc(owner);
  const captureRef=db.collection('playerCaptureStates').doc(owner).collection('pins').doc(sharedWorldDocumentId(pin.pinId));
  const harvestRef=db.collection('sharedBasePinHarvests').doc(sharedWorldDocumentId(pin.pinId)).collection('players').doc(owner);
  let completed=0;
  for(const plotOwner of [owner,visitor]) await t.test(`owner completes own bird on ${plotOwner===owner?'own':'another player'} plot`,async()=>{
    const plantedAt=new Date(+now-86400000),day=now.toISOString().slice(0,10),at=Timestamp.now();
    await plotRef.set(serializeSharedBasePinStateForStorage({pinId:pin.pinId,latitude:pin.latitude,longitude:pin.longitude,ownerUid:plotOwner,
      ownerName:plotOwner,ownerAvatarUrl:null,ownedAt:plantedAt,level:1,replantEnabled:false,
      plant:{seedId:'corn_seed',plantedAt,miracleGrownAt:new Date(+now-3600000)},updatedAt:now}));
    await captureRef.set({schemaVersion:1,pinId:pin.pinId,captureDay:day,capturedAt:at});
    await harvestRef.set({schemaVersion:1,pinId:pin.pinId,harvestDay:day,harvestedAt:at,cropPlantedAt:Timestamp.fromDate(plantedAt)});
    const protectedRefs=[plotRef,captureRef,harvestRef,db.collection('players').doc(visitor),db.collection('playerMarketInventories').doc(visitor)];
    const protectedBefore=await Promise.all(protectedRefs.map(async ref=>(await ref.get()).data()));
    const deployment=(await call(owner,{action:'deploy',...location,candidates})).deployment;
    assert.equal(deployment.landing.id,pin.pinId);
    assert.equal((await depRef.get()).data().expiresAt-(await depRef.get()).data().createdAt,21600000);
    for(const uid of [owner,visitor]) assert.equal((await call(uid,{action:'nearby',...location})).birds[0].id,deployment.id);
    const beforeState=(await ownerRef.get()).data(),beforeXp=(await db.collection('players').doc(owner).get()).data().xp;
    await assert.rejects(call(owner,{action:'offer',deploymentId:deployment.id,...location,latitude:-37,candidates}),{code:'failed-precondition'});
    const ownerOffer=(await call(owner,{action:'offer',deploymentId:deployment.id,...location,candidates})).offer;
    const visitorOffer=(await call(visitor,{action:'offer',deploymentId:deployment.id,...location,candidates})).offer;
    assert.deepEqual(ownerOffer.quests.map(q=>q.id),['dove-1-flour-power']);
    assert.equal((await call(owner,{action:'offer',deploymentId:deployment.id,...location,candidates})).offer.id,ownerOffer.id);
    assert.equal((await db.collection('players').doc(owner).get()).data().xp,beforeXp,'Opening a bird does not pay rewards');
    const accept={action:'accept',offerId:ownerOffer.id,questId:'dove-1-flour-power',...location};
    await assert.rejects(call(owner,{...accept,latitude:-37}),{code:'failed-precondition'});
    const [a,b]=await Promise.all([call(owner,accept),call(owner,accept)]);
    assert.equal(a.run.id,b.run.id);assert.equal(a.run.birdOwnerUid,owner);assert.equal(a.run.deploymentId,deployment.id);
    assert.equal((await depRef.get()).data().status,'departed');
    for(const uid of [owner,visitor]) assert.deepEqual((await call(uid,{action:'nearby',...location})).birds,[]);
    await assert.rejects(call(visitor,{...accept,offerId:visitorOffer.id}),{code:'failed-precondition'});
    const requestId=`own-bird-flour-${completed}-${process.pid}`;
    await craftRecipeHandler({auth:auth(owner),data:{requestId,recipeId:'flour'}});
    const ready=await call(owner,{action:'sync',runId:a.run.id,receipts:[{kind:'craft',id:requestId}]});
    assert.equal(ready.run.status,'reward-pending');
    const reward=ready.run.reward,original=(await bagRef.get()).data().items,fullItem=Object.keys(reward.items)[0];
    await bagRef.set({schemaVersion:1,items:{...original,[fullItem]:10000}});
    await assert.rejects(call(owner,{action:'claim',runId:a.run.id}),{code:'failed-precondition'});
    assert.deepEqual((await call(owner,{action:'snapshot'})).run.reward,reward);
    assert.equal((await ownerRef.get()).data().bird.xp,beforeState.bird.xp);
    await bagRef.set({schemaVersion:1,items:original});
    const claims=await Promise.all([call(owner,{action:'claim',runId:a.run.id}),call(owner,{action:'claim',runId:a.run.id})]);
    assert.equal(claims.filter(x=>x.claimedNow).length,1);completed++;
    const after=(await ownerRef.get()).data();
    assert.equal(after.bird.xp,beforeState.bird.xp+100);assert.equal(after.bird.questsCompleted,completed);assert.equal(after.activeRunId,null);
    assert.equal((await db.collection('players').doc(owner).get()).data().xp,beforeXp+100);
    assert.equal((await db.collection('players').doc(owner).get()).data().coins,100);
    assert.equal((await db.collection('playerLeaderboardScores').doc(owner).get()).data().daily.points,completed*100);
    const expected={...original};for(const [id,amount] of Object.entries(reward.items)) expected[id]=(expected[id]||0)+amount;
    assert.deepEqual((await bagRef.get()).data().items,expected);
    const cards={...beforeState.cardCounts};if(reward.card){const key=`${reward.card.cardId}:${reward.card.rarity}`;cards[key]=(cards[key]||0)+1;}
    assert.deepEqual(after.cardCounts,cards);assert.equal(after.pendingMailCount||0,0);assert.equal((await ownerRef.collection('mail').get()).size,0);
    assert.equal((await call(owner,{action:'claim',runId:a.run.id})).claimedNow,false);
    assert.deepEqual(await Promise.all(protectedRefs.map(async ref=>(await ref.get()).data())),protectedBefore);
  });
  await t.test('owner can reject without despawning; expiry/recall and authorization remain enforced',async()=>{
    const d=(await call(owner,{action:'deploy',...location,candidates})).deployment;
    const offer=(await call(owner,{action:'offer',deploymentId:d.id,...location,candidates})).offer;
    await call(owner,{action:'reject',offerId:offer.id,...location});
    assert.equal((await call(owner,{action:'nearby',...location})).birds[0].id,d.id);
    await assert.rejects(call(visitor,{action:'recall',deploymentId:d.id}),{code:'permission-denied'});
    await call(owner,{action:'recall',deploymentId:d.id});
    assert.deepEqual((await call(owner,{action:'nearby',...location})).birds,[]);
    const next=(await call(owner,{action:'deploy',...location,candidates})).deployment;
    const stale=(await call(owner,{action:'offer',deploymentId:next.id,...location,candidates})).offer;
    await depRef.update({expiresAt:Date.now()-1});
    assert.deepEqual((await call(owner,{action:'nearby',...location})).birds,[]);
    await assert.rejects(call(owner,{action:'accept',offerId:stale.id,questId:'dove-1-flour-power',...location}),{code:'failed-precondition'});
  });
});
