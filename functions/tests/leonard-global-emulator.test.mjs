import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const require=createRequire(import.meta.url);
test('global quest and Birdhouse isolate accounts; full hatch and rollback remain safe',async t=>{
 const {parseSafeFirestoreEmulatorHost}=require('../lib/infrastructure/pins/firestoreEmulatorHost.js');
 const host=parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);if(!host){t.skip('Local emulator required');return;}
 Object.assign(process.env,{FIRESTORE_EMULATOR_HOST:host.normalizedHostPort,GCLOUD_PROJECT:'demo-leonard-global',GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED:'false',GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'false',GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled',GROWGO_LEONARD_ALL_PLAYERS_ENABLED:'true'});
 const {initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore,Timestamp}=require('firebase-admin/firestore');
 const app=initializeApp({projectId:'demo-leonard-global'},`global-${process.pid}`),db=getFirestore(app);t.after(async()=>{await db.terminate();await deleteApp(app);});
 // Remove only this demo emulator's stale lookup fixtures from earlier runs.
 for(const doc of (await db.collection('leonardLookupCache').get()).docs)await doc.ref.delete();
 const {leonardQuestHandler:handle}=require('../lib/api/leonardQuest.js'),{birdQuestsHandler:birds}=require('../lib/api/birdQuests.js');
 const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');
 const {generateCanonicalPinsForWay:generate}=require('../lib/domain/pins/canonicalPinGenerator.js');
 const coords=[{latitude:0,longitude:0},{latitude:0,longitude:0.0025}],pins=generate({generatorVersion:1,sourceType:'osm-way',sourceId:'7',spacingMetres:50,orderedCoordinates:coords});
 let lookups=0;const oldFetch=globalThis.fetch;
 globalThis.fetch=async(_url,options)=>{lookups++;const q=options.body.get('data');return Response.json({osm3s:{timestamp_osm_base:new Date().toISOString()},...(q.includes('out tags')?{elements:[{type:'node',id:1,lat:0,lon:0,tags:{amenity:'place_of_worship',religion:'christian'}},{type:'node',id:2,lat:0,lon:0,tags:{leisure:'park',name:'Test Reserve'}},{type:'node',id:3,lat:0,lon:0,tags:{shop:'grocery'}}]}:{elements:[{type:'way',id:7,tags:{highway:'residential'},geometry:coords.map(p=>({lat:p.latitude,lon:p.longitude}))}]})});};t.after(()=>{globalThis.fetch=oldFetch;});
 const gps={latitude:0,longitude:0,accuracyMetres:5};const auth=uid=>({uid,token:{email:`${uid}@example.test`,email_verified:true}});
 const call=(uid,data)=>handle({auth:auth(uid),data});
 const a=`alice-${process.pid}`,b=`bob-${process.pid}`;
 for(const uid of [a,b]){
  await db.collection('players').doc(uid).set({...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,displayName:uid,gender:'male',country:'Australia',region:'oceania',state:'Victoria',coins:500});
  for(const pin of pins)await db.collection('playerCaptureStates').doc(uid).collection('pins').doc(createHash('sha256').update(pin.pinId).digest('hex')).set({pinId:pin.pinId,capturedAt:Timestamp.now()});
 }
 const warmed=await call(a,{action:'prepare',...gps});assert.ok(['prepared','cached'].includes(warmed.status));
 assert.equal((await db.collection('leonardIntroductionPlayers').doc(a).get()).exists,false);
 assert.equal((await db.collection('players').doc(a).get()).data().coins,500);
 let r=await call(a,{action:'start',...gps});const runId=r.run.runId;
 const other=await call(b,{action:'start',...gps});assert.notEqual(runId,other.run.runId);assert.ok(lookups<=2);
 await assert.rejects(call(b,{action:'progress',runId,stage:r.run.stage,kind:'talk',...gps}));
 const send=async(kind,extra={})=>{r=await call(a,{action:'progress',runId,stage:r.run.stage,kind,...gps,...extra});};
 await send('talk');for(const id of r.run.locations.eggPins){const pos=r.run.actionLocations.targets[id];await send('collect-egg',{pinId:id,...pos});}await send('talk');
 await send('buy-cotton');await send('buy-cotton');assert.equal(r.player.coins,200);
 for(const id of r.run.locations.stickPins){const pos=r.run.actionLocations.targets[id];await send('collect-stick',{pinId:id,...pos});}
 await send('talk');await send('craft-nest');await send('use-nest');await assert.rejects(call(a,{action:'hatch',runId}));
 await db.collection('leonardIntroductionPlayers').doc(a).update({hatchAt:Date.now()-1});
 await call(a,{action:'hatch',runId});await call(a,{action:'hatch',runId});
 const viewA=await birds({auth:auth(a),data:{action:'snapshot'}}),viewB=await birds({auth:auth(b),data:{action:'snapshot'}});
 assert.equal(viewA.earnedBirds.length,1);assert.equal(viewA.earnedBirds[0].canDeploy,true);assert.equal(viewB.earnedBirds.length,0);
 await assert.rejects(birds({auth:auth(b),data:{action:'deploy',birdId:'leonard-introduction-dove'}}));
 await assert.rejects(birds({auth:auth(b),data:{action:'claim-test-dove'}}));
 assert.equal((await db.collection('players').doc(b).get()).data().coins,500);
 // Restart affects only the unfinished player's private run, never the other reward.
 await call(b,{action:'restart',runId:other.run.runId});
 assert.equal((await db.collection('leonardIntroductionPlayers').doc(b).get()).exists,false);
 await assert.rejects(call(a,{action:'restart',runId}));
 const {sharedWorldDocumentId,serializeSharedBasePinStateForStorage}=require('../lib/domain/world/sharedWorld.js');
 const {birdDeploymentDocument}=require('../lib/domain/quests/ownedBirdDeployment.js');
 const now=new Date(),pin=pins[0],birdId='leonard-introduction-dove';
 const plotRef=db.collection('sharedBasePinStates').doc(sharedWorldDocumentId(pin.pinId));
 await plotRef.set(serializeSharedBasePinStateForStorage({pinId:pin.pinId,latitude:pin.latitude,longitude:pin.longitude,ownerUid:b,ownerName:b,ownerAvatarUrl:null,ownedAt:now,level:1,replantEnabled:false,plant:{seedId:'corn_seed',plantedAt:now},updatedAt:now}));
 await db.collection('authoritativeWaterPinStates').doc(pin.pinId).set({pinId:pin.pinId,type:'base',latitude:pin.latitude,longitude:pin.longitude});
 const plotBefore=(await plotRef.get()).data();
 const deployed=await birds({auth:auth(a),data:{action:'deploy',birdId}});
 assert.equal(deployed.earnedBirds[0].status,'Deployed');
 const visit=(await db.collection('birdQuestDeployments').doc(birdDeploymentDocument(a,birdId)).get()).data();
 const nearby=await birds({auth:auth(b),data:{action:'nearby',...gps}});
 assert.ok(nearby.birds.some(d=>d.id===visit.id));
 await assert.rejects(birds({auth:auth(b),data:{action:'recall',birdId,deploymentId:visit.id}}));
 await birds({auth:auth(a),data:{action:'recall',birdId,deploymentId:visit.id}});
 assert.deepEqual((await plotRef.get()).data(),plotBefore);
 assert.equal((await birds({auth:auth(b),data:{action:'nearby',...gps}})).birds.some(d=>d.id===visit.id),false);
 const before=lookups;const resumed=await call(a,{action:'start',...gps});assert.equal(resumed.run.stage,'completed');assert.equal(lookups,before);
 process.env.GROWGO_LEONARD_ALL_PLAYERS_ENABLED='false';await assert.rejects(call(b,{action:'status'}));
 assert.equal((await db.collection('playerBirdhouses').doc(a).collection('birds').get()).size,1);
 process.env.GROWGO_LEONARD_TEST_UIDS=a;
 assert.equal((await call(a,{action:'status'})).preparationEnabled,true);
 assert.equal((await birds({auth:auth(a),data:{action:'snapshot'}})).leonardAvailable,true);
 assert.equal((await birds({auth:auth(b),data:{action:'snapshot'}})).leonardAvailable,false);
 await assert.rejects(call(b,{action:'status'}));
 assert.equal((await call(a,{action:'start',...gps})).run.stage,'completed');
 assert.equal(lookups,before);
 delete process.env.GROWGO_LEONARD_TEST_UIDS;
});
