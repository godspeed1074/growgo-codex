import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const admin=require('../lib/firebaseAdmin.js');
const sessions=require('../lib/domain/players/activeDeviceSession.js');
const security=require('../lib/security/requireAuthenticated.js');
const invites=require('../lib/security/requireInvitedUserAccess.js');
const {Timestamp}=require('firebase-admin/firestore');
const {buildDefaultPlayerDocument}=require('../lib/domain/players/playerStore.js');

function harness(t,{seeded=true,restocked=true}={}){
 const rows=new Map(),reads=[];let fail=false,tail=Promise.resolve(),checks=0;
 const ref=p=>({path:p,id:p.split('/').at(-1),doc:id=>ref(p+'/'+id),get:async()=>snap(p),
  where:(...f)=>query(p,[f])});
 const query=(p,filters)=>({path:p,filters,where:(...f)=>query(p,[...filters,f]),limit:()=>query(p,filters),get:async()=>querySnap(p,filters)});
 const snap=p=>{reads.push(p);const value=rows.get(p);return {ref:ref(p),id:p.split('/').at(-1),exists:!!value,data:()=>value};};
 const querySnap=(p,filters)=>({docs:[...rows].filter(([key,v])=>key.startsWith(p+'/')&&filters.every(([f,op,value])=>op==='=='&&v[f]===value)).map(([key])=>snap(key))});
 const db={collection:ref,runTransaction:fn=>{
  const result=tail.then(async()=>{const pending=[];
   const tx={get:async r=>r.filters?querySnap(r.path,r.filters):snap(r.path)};
   for(const method of ['create','set','update'])tx[method]=(r,v)=>pending.push([method,r.path,v]);
   const result=await fn(tx);if(fail)throw Error('simulated commit failure');
   for(const [method,p]of pending)if(method==='create'&&rows.has(p))throw Error('duplicate create');
   for(const [method,p,v]of pending)rows.set(p,method==='update'?{...rows.get(p),...v}:v);
   return result;
  });tail=result.catch(()=>{});return result;
 }};
 t.mock.method(admin,'getAdminFirestore',()=>db);
 t.mock.method(security,'requireAuthenticated',()=>({uid:'market-test'}));
 t.mock.method(security,'requireAppCheckIfEnabled',()=>{});
 t.mock.method(invites,'requireInvitedUserAccess',()=>{});
 t.mock.method(sessions,'requireActiveDeviceSessionIfEnabled',async()=>{checks++;return {enforced:false};});
 rows.set('players/market-test',{...buildDefaultPlayerDocument(Timestamp.now()),profileComplete:true,coins:1000,
  displayName:'Test',gender:'male',country:'Australia',region:'oceania',state:'Victoria'});
 rows.set('playerMarketInventories/market-test',{schemaVersion:1,items:{wheat:0}});
 const marker='marketplaceSystem/defaults-v1',restock='marketplaceSystem/npc-wheat-restock-20260906-v1',listing='marketplaceListings/npc-wheat-20';
 if(seeded){rows.set(marker,{schemaVersion:1});rows.set(listing,{schemaVersion:1,itemId:'wheat',price:20,quantity:7,sellerUid:'npc',status:'active',createdAt:Timestamp.now()});}
 if(restocked)rows.set(restock,{schemaVersion:1});
 delete require.cache[require.resolve('../lib/api/marketplace.js')];
 const api=require('../lib/api/marketplace.js');
 return {rows,reads,marker,restock,listing,checks:()=>checks,fail:v=>fail=v,
  snapshot:()=>api.getMarketplaceSnapshotHandler({data:{}}),
  purchase:data=>api.purchaseMarketplaceListingHandler({data})};
}
test('warm setup skips setup reads but stock, inventory and security remain fresh',async t=>{
 const h=harness(t);await h.snapshot();const setupReads=h.reads.filter(x=>x.startsWith('marketplaceSystem')).length;
 h.rows.get(h.listing).quantity=3;h.rows.get(h.listing).price=21;
 h.rows.set('playerMarketInventories/market-test',{items:{wheat:9}});
 const r=await h.snapshot();assert.equal(r.listings[0].quantity,3);assert.equal(r.listings[0].price,21);assert.equal(r.inventory.items.wheat,9);
 assert.equal(h.reads.filter(x=>x.startsWith('marketplaceSystem')).length,setupReads);assert.equal(h.checks(),2);
});
test('concurrent callers apply the one-off restock once, preserving existing wheat',async t=>{
 const h=harness(t,{restocked:false});await Promise.all([h.snapshot(),h.snapshot(),h.snapshot()]);
 assert.equal(h.rows.get(h.listing).quantity,107);assert.ok(h.rows.has(h.restock));
});
test('failed restock transaction does not suppress a later retry or partially award stock',async t=>{
 const h=harness(t,{restocked:false});h.fail(true);await assert.rejects(h.snapshot(),/commit failure/);
 assert.equal(h.rows.get(h.listing).quantity,7);assert.equal(h.rows.has(h.restock),false);
 h.fail(false);await h.snapshot();assert.equal(h.rows.get(h.listing).quantity,107);
});
test('initial seeding preserves the existing two-stage setup and subsequent single restock',async t=>{
 const h=harness(t,{seeded:false,restocked:false});await h.snapshot();
 const quantity=h.rows.get(h.listing).quantity;assert.ok(h.rows.has(h.marker));assert.equal(h.rows.has(h.restock),false);
 await h.snapshot();assert.equal(h.rows.get(h.listing).quantity,quantity+100);
 await h.snapshot();assert.equal(h.rows.get(h.listing).quantity,quantity+100);
});
test('warm setup does not bypass purchase stock checks or replay protection',async t=>{
 const h=harness(t);await h.snapshot();
 const request={requestId:'market-cost-test-001',itemId:'wheat',price:20,quantity:2};
 await h.purchase(request);assert.equal(h.rows.get(h.listing).quantity,5);
 assert.equal(h.rows.get('players/market-test').coins,960);
 await h.purchase(request);assert.equal(h.rows.get(h.listing).quantity,5);assert.equal(h.rows.get('players/market-test').coins,960);
 h.rows.get(h.listing).quantity=0;
 await assert.rejects(h.purchase({...request,requestId:'market-cost-test-002'}),{code:'failed-precondition'});
 assert.equal(h.rows.get('players/market-test').coins,960);
});
