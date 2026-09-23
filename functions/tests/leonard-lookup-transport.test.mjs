import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const {createLeonardLookupTransport:create,retryDelay,reserveLeonardStart:reserve,freshLeonardSource:fresh,LEONARD_REQUEST_TIMEOUT_MS}=createRequire(import.meta.url)('../lib/domain/quests/leonardLookupTransport.js');
const payload=(now=Date.now())=>({elements:[],osm3s:{timestamp_osm_base:new Date(now).toISOString()}});
function fixture(){const values=new Map();const doc=(c,id)=>({key:c+'/'+id,get:async()=>({data:()=>values.get(c+'/'+id)}),set:async(v,o)=>values.set(c+'/'+id,o?.merge?{...values.get(c+'/'+id),...v}:v)});const db={collection:c=>({doc:id=>doc(c,id)}),runTransaction:async fn=>fn({get:async ref=>({data:()=>values.get(ref.key)}),set:(ref,v,o)=>values.set(ref.key,o?.merge?{...values.get(ref.key),...v}:v)})};return db;}
const signal=()=>AbortSignal.timeout(1000);
test('successful identical lookups are cached across transport instances',async()=>{
 const db=fixture();let calls=0;const http=async(_url,options)=>{calls++;assert.match(options.headers['user-agent'],/https:\/\/growgo-account-profile.vercel.app/);return Response.json(payload(1000));};
 await create(db,http,()=>1000)('query',signal());await create(db,http,()=>2000)('query',signal());assert.equal(calls,1);
});
test('406 falls back once; 429 never retries and honors cooldown',async()=>{
 const db=fixture();let calls=0;const transport=create(db,async()=>{calls++;return new Response('',{status:calls===1?406:429,headers:{'retry-after':'120'}});},()=>1000,{endpoints:['https://one.test','https://two.test']});
 await assert.rejects(transport('query',signal()));assert.equal(calls,2);
 await assert.rejects(create(db,async()=>{throw Error('should not fetch');},()=>1000,{joinWindowMs:0})('query',signal()));assert.equal(calls,2);
 assert.equal(retryDelay('120',1000),120000);assert.equal(retryDelay('bogus',1000),60000);
});
test('explicit start joins an in-flight pre-warm instead of returning busy',async()=>{
 const db=fixture();let release;const source=create(db,async()=>new Promise(resolve=>{release=()=>resolve(Response.json(payload(1000)));}),()=>1000);
 const prewarm=source('query',signal());await new Promise(resolve=>setImmediate(resolve));
 const joined=await create(db,async()=>{throw Error('joined lookup must not fetch again');},()=>1000,{joinWindowMs:100,joinPollMs:1,sleep:async()=>{release();}})('query',signal());
 assert.deepEqual(joined,payload(1000));await prewarm;
});
test('partial data is not cached as success; starts throttled per player',async()=>{
 const db=fixture();await assert.rejects(create(db,async()=>Response.json({elements:[],remark:'timeout'}),()=>1000)('query',signal()));
 await reserve(db,'a',1000);await assert.rejects(reserve(db,'a',1001));await reserve(db,'b',1001);await reserve(db,'a',61001);
});
test('network failure uses backup but cancelled search never retries',async()=>{
 let calls=0;const http=async()=>{if(++calls===1)throw Error('network');return Response.json(payload());};
 await create(fixture(),http)('query',signal());assert.equal(calls,2);
 const c=new AbortController();c.abort();calls=0;
 await assert.rejects(create(fixture(),async()=>{calls++;throw Error('aborted');})('query',c.signal));assert.equal(calls,0);
});
test('rejects stale, invalid, missing and future map timestamps',()=>{
 const now=Date.now();assert.equal(fresh(payload(now),now),true);
 for(const p of [payload(now-86400000),payload(now+300001),{elements:[]},{osm3s:{timestamp_osm_base:'bad'}}])assert.equal(fresh(p,now),false);
 assert.ok(LEONARD_REQUEST_TIMEOUT_MS<=40000);
});
test('stale primary uses fresh backup; stale backup is never accepted',async()=>{
 const now=Date.now();let calls=0;
 await create(fixture(),async()=>Response.json(payload(++calls===1?now-86400001:now)),()=>now)('query',signal());assert.equal(calls,2);
 await assert.rejects(create(fixture(),async()=>Response.json(payload(now-86400001)),()=>now)('query',signal()),/unavailable/);
});
test('source age limits cache reuse even when cache was populated recently',async()=>{
 const db=fixture(),start=Date.now();let now=start,calls=0;
 const run=create(db,async()=>{calls++;return Response.json(payload(now));},()=>now);
 await run('query',signal());now+=86400001;await run('query',signal());assert.equal(calls,2);
});
