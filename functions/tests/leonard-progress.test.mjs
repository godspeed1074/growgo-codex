import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {advanceLeonardRun:advance}=createRequire(import.meta.url)('../lib/domain/quests/leonardProgress.js');
const initial=()=>({uid:'owner',runId:'run',stage:'meet-leonard',coins:500,sticks:0,cotton:0,egg:0,nest:0,cottonPurchased:false,hatchAt:null,
 locations:{eggPins:Array.from({length:6},(_,i)=>`egg${i}`),stickPins:Array.from({length:6},(_,i)=>`stick${i}`)},collectedEggPins:[],collectedStickPins:[]});
const act=(s,kind,extra={})=>advance(s,'owner','run',{stage:s.stage,kind,...extra},1000);
test('complete chain reaches incubation, both material orders work',()=>{
 for(const cottonFirst of [true,false]){
 let s=act(initial(),'talk');for(let i=0;i<6;i++)s=act(s,'collect-egg',{pinId:`egg${i}`});
 assert.equal(s.stage,'return-eggs');s=act(s,'talk');assert.equal(s.egg,1);
 if(cottonFirst)s=act(s,'buy-cotton');for(let i=0;i<6;i++)s=act(s,'collect-stick',{pinId:`stick${i}`});
 if(!cottonFirst)s=act(s,'buy-cotton');s=act(s,'talk');assert.equal(s.stage,'craft');
 s=act(s,'craft-nest');s=act(s,'use-nest');assert.equal(s.stage,'incubating');assert.equal(s.hatchAt,86401000);assert.equal(s.coins,200);
 }
});
test('duplicates, stale talk, wrong pins and premature crafting cannot skip stages',()=>{
 let s=act(initial(),'talk');const stale={stage:'meet-leonard',kind:'talk'};
 s=act(s,'collect-egg',{pinId:'egg0'});assert.deepEqual(act(s,'collect-egg',{pinId:'egg0'}),s);
 assert.deepEqual(advance(s,'owner','run',stale,1000),s);
 assert.throws(()=>act(s,'collect-egg',{pinId:'other'}));assert.throws(()=>act(s,'craft-nest'));
 assert.throws(()=>advance(s,'other','run',{stage:s.stage,kind:'talk'},1000));
});
