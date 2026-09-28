import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require = createRequire(import.meta.url);
const admin = require('../lib/firebaseAdmin.js');
const {Timestamp} = require('firebase-admin/firestore');
const {buildDefaultPlayerDocument} = require('../lib/domain/players/playerStore.js');
const {serializeSharedBasePinStateForStorage, sharedWorldDocumentId} = require('../lib/domain/world/sharedWorld.js');
const {clearOfficialEventScheduleCache} = require('../lib/domain/events/officialEvents.js');
const fish = require('../lib/domain/pins/waterFishSpawns.js');
const {acceptPrivateAlphaCapture} = require('../lib/domain/captures/privateAlphaCapture.js');

function harness(t, {water = false, plantDays, preflightWater = water} = {}) {
  t.mock.timers.enable({apis:['Date'], now:new Date('2026-09-16T12:00:00Z')});
  const now = new Date(), uid='test-player', pinId='ggpin:v1:osm-way:900000001:0';
  const rows=new Map(), reads=[], writes=[];
  let writing=false;
  function snapshot(p, transactional=false) {
    reads.push({path:p,transactional});
    let value=rows.get(p);
    if (!transactional && p === `authoritativeWaterPinStates/${pinId}`) value={pinId,type:preflightWater?'water':'base'};
    return {exists:!!value,data:()=>value};
  }
  function ref(p) {return {path:p,doc:id=>ref(p+'/'+id),collection:id=>ref(p+'/'+id),get:async()=>snapshot(p),
    where:()=>({limit:()=>({get:async()=>({docs:[]})})})};}
  const db={collection:ref,getAll:async(...refs)=>refs.map(r=>snapshot(r.path)),runTransaction:async fn=>{
    writing=false;const pending=[];
    const tx={get:async r=>{assert.equal(writing,false,'read after write');return snapshot(r.path,true);}};
    for(const method of ['set','update','create'])tx[method]=(r,v)=>{writing=true;pending.push([r.path,v,method]);};
    const result=await fn(tx);
    for(const [p,v,method]of pending){rows.set(p,method==='update'?{...rows.get(p),...v}:v);writes.push(p);}
    return result;
  }};
  t.mock.method(admin,'getAdminFirestore',()=>db);
  clearOfficialEventScheduleCache();
  rows.set('players/'+uid,{...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,displayName:'Test',country:'Australia',region:'oceania',state:'Victoria',gender:'male'});
  rows.set(`authoritativeWaterPinStates/${pinId}`,{pinId,type:water?'water':'base'});
  rows.set('playerMarketInventories/'+uid,{schemaVersion:2,items:{wheat:5,corn:11,wheat_seed:3}});
  if(plantDays!==undefined)rows.set('sharedBasePinStates/'+sharedWorldDocumentId(pinId),serializeSharedBasePinStateForStorage({
    pinId,latitude:-38.45,longitude:145.24,ownerUid:uid,ownerName:'Test',ownerAvatarUrl:null,
    ownedAt:now,updatedAt:now,level:1,replantEnabled:false,
    plant:{seedId:'wheat_seed',plantedAt:new Date(+now-plantDays*86400000),miracleGrownAt:null}
  }));
  const canonicalPin={pinId,latitude:-38.45,longitude:145.24,generatorVersion:1,sourceType:'osm-way',sourceId:'900000001',positionIndex:0,segmentIndex:0,distanceAlongWayMetres:0};
  const request={requestId:'capture-test-1',pinId,latitude:-38.45,longitude:145.24,accuracyMetres:5,clientCapturedAt:now.toISOString()};
  const capture=(overrides={})=>acceptPrivateAlphaCapture({uid,canonicalPin,evidence:{pinLatitude:-38.45,pinLongitude:145.24},request:{...request,...overrides}});
  const hash=s=>createHash('sha256').update(s).digest('hex');
  return {rows,reads,writes,capture,pinId,uid,db,now,
    capturePath:`playerCaptureStates/${uid}/pins/${hash(pinId)}`,
    overridePath:`playerHarvestRecaptureOverrides/${uid}/pins/${hash(pinId)}`,
    harvestPath:`sharedBasePinHarvests/${sharedWorldDocumentId(pinId)}/players/${uid}`};
}

test('ordinary land capture skips five optional reads and retains five reward writes',async t=>{
 const h=harness(t);const r=await h.capture();
 assert.equal(r.ok,true);assert.equal(r.inventory,null);assert.equal(r.harvest,null);assert.equal(r.waterRewards,null);
 assert.equal(h.reads.filter(r=>r.transactional).length,9);
 assert.equal(h.reads.filter(r=>/activeWaterFishCycles|sharedBasePinHarvests|playerMarketInventories|playerHarvestRecaptureOverrides/.test(r.path)).length,0);
 assert.equal(h.writes.length,5);
 assert.equal(h.rows.get('playerMarketInventories/'+h.uid).items.wheat,5);
 const before=h.writes.length;
 h.reads.length=0;
 assert.equal((await h.capture()).replayed,true);assert.equal(h.writes.length,before);
 assert.equal(h.reads.filter(r=>r.transactional).length,1);
 h.reads.length=0;
 await assert.rejects(h.capture({accuracyMetres:6}),{code:'already-exists'});
 assert.equal(h.reads.filter(r=>r.transactional).length,1);
 await assert.rejects(h.capture({requestId:'another-request'}),{code:'already-exists'});
 assert.equal(h.writes.length,before);
});

