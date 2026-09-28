import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { planLeonardMaterials: plan } = createRequire(import.meta.url)('../lib/domain/quests/leonardMaterials.js');
const initial = () => ({uid:'owner',runId:'run',stage:'materials',coins:500,sticks:6,cotton:0,egg:1,nest:0,cottonPurchased:false,hatchAt:null});
const apply = (s,a,t=1000) => plan(s,'owner','run',a,t);
test('purchase debits exactly 300 once, adds six cotton, preserves input',()=>{
 const s=initial(), n=apply(s,'buy-cotton');
 assert.equal(n.coins,200);assert.equal(n.cotton,6);assert.equal(s.coins,500);
 assert.deepEqual(apply(n,'buy-cotton'),n);
});
test('insufficient funds, wrong player, wrong run and invalid state fail',()=>{
 assert.throws(()=>apply({...initial(),coins:299},'buy-cotton'));
 assert.throws(()=>plan(initial(),'other','run','buy-cotton',1000));
 assert.throws(()=>plan(initial(),'owner','old-run','buy-cotton',1000));
 for(const coins of [NaN,-1,1.5])assert.throws(()=>apply({...initial(),coins},'buy-cotton'));
});
test('recipe required; craft consumes exact materials once and does not start timer',()=>{
 const s=apply(initial(),'buy-cotton');assert.throws(()=>apply(s,'craft-nest'));
 assert.throws(()=>apply({...s,stage:'craft',sticks:5},'craft-nest'));
 const n=apply({...s,stage:'craft'},'craft-nest');
 assert.equal(n.sticks,0);assert.equal(n.cotton,0);assert.equal(n.nest,1);assert.equal(n.hatchAt,null);
 assert.deepEqual(apply(n,'craft-nest'),n);
});
test('use consumes nest/egg; exact 24 hours survives repeats and reload',()=>{
 const n=apply({...apply(initial(),'buy-cotton'),stage:'craft'},'craft-nest');
 const ready=apply(n,'use-nest');assert.equal(ready.hatchAt,86401000);
 assert.equal(ready.egg,0);assert.equal(ready.nest,0);
 assert.deepEqual(apply(JSON.parse(JSON.stringify(ready)),'use-nest',9000),ready);
 assert.deepEqual(apply(ready,'buy-cotton'),ready);
 assert.deepEqual(apply(ready,'craft-nest'),ready);
});
