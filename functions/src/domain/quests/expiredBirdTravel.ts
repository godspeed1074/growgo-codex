import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { chooseGlobalBirdLanding } from "./globalBirdLanding";
import { DOVE_ENCOUNTER_MS } from "./t1BirdQuests";
import { SHARED_DOVE_COLLECTION, SHARED_DOVE_DOCUMENT, shouldMoveExpiredBird, type SharedDoveDeployment } from "./sharedBirdDeployment";

export const BIRD_LANDING_RETRY_MS = 5 * 60 * 1000;

/** Lazy server-authoritative travel, driven by the existing authenticated bird
 * refresh. No scheduled global scans or timer service. Recheck the visit inside
 * its own transaction before searching; concurrent refreshes cannot move it twice.
 */
export async function moveExpiredBirdVisit(db: Firestore, expectedId: string, now = new Date()) {
  const ref = db.collection(SHARED_DOVE_COLLECTION).doc(SHARED_DOVE_DOCUMENT);
  const nextId = randomUUID();
  return db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data() as SharedDoveDeployment | undefined;
    if (!current || current.id !== expectedId || !shouldMoveExpiredBird(current, now.getTime())) return current || null;
    // Do not resurrect deleted birds or transfer ownership. Only the visit moves.
    const owner = (await tx.get(db.collection("birdQuestPlayers").doc(current.ownerUid))).data();
    if (owner?.schemaVersion !== 1 || owner.uid !== current.ownerUid || owner.bird?.id !== current.birdId || owner.bird?.level !== 1) return null;
    const landing = await chooseGlobalBirdLanding({ db, tx, ownerUid: current.ownerUid, now, excludePinId: current.landing.id });
    if (!landing) {
      const nextLandingAttemptAt = now.getTime() + BIRD_LANDING_RETRY_MS;
      tx.update(ref, { nextLandingAttemptAt });
      return { ...current, nextLandingAttemptAt };
    }
    const next: SharedDoveDeployment = { schemaVersion: 1, id: nextId, birdId: current.birdId,
      ownerUid: current.ownerUid, ownerName: current.ownerName, landing, createdAt: now.getTime(),
      expiresAt: now.getTime() + DOVE_ENCOUNTER_MS, status: "deployed" };
    tx.set(ref, next);
    return next;
  });
}
