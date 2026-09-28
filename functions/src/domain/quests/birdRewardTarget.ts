import type { DocumentData } from 'firebase-admin/firestore';

// Select from server-owned records, never from a client-supplied bird object.
// The caller commits this patch together with the run's completed flag.
export function planBirdRewardTarget(uid: string, birdId: string, owner: DocumentData | null,
  earned: DocumentData | undefined, xp: number) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !/^[A-Za-z0-9_-]{1,160}$/.test(birdId)
    || !Number.isSafeInteger(xp) || xp < 0) throw Error('Invalid bird reward identity');
  if (!owner || owner.schemaVersion !== 1 || owner.uid !== uid) throw Error('Bird owner needs support');
  const legacy = owner.bird?.id === birdId;
  const bird = legacy ? owner.bird : earned;
  if (!bird || bird.id !== birdId || bird.level !== 1
    || (!legacy && (bird.schemaVersion !== 1 || bird.uid !== uid || bird.species !== 'dove'))
    || !Number.isSafeInteger(bird.xp) || bird.xp < 0
    || !Number.isSafeInteger(bird.questsCompleted) || bird.questsCompleted < 0
    || !Number.isSafeInteger(bird.xp + xp) || !Number.isSafeInteger(bird.questsCompleted + 1)) {
    throw Error('Bird reward record needs support');
  }
  const stats = { xp: bird.xp + xp, questsCompleted: bird.questsCompleted + 1 };
  return { legacy, stats, bird: { ...bird, ...stats } };
}
