import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { planLeonardMaterials, type LeonardMaterials, type LeonardMaterialAction } from './leonardMaterials';

// Not a public endpoint. Caller must supply trusted UID, server clock and a
// verifier that checks pilot access plus the relevant NPC/location/recipe.
// The verifier runs inside the transaction and must perform reads only.
export async function commitLeonardMaterialAction(db: Firestore, input: {
  uid: string; runId: string; action: LeonardMaterialAction;
}, verify: (tx: Transaction, state: LeonardMaterials) => Promise<void>, now = () => Date.now()) {
  for (const value of [input.uid, input.runId]) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw Error('Invalid quest identity');
  }
  const player = db.collection('players').doc(input.uid);
  const quest = db.collection('leonardIntroductionPlayers').doc(input.uid);
  return db.runTransaction(async tx => {
    const playerSnap = await tx.get(player);
    const questSnap = await tx.get(quest);
    if (!playerSnap.exists || !questSnap.exists) throw Error('Player or introduction not started');
    const saved = questSnap.data()!;
    if (saved.schemaVersion !== 1 || saved.uid !== input.uid || saved.runId !== input.runId) throw Error('Quest version or run mismatch');
    const state: LeonardMaterials = {
      uid: saved.uid, runId: saved.runId, stage: saved.stage,
      coins: playerSnap.data()!.coins, sticks: saved.sticks, cotton: saved.cotton,
      egg: saved.egg, nest: saved.nest, cottonPurchased: saved.cottonPurchased,
      hatchAt: saved.hatchAt
    };
    const next = planLeonardMaterials(state, input.uid, input.runId, input.action, now());
    await verify(tx, state);
    const changed = JSON.stringify(next) !== JSON.stringify(state);
    if (changed) {
      // Narrow updates preserve unrelated player progress, inventory and buffs.
      if (next.coins !== state.coins) tx.update(player, { coins: next.coins });
      tx.update(quest, {
        stage: next.stage, sticks: next.sticks, cotton: next.cotton,
        egg: next.egg, nest: next.nest, cottonPurchased: next.cottonPurchased,
        hatchAt: next.hatchAt
      });
    }
    return { changed, state: next };
  });
}
