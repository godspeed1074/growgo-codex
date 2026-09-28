import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const require=createRequire(import.meta.url);
test('Leonard callable: gated pilot, real location checks and complete personal quest',async t=>{
 const {parseSafeFirestoreEmulatorHost}=require('../lib/infrastructure/pins/firestoreEmulatorHost.js');
 const host=parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);if(!host){t.skip('Local emulator required');return;}
 Object.assign(process.env,{FIRESTORE_EMULATOR_HOST:host.normalizedHostPort,GCLOUD_PROJECT:'demo-leonard-callable',GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED:'false',GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'false',GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled'});
 const {initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore,Timestamp}=require('firebase-admin/firestore');
 const app=initializeApp({projectId:'demo-leonard-callable'},`leonard-${process.pid}`),db=getFirestore(app);t.after(async()=>{await db.terminate();await deleteApp(app);});
 const {leonardQuestHandler:handle}=require('../lib/api/leonardQuest.js');const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');
 const uid='LkR8ugTK6lXGFfUlLvKSiqMoMBh1',auth={uid,token:{email:'godspeed1074@gmail.com',email_verified:true}},gps={latitude:-38.45,longitude:145.24,accuracyMetres:5};
 const call=data=>handle({auth,data}),ref=db.collection('leonardIntroductionPlayers').doc(uid),config=db.collection('leonardPilotAccess').doc(uid);
 await ref.delete();await db.collection('playerBirdhouses').doc(uid).collection('birds').doc('leonard-introduction-dove').delete();await config.delete();
 await db.collection('players').doc(uid).set({...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,displayName:'Rubberlips',gender:'male',country:'Australia',region:'oceania',state:'Victoria',coins:500});
 await assert.rejects(call({action:'status'}));await assert.rejects(handle({auth:{uid:'other',token:auth.token},data:{action:'status'}}));
 const point=id=>({id,latitude:gps.latitude,longitude:gps.longitude,safe:true}),pins=prefix=>Array.from({length:6},(_,i)=>({...point(prefix+i),previouslyCapturedByPlayer:false}));
 await db.collection('leonardPilotLocations').doc('cowes-v1').set({schemaVersion:1,verified:true,center:point('center'),evidence:{churches:[{...point('church'),basePins:pins('egg')}],parks:[{...point('park'),basePins:pins('stick')}],shops:[point('shop')]}});
 await config.set({enabled:true,locationSet:'cowes-v1'});
 // This local emulator persists between runs; remove only fixture receipts.
 for(const p of pins('stick'))await db.collection('playerCaptureStates').doc(uid).collection('pins').doc(createHash('sha256').update(p.id).digest('hex')).delete();
 await assert.rejects(call({action:'start',...gps}));assert.equal((await ref.get()).exists,false);
 for(const p of pins('stick'))await db.collection('playerCaptureStates').doc(uid).collection('pins').doc(createHash('sha256').update(p.id).digest('hex')).set({pinId:p.id,capturedAt:Timestamp.now()});
 let r=await call({action:'start',...gps});const firstRun=r.run.runId;
 await assert.rejects(call({action:'restart',runId:'wrong-run'}));
 await call({action:'restart',runId:firstRun});assert.equal((await ref.get()).exists,false);
 r=await call({action:'start',...gps});const runId=r.run.runId;assert.notEqual(runId,firstRun);
 await assert.rejects(call({action:'restart',runId:firstRun}));
 const send=async(kind,extra={})=>{r=await call({action:'progress',runId,stage:r.run.stage,kind,...gps,...extra});return r;};
 await assert.rejects(send('talk',{latitude:-38.50}));assert.equal((await ref.get()).data().stage,'meet-leonard');
 await send('talk');for(let i=0;i<6;i++)await send('collect-egg',{pinId:'egg'+i});await send('talk');await send('buy-cotton');assert.equal(r.player.coins,200);
 await send('buy-cotton');assert.equal(r.player.coins,200);
 for(let i=0;i<6;i++)await send('collect-stick',{pinId:'stick'+i});await send('talk');await send('craft-nest');await send('use-nest');
 await assert.rejects(call({action:'hatch',runId}));
 await ref.update({hatchAt:Date.now()-1});r=await call({action:'hatch',runId});assert.equal(r.run.stage,'completed');await call({action:'hatch',runId});
 assert.equal((await db.collection('playerBirdhouses').doc(uid).collection('birds').get()).size,1);
 await assert.rejects(call({action:'restart',runId}));
});
