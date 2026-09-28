import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {commitLeonardProgress:commit}=createRequire(import.meta.url)('../lib/domain/quests/leonardProgressTransaction.js');
function fixture(){
 const rows={players:{coins:500,xp:999},leonardIntroductionPlayers:{schemaVersion:1,questId:'a-little-help-from-my-friends',uid:'owner',runId:'run',stage:'meet-leonard',sticks:0,cotton:0,egg:0,nest:0,cottonPurchased:false,hatchAt:null,collectedEggPins:[],collectedStickPins:[],locations:{eggPins:Array.from({length:6},(_,i)=>`e${i}`),stickPins:Array.from({length:6},(_,i)=>`s${i}`)}}};
 const db={collection:c=>({doc:()=>c}),async runTransaction(fn){const pending=[];const r=await fn({get:async c=>({exists:true,data:()=>structuredClone(rows[c])}),update:(c,p)=>pending.push([c,p])});for(const[c,p]of pending)Object.assign(rows[c],p);return r;}};
 return {db,rows};
}
test('persist and resume complete path to incubation; replay cannot grant another egg',async()=>{
 const f=fixture();const send=async(kind,extra={})=>commit(f.db,{uid:'owner',runId:'run',action:{stage:f.rows.leonardIntroductionPlayers.stage,kind,...extra}},async()=>{},()=>1000);
 await send('talk');for(let i=0;i<6;i++)await send('collect-egg',{pinId:`e${i}`});
 await send('talk');assert.equal(f.rows.leonardIntroductionPlayers.egg,1);
 const replay=await commit(f.db,{uid:'owner',runId:'run',action:{stage:'return-eggs',kind:'talk'}},async()=>{},()=>1000);
 assert.equal(replay.changed,false);
 await send('buy-cotton');for(let i=0;i<6;i++)await send('collect-stick',{pinId:`s${i}`});
 await send('talk');await send('craft-nest');await send('use-nest');
 assert.equal(f.rows.leonardIntroductionPlayers.stage,'incubating');
 assert.equal(f.rows.leonardIntroductionPlayers.hatchAt,86401000);
 assert.equal(f.rows.players.coins,200);assert.equal(f.rows.players.xp,999);assert.ok(f.rows.players.updatedAt);
});
test('failed verifier leaves saved progress untouched',async()=>{
 const f=fixture(),before=structuredClone(f.rows);
 await assert.rejects(commit(f.db,{uid:'owner',runId:'run',action:{stage:'meet-leonard',kind:'talk'}},async()=>{throw Error('Not near Leonard');}));
 assert.deepEqual(f.rows,before);
});
