import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require('../lib/infrastructure/pins/firestoreEmulatorHost.js');

test('earned dove: real local transactions, acceptance race and exactly-once rewards', async t => {
 const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
 if (!host) { t.skip('Local emulator required; never uses production.'); return; }
 const projectId=`demo-growgo-earned-${process.pid}`;
 Object.assign(process.env, { FIRESTORE_EMULATOR_HOST:host.normalizedHostPort, GCLOUD_PROJECT:projectId,
   GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',
   GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED:'false',GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'false',
   GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled',GROWGO_LEONARD_PILOT_ENABLED:'true' });
 const {initializeApp,deleteApp}=require('firebase-admin/app');const {getFirestore,Timestamp}=require('firebase-admin/firestore');
 const app=initializeApp({projectId},`earned-${process.pid}`),db=getFirestore(app);
 t.after(async()=>{await db.terminate();await deleteApp(app);});
 const {birdQuestsHandler:handle}=require('../lib/api/birdQuests.js');
 const {craftRecipeHandler}=require('../lib/api/marketplace.js');
 const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');
 const {generateCanonicalPinsForWay}=require('../lib/domain/pins/canonicalPinGenerator.js');
 const {createFirestoreAuthoritativeSourceCache,AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME}=require('../lib/infrastructure/pins/firestoreAuthoritativePinCache.js');
 const {serializeSharedBasePinStateForStorage,sharedWorldDocumentId}=require('../lib/domain/world/sharedWorld.js');
 const {birdDeploymentDocument}=require('../lib/domain/quests/ownedBirdDeployment.js');
 const owner='LkR8ugTK6lXGFfUlLvKSiqMoMBh1',birdId='leonard-introduction-dove',visitors=['visitor-a','visitor-b'];
 const auth=uid=>({uid,token:{email:uid===owner?'godspeed1074@gmail.com':`${uid}@example.test`,email_verified:true}});
 const call=(uid,data)=>handle({auth:auth(uid),data});
 const profile={...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,displayName:'Rubberlips',gender:'male',country:'Australia',region:'oceania',state:'Victoria',coins:1000,xp:50,craftingLevel:1};
 for(const uid of [owner,...visitors]){
   await db.collection('players').doc(uid).set(profile);
   await db.collection('playerMarketInventories').doc(uid).set({schemaVersion:1,items:{wheat:10}});
 }
 const now=new Date(),location={latitude:-38.45,longitude:145.24,accuracyMetres:5};
 const source={generatorVersion:1,sourceType:'osm-way',sourceId:'98989996',spacingMetres:50,
   orderedCoordinates:[{latitude:-38.45,longitude:145.24},{latitude:-38.442,longitude:145.24}],fetchedAt:now.toISOString()};
 const pin=generateCanonicalPinsForWay(source)[0];
 const cache=createFirestoreAuthoritativeSourceCache({firestore:db,collectionName:AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,readsEnabled:true,writesEnabled:true});
 await cache.write(source,{kind:'positive',source,cachedAt:now.toISOString(),expiresAt:new Date(+now+86400000).toISOString()});
 await db.collection('authoritativeWaterPinStates').doc(pin.pinId).set({pinId:pin.pinId,type:'base',latitude:pin.latitude,longitude:pin.longitude});
 const plotRef=db.collection('sharedBasePinStates').doc(sharedWorldDocumentId(pin.pinId));
 await plotRef.set(serializeSharedBasePinStateForStorage({pinId:pin.pinId,latitude:pin.latitude,longitude:pin.longitude,ownerUid:owner,ownerName:'Rubberlips',ownerAvatarUrl:null,
   ownedAt:now,level:1,replantEnabled:false,plant:{seedId:'wheat_seed',plantedAt:new Date(+now-86400000),miracleGrownAt:null},updatedAt:now}));
 await call(owner,{action:'claim-test-dove'});
 const legacy=(await call(owner,{action:'deploy'})).deployment;
 const legacyRef=db.collection('birdQuestDeployments').doc('alpha-dove-pilot'),legacyBefore=(await legacyRef.get()).data();
 const birdRef=db.collection('playerBirdhouses').doc(owner).collection('birds').doc(birdId);
 await birdRef.set({schemaVersion:1,uid:owner,id:birdId,species:'dove',level:1,xp:0,questsCompleted:0,sourceQuestId:'a-little-help-from-my-friends'});
 await assert.rejects(call(visitors[0],{action:'deploy',birdId}),{code:'permission-denied'});
 const deployments=await Promise.all([call(owner,{action:'deploy',birdId}),call(owner,{action:'deploy',birdId})]);
 const visit=deployments[0].earnedBirds[0].deployment;
 assert.equal(visit.id,deployments[1].earnedBirds[0].deployment.id);assert.notEqual(visit.id,legacy.id);
 assert.equal((await call(visitors[0],{action:'nearby',...location})).birds.length,2);
 const candidates=[{id:pin.pinId,lat:pin.latitude,lng:pin.longitude}];
 const offers=await Promise.all(visitors.map(uid=>call(uid,{action:'offer',deploymentId:visit.id,...location,candidates})));
 const results=await Promise.allSettled(visitors.map((uid,i)=>call(uid,{action:'accept',offerId:offers[i].offer.id,questId:'dove-1-flour-power',...location})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const index=results.findIndex(r=>r.status==='fulfilled'),winner=visitors[index],run=results[index].value.run;
 assert.equal(run.birdId,birdId);assert.equal(run.birdOwnerUid,owner);
 assert.deepEqual((await legacyRef.get()).data(),legacyBefore);
 assert.equal((await db.collection('birdQuestDeployments').doc(birdDeploymentDocument(owner,birdId)).get()).data().status,'departed');
 const requestId=`earned-flour-${process.pid}`;
 await craftRecipeHandler({auth:auth(winner),data:{requestId,recipeId:'flour'}});
 assert.equal((await call(winner,{action:'sync',runId:run.id,receipts:[{kind:'craft',id:requestId}]})).run.status,'reward-pending');
 const claims=await Promise.all([call(winner,{action:'claim',runId:run.id}),call(winner,{action:'claim',runId:run.id})]);
 assert.equal(claims.filter(r=>r.claimedNow).length,1);
 const earned=(await birdRef.get()).data();assert.equal(earned.xp,100);assert.equal(earned.questsCompleted,1);
 assert.equal((await call(owner,{action:'snapshot'})).bird.xp,0);
 assert.equal((await db.collection('birdQuestPlayers').doc(owner).collection('mail').get()).size,1);
 assert.equal((await db.collection('players').doc(winner).get()).data().xp,150);
 assert.deepEqual((await legacyRef.get()).data(),legacyBefore);
});