for(const days of [1,29])test(`non-harvestable crop age ${days} skips harvest and inventory reads`,async t=>{
 const h=harness(t,{plantDays:days});const r=await h.capture();assert.equal(r.harvest,null);
 assert.equal(h.reads.some(r=>r.path===h.harvestPath),false);
 assert.equal(h.reads.some(r=>r.path==='playerMarketInventories/'+h.uid),false);
});

test('ripe wheat preserves inventory contents and awards only once',async t=>{
 const h=harness(t,{plantDays:22});const r=await h.capture();
 assert.equal(r.harvest.itemId,'wheat');assert.equal(r.inventory.items.wheat,6);
 assert.equal(r.inventory.items.corn,11);assert.equal(r.inventory.items.wheat_seed,3);
 assert.equal(h.writes.length,7);
 assert.equal(h.reads.filter(r=>r.path==='playerMarketInventories/'+h.uid).length,1);
 await assert.rejects(h.capture({requestId:'repeat'}),{code:'already-exists'});
 assert.equal(h.rows.get('playerMarketInventories/'+h.uid).items.wheat,6);
});

test('already harvested ripe crop does not read or overwrite inventory',async t=>{
 const h=harness(t,{plantDays:22});h.rows.set(h.harvestPath,{harvestDay:'2026-09-16'});
 const r=await h.capture();assert.equal(r.harvest,null);assert.equal(r.inventory,null);
 assert.equal(h.reads.some(r=>r.path==='playerMarketInventories/'+h.uid),false);
});

test('valid recapture override is still read and consumed',async t=>{
 const h=harness(t);h.rows.set(h.capturePath,{pinId:h.pinId,captureDay:'2026-09-16'});
 h.rows.set(h.overridePath,{pinId:h.pinId,captureDay:'2026-09-16',used:false});
 assert.equal((await h.capture()).ok,true);assert.equal(h.rows.get(h.overridePath).used,true);
 await assert.rejects(h.capture({requestId:'repeat'}),{code:'already-exists'});
});

for(const preflightWater of [false,true])test(`water transaction remains authoritative with preflight water=${preflightWater}`,async t=>{
 const h=harness(t,{water:true,preflightWater});const r=await h.capture();
 assert.ok(r.waterRewards);assert.ok(r.inventory);assert.ok(r.inventory.items.water>0);
 assert.equal(h.reads.some(r=>r.transactional&&r.path.startsWith(fish.WATER_FISH_CYCLES_COLLECTION+'/')),true);
 assert.equal(h.reads.some(r=>r.path===h.harvestPath),false);
});

test('water preflight changing to land cannot grant water rewards',async t=>{
 const h=harness(t,{water:false,preflightWater:true});const r=await h.capture();
 assert.equal(r.waterRewards,null);assert.equal(r.inventory,null);
 assert.equal(h.reads.some(r=>r.transactional&&r.path.startsWith(fish.WATER_FISH_CYCLES_COLLECTION+'/')),false);
});

test('active fish still grants fish inventory and records its capture',async t=>{
 const h=harness(t,{water:true});const cycle=fish.getWaterFishCycle(h.now);
 const p=fish.getWaterFishStateRef(h.db,cycle,h.pinId).path;
 h.rows.set(p,fish.buildReplacementWaterFishState({pinId:h.pinId,replacedPinId:'previous',cycle,now:h.now}));
 const r=await h.capture();assert.ok(r.waterRewards.fish);assert.equal(r.inventory.items.fish,1);
 assert.equal(r.inventory.items.wheat,5);assert.equal(h.rows.get(p).state,'captured');
});

test('yesterday capture does not require a recapture override',async t=>{
 const h=harness(t);h.rows.set(h.capturePath,{pinId:h.pinId,captureDay:'2026-09-15'});
 assert.equal((await h.capture()).ok,true);
 assert.equal(h.reads.some(r=>r.path===h.overridePath),false);
 assert.equal(h.rows.get(h.capturePath).captureDay,'2026-09-16');
});

test('inventory read failure fails without any committed reward writes',async t=>{
 const h=harness(t,{plantDays:22});
 const original=h.rows.get.bind(h.rows);
 t.mock.method(h.rows,'get',p=>{if(p==='playerMarketInventories/'+h.uid)throw new Error('inventory unavailable');return original(p);});
 await assert.rejects(h.capture(),/inventory unavailable/);assert.equal(h.writes.length,0);
});
