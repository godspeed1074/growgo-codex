import type { Firestore, Transaction } from 'firebase-admin/firestore';

// Internal only, not deployed. The earned bird is separate from the existing
// single-bird pilot document, which this service never reads or overwrites.
export async function hatchLeonardDove(db:Firestore,input:{uid:string;runId:string},
  verify:(tx:Transaction)=>Promise<void>,clock=()=>Date.now()) {
  for(const id of [input.uid,input.runId])if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))throw Error('Invalid quest identity');
  const quest=db.collection('leonardIntroductionPlayers').doc(input.uid);
  // Stable per-player reward ID: replaying or resetting a quest must not mint birds.
  const bird=db.collection('playerBirdhouses').doc(input.uid).collection('birds').doc('leonard-introduction-dove');
  return db.runTransaction(async tx=>{
    const qs=await tx.get(quest),bs=await tx.get(bird);
    if(!qs.exists)throw Error('Introduction not started');
    const q=qs.data()!;
    if(q.schemaVersion!==1||q.questId!=='a-little-help-from-my-friends'||q.uid!==input.uid||q.runId!==input.runId)throw Error('Wrong introduction run');
    await verify(tx);
    if(bs.exists){
      const b=bs.data()!;
      if(b.uid!==input.uid||b.sourceRunId!==input.runId||q.stage!=='completed'
        ||q.rewardBirdId!=='leonard-introduction-dove')throw Error('Existing dove reward needs support');
      return {awarded:false,bird:b};
    }
    const now=clock();
    if(!Number.isSafeInteger(now)||now<0)throw Error('Invalid server clock');
    if(q.stage!=='incubating'||!Number.isSafeInteger(q.hatchAt)||q.hatchAt<86400000
      ||q.egg!==0||q.nest!==0)throw Error('No incubating egg');
    if(now<q.hatchAt)throw Error('Your dove is not ready to hatch');
    const earned={schemaVersion:1,id:'leonard-introduction-dove',uid:input.uid,
      species:'dove',level:1,xp:0,questsCompleted:0,deploymentId:null,
      sourceQuestId:q.questId,sourceRunId:input.runId,hatchedAt:now};
    tx.create(bird,earned);
    tx.update(quest,{stage:'completed',completedAt:now,rewardBirdId:earned.id});
    return {awarded:true,bird:earned};
  });
}
