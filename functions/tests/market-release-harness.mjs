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

export function harness(t,{seeded=true,restocked=true}={}){
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
  create:data=>api.createMarketplaceListingHandler({data}),
  purchase:data=>api.purchaseMarketplaceListingHandler({data})};
}
