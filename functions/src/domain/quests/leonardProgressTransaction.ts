import { Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { advanceLeonardRun, type LeonardAction, type LeonardRun } from './leonardProgress';

// Internal service, not a callable. verify must authenticate pilot eligibility
// and validate action-specific location/evidence with transaction reads only.
export async function commitLeonardProgress(db: Firestore,
  input: {uid:string;runId:string;action:LeonardAction},
  verify:(tx:Transaction, state:LeonardRun, action:LeonardAction)=>Promise<void>,
  clock=()=>Date.now(),replay=false) {
  for(const value of [input.uid,input.runId])if(!/^[A-Za-z0-9_-]{1,128}$/.test(value))throw Error('Invalid quest identity');
  const player=db.collection('players').doc(input.uid);
  const quest=db.collection(replay?'leonardIntroductionReplays':'leonardIntroductionPlayers').doc(input.uid);
  return db.runTransaction(async tx=>{
    const ps=await tx.get(player),qs=await tx.get(quest);
    if(!ps.exists||!qs.exists)throw Error('Introduction not started');
    const saved=qs.data()!;
    if(replay&&(saved.replay!==true||input.action.kind==='use-nest'))throw Error('Test replay stops before incubation. Your original egg is safe.');
    if(saved.schemaVersion!==1||saved.questId!=='a-little-help-from-my-friends')throw Error('Unsupported introduction');
    const state:LeonardRun={uid:saved.uid,runId:saved.runId,stage:saved.stage,
      coins:replay?saved.testCoins:ps.data()!.coins,sticks:saved.sticks,cotton:saved.cotton,egg:saved.egg,nest:saved.nest,
      cottonPurchased:saved.cottonPurchased,hatchAt:saved.hatchAt,locations:saved.locations,
      collectedEggPins:saved.collectedEggPins,collectedStickPins:saved.collectedStickPins};
    const now=clock();
    const next=advanceLeonardRun(state,input.uid,input.runId,input.action,now);
    await verify(tx,state,input.action);
    const changed=JSON.stringify(next)!==JSON.stringify(state);
    if(changed){
      if(!replay&&next.coins!==state.coins)tx.update(player,{coins:next.coins,updatedAt:Timestamp.fromMillis(now)});
      tx.update(quest,{stage:next.stage,sticks:next.sticks,cotton:next.cotton,egg:next.egg,
        ...(replay?{testCoins:next.coins}:{}),
        nest:next.nest,cottonPurchased:next.cottonPurchased,hatchAt:next.hatchAt,
        collectedEggPins:next.collectedEggPins,collectedStickPins:next.collectedStickPins});
    }
    return {changed,state:next};
  });
}
