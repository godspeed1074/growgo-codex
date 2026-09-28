import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createMapBackedAuthoritativeSourceCache} from '../lib/infrastructure/pins/mapBackedAuthoritativeSourceCache.js';
import {getMapGeometryCell} from '../lib/infrastructure/pins/sharedMapGeometryCache.js';
import {acquireAuthoritativePinSource} from '../lib/domain/pins/authoritativePinAcquisition.js';
import {createAuthoritativePinSourceProvider} from '../lib/domain/pins/authoritativePinSource.js';
import {verifyAuthoritativeCanonicalPin} from '../lib/domain/pins/authoritativePinVerifier.js';
import {generateCanonicalPinsForWay} from '../lib/domain/pins/canonicalPinGenerator.js';
import {isAuthoritativeSourceCacheRecordFresh,shouldRepairNearbySourceCache} from '../lib/domain/pins/authoritativePinCache.js';

const now=new Date('2026-09-11T13:00:00Z');
const reference={generatorVersion:1,sourceType:'osm-way',sourceId:'123456789'};
const pin={latitude:-38.451,longitude:145.241};
const source={...reference,spacingMetres:50,orderedCoordinates:[pin,{latitude:-38.449,longitude:145.241}],fetchedAt:'2026-09-09T12:00:00.000Z'};
const positive={kind:'positive',source,cachedAt:'2026-09-01T00:00:00Z',expiresAt:'2026-10-01T00:00:00Z'};
const negative={kind:'negative',code:'transport-failed',retryable:true,cachedAt:'2026-09-11T12:59:30Z',expiresAt:'2026-09-11T18:59:30Z'};
const gates={enabled:true,cacheReadsEnabled:true,cacheWritesEnabled:true,remoteTransportEnabled:true,allowStaleFallback:true};
const policy={positiveFreshDurationSeconds:604800,positiveStaleLifetimeSeconds:2592000,negativeCacheDurationSeconds:21600,rateLimitedMinimumRetryAfterSeconds:60,rateLimitedMaximumRetryAfterSeconds:21600,maxTransportRequestsPerInvocation:1,automaticRetryCount:0};
function fixture(initial=negative,modify=()=>{}){
 let record=structuredClone(initial),reads=0,transports=0;const writes=[];
 const cache={read:async()=>record,write:async(_,value)=>{record=value;writes.push(value);}};
 const recovered=createMapBackedAuthoritativeSourceCache({cache,pin,player:pin,now:()=>now,
  readCells:async keys=>{reads++;assert.ok(keys.length<=9);assert.equal(keys[0],getMapGeometryCell(pin).key);
   const body={version:1,cellKey:keys[0],fetchedAt:Date.parse(source.fetchedAt),payload:{elements:[{type:'way',id:reference.sourceId,geometry:source.orderedCoordinates.map(p=>({lat:p.latitude,lon:p.longitude}))}]}};
   modify(body);return [{version:1,cellKey:keys[0],data:gzipSync(JSON.stringify(body))}];}});
 const provider=createAuthoritativePinSourceProvider({cache:recovered,acquisitionGates:gates,policy,clock:{now:()=>now},transport:{fetchSource:async()=>{transports++;return {ok:false,code:'transport-failed',retryable:true};}}});
 return {cache:recovered,provider,writes,counts:()=>({reads,transports})};
}

