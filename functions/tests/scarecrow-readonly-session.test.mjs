import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const session=require('../lib/domain/players/activeDeviceSession.js');
function setup(t){
 const deviceId='scarecrow-test-device-12345678';
 let reads=0,writes=0,moderation=0,queries=0,suspended=false;
 let record={schemaVersion:1,deviceHash:session.hashDeviceId(deviceId),activatedAt:new Date(),lastSeenAt:new Date()};
 const previous=process.env.GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED;
 process.env.GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED='true';
 t.after(()=>{if(previous===undefined)delete process.env.GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED;else process.env.GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED=previous;});
 t.mock.method(require('../lib/firebaseAdmin.js'),'getAdminFirestore',()=>({collection:()=>({doc:()=>({get:async()=>{reads++;return {exists:!!record,data:()=>record};},update:async()=>{writes++;}})})}));
 t.mock.method(require('../lib/domain/players/playerModeration.js'),'requirePlayerAccountIsActive',async()=>{moderation++;if(suspended)throw Object.assign(Error('suspended'),{code:'permission-denied'});});
 t.mock.method(require('../lib/security/requireAuthenticated.js'),'requireAuthenticated',()=>({uid:'test'}));
 t.mock.method(require('../lib/security/requireAuthenticated.js'),'requireAppCheckIfEnabled',()=>{});
 t.mock.method(require('../lib/security/requireInvitedUserAccess.js'),'requireInvitedUserAccess',()=>{});
 t.mock.method(require('../lib/security/developmentBackendCapabilityGuard.js'),'requireDevelopmentBackendCapabilityAccess',()=>{});
 t.mock.method(require('../lib/config/developmentBackendOperationalSafeguards.js'),'requireDevelopmentBackendOperationalSafeguardAccess',()=>{});
 t.mock.method(require('../lib/domain/players/playerStore.js'),'getPlayerDocumentRef',()=>({get:async()=>({exists:true,data:()=>({})})}));
 t.mock.method(require('../lib/domain/players/playerStore.js'),'readStoredPlayerDocument',()=>({profileComplete:true}));
 t.mock.method(require('../lib/domain/world/mapDirectoryReads.js'),'readScarecrowsInViewport',async()=>{queries++;return [];});
 const api=require('../lib/api/alphaBinglesScarecrowDeployment.js');
 return {run:()=>api.getActiveBinglesScarecrowsHandler({data:{deviceId}}),counts:()=>({reads,writes,moderation,queries}),
  transfer:()=>{record.deviceHash=session.hashDeviceId('different-device-12345678');},suspend:()=>{suspended=true;},remove:()=>{record=null;}};
}
test('repeated scarecrow refreshes freshly verify access without session writes',async t=>{
 const h=setup(t);assert.equal((await h.run()).ok,true);await h.run();
 assert.deepEqual(h.counts(),{reads:2,writes:0,moderation:2,queries:2});
});
test('a device transfer blocks the next refresh before directory reads',async t=>{
 const h=setup(t);await h.run();h.transfer();await assert.rejects(h.run(),{code:'failed-precondition'});
 assert.deepEqual(h.counts(),{reads:2,writes:0,moderation:2,queries:1});
});
test('a suspension blocks the next refresh without caching authority',async t=>{
 const h=setup(t);await h.run();h.suspend();await assert.rejects(h.run(),{code:'permission-denied'});
 assert.deepEqual(h.counts(),{reads:1,writes:0,moderation:2,queries:1});
});
test('missing active session blocks map refresh',async t=>{
 const h=setup(t);h.remove();await assert.rejects(h.run(),{code:'failed-precondition'});
 assert.equal(h.counts().writes,0);assert.equal(h.counts().queries,0);
});
