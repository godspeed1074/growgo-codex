import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url);
test('replay uses separate items and coins and cannot incubate or alter original egg',async t=>{
 const {parseSafeFirestoreEmulatorHost}=require('../lib/infrastructure/pins/firestoreEmulatorHost.js');if(!parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST)){t.skip('Local emulator required');return;}
 const{initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore}=require('firebase-admin/firestore');const app=initializeApp({projectId:'demo-leonard-replay'},'replay-'+process.pid),db=getFirestore(app);t.after(async()=>{await db.terminate();await deleteApp(app);});
 const uid='replay-'+process.pid,runId='test',original=db.collection('leonardIntroductionPlayers').doc(uid),player=db.collection('players').doc(uid),replay=db.collection('leonardIntroductionReplays').doc(uid);
 const egg={stage:'incubating',hatchAt:Date.now()+999999,runId:'original',egg:0,nest:0};await original.set(egg);await player.set({coins:888});
 const ids=Array.from({length:6},(_,i)=>'pin'+i);await replay.set({schemaVersion:1,questId:'a-little-help-from-my-friends',uid,runId,replay:true,testCoins:500,stage:'materials',sticks:6,cotton:0,egg:1,nest:0,cottonPurchased:false,hatchAt:null,locations:{eggPins:ids,stickPins:ids},collectedEggPins:ids,collectedStickPins:ids});
 const{commitLeonardProgress:commit}=require('../lib/domain/quests/leonardProgressTransaction.js');
 const send=async(kind)=>{const s=(await replay.get()).data();return commit(db,{uid,runId,action:{stage:s.stage,kind}},async()=>{},Date.now,true);};
 await send('buy-cotton');await send('buy-cotton');assert.equal((await replay.get()).data().testCoins,200);await send('talk');await send('craft-nest');assert.equal((await replay.get()).data().stage,'use');await assert.rejects(send('use-nest'),/stops before incubation/);
 assert.deepEqual((await original.get()).data(),egg);assert.equal((await player.get()).data().coins,888);assert.equal((await db.collection('playerBirdhouses').doc(uid).collection('birds').get()).size,0);
});