test('outage record is repaired from server map evidence, then next capture needs no extra reads or transport',async()=>{
 const f=fixture();const canonical=generateCanonicalPinsForWay(source)[1];
 const input={pinId:canonical.pinId,submittedLatitude:canonical.latitude,submittedLongitude:canonical.longitude};
 assert.equal((await verifyAuthoritativeCanonicalPin({input,provider:f.provider})).ok,true);
 assert.equal((await verifyAuthoritativeCanonicalPin({input,provider:f.provider})).ok,true);
 assert.deepEqual(f.counts(),{reads:1,transports:0});assert.equal(f.writes.length,1);
 assert.equal(f.writes[0].source.fetchedAt,source.fetchedAt);
 assert.equal(Date.parse(f.writes[0].expiresAt),Date.parse(source.fetchedAt)+2592000000);
});
test('recovery never accepts client-made locations or forged ids',async()=>{
 const canonical=generateCanonicalPinsForWay(source)[0];const f=fixture();
 const result=await verifyAuthoritativeCanonicalPin({input:{pinId:canonical.pinId,submittedLatitude:pin.latitude+.001,submittedLongitude:pin.longitude},provider:f.provider});
 assert.equal(result.ok,false);assert.equal(result.code,'submitted-coordinate-mismatch');
 const forged=await verifyAuthoritativeCanonicalPin({input:{pinId:'made-up',submittedLatitude:pin.latitude,submittedLongitude:pin.longitude},provider:f.provider});
 assert.equal(forged.ok,false);
});
for(const [name,modify] of [
 ['expired',r=>r.fetchedAt=now.getTime()-2592000000],
 ['future',r=>r.fetchedAt=now.getTime()+1],
 ['wrong cell',r=>r.cellKey='v1-0-0'],
 ['wrong version',r=>r.version=2],
 ['wrong source',r=>r.payload.elements[0].id='987654321'],
 ['partial source',r=>r.payload.elements[0].geometry=[{lat:pin.latitude,lon:pin.longitude}]],
 ['bad coordinate',r=>r.payload.elements[0].geometry[0].lat=999],
 ['duplicate source',r=>r.payload.elements.push(r.payload.elements[0])],
 ['incomplete provider response',r=>r.payload.remark='timeout']
]) test(`recovery rejects ${name} evidence`,async()=>{const f=fixture(negative,modify);assert.equal((await f.cache.read(reference)).kind,'negative');assert.equal(f.writes.length,0);});
test('usable positives and explicit missing/invalid sources do not query map cells',async()=>{
 for(const record of [positive,{...negative,code:'not-found'},{...negative,code:'invalid-response'}]){
  const f=fixture(record);assert.deepEqual(await f.cache.read(reference),record);assert.equal(f.counts().reads,0);assert.equal(f.writes.length,0);
 }
});
for(const code of ['timeout','rate-limited','transport-failed','source-incomplete']) test(`stale valid geometry survives ${code} without a destructive negative overwrite`,async()=>{
 const writes=[];
 const result=await acquireAuthoritativePinSource({reference,gates,policy,clock:{now:()=>now},cache:{read:async()=>positive,write:async(_,r)=>writes.push(r)},transport:{fetchSource:async()=>({ok:false,code,retryable:true})}});
 assert.equal(result.ok,true);assert.equal(result.cacheStatus,'stale-fallback');assert.equal(writes.length,0);
});
test('expired evidence and disabled fallback still cannot authorize a capture',async()=>{
 for(const [record,enabled] of [[{...positive,expiresAt:'2026-09-10T00:00:00Z'},true],[positive,false]]){
  const result=await acquireAuthoritativePinSource({reference,gates:{...gates,allowStaleFallback:enabled},policy,clock:{now:()=>now},cache:{read:async()=>record,write:async()=>{}},transport:{fetchSource:async()=>({ok:false,code:'transport-failed',retryable:true})}});
  assert.equal(result.ok,false);
 }
});
test('legacy outage negatives expire after one minute; 429 backoff and explicit missing remain respected',()=>{
 const fresh=r=>isAuthoritativeSourceCacheRecordFresh({record:r,now,positiveFreshDurationSeconds:604800});
 assert.equal(fresh(negative),true);
 assert.equal(fresh({...negative,cachedAt:'2026-09-11T12:59:00Z'}),false);
 assert.equal(fresh({...negative,code:'rate-limited',cachedAt:'2026-09-11T12:58:00Z'}),true);
 assert.equal(fresh({...negative,code:'not-found',cachedAt:'2026-09-11T12:58:00Z'}),true);
 assert.equal(fresh({...positive,cachedAt:'2026-09-11T00:00:00Z',expiresAt:'2026-09-11T12:59:00Z'}),false);
});
test('map refresh repairs failure/expired records but never rewrites usable positives on each pan',()=>{
 assert.equal(shouldRepairNearbySourceCache(null,now),true);
 assert.equal(shouldRepairNearbySourceCache(negative,now),true);
 assert.equal(shouldRepairNearbySourceCache(positive,now),false);
 assert.equal(shouldRepairNearbySourceCache({...positive,expiresAt:'2026-09-10T00:00:00Z'},now),true);
});
