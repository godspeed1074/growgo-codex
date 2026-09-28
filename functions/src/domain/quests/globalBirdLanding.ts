import { randomInt } from "node:crypto";
import { Timestamp, type Firestore, type Transaction, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { CROP_STAGE_MILLISECONDS } from "../world/cropLifecycle";
import { readSharedBasePinState, sharedWorldDocumentId, SHARED_BASE_PIN_STATES_COLLECTION } from "../world/sharedWorld";
import { calculateHaversineDistanceMetres } from "../pins/canonicalPinGenerator";
import { parseCanonicalPinId } from "../pins/canonicalPinId";
import { eligibleBirdPlot } from "./sharedBirdDeployment";

export const BIRD_LANDING_WINDOW_LIMIT = 32;

/**
 * Random, bounded samples from existing server-owned crop records, worldwide.
 * Single-field time indexes exclude empty plots and old crops without scanning
 * the world. The Miracle Grow window also covers legacy plants whose plantedAt
 * was not rebased. This is random sampling, not equal-odds sampling of every plot.
 * Called on explicit deploy or an expired visit's throttled automatic move.
 * Normal map refreshes never perform this search while a visit is active.
 */
export async function chooseGlobalBirdLanding({ db, tx, ownerUid, now, excludePinId, roll = randomInt }: {
  db: Firestore; tx: Transaction; ownerUid: string; now: Date; excludePinId?: string; roll?: (max: number) => number;
}) {
  const samples = new Map<string, QueryDocumentSnapshot>();
  for (const [field, duration] of [
    ["plant.plantedAt", CROP_STAGE_MILLISECONDS * 4],
    ["plant.miracleGrownAt", CROP_STAGE_MILLISECONDS]
  ] as const) {
    const earliest = now.getTime() - duration;
    const pivot = Timestamp.fromMillis(earliest + 1 + roll(duration));
    const query = db.collection(SHARED_BASE_PIN_STATES_COLLECTION)
      .where(field, ">", Timestamp.fromMillis(earliest)).where(field, "<=", Timestamp.fromDate(now)).orderBy(field);
    const first = await tx.get(query.startAt(pivot).limit(BIRD_LANDING_WINDOW_LIMIT));
    for (const doc of first.docs) samples.set(doc.id, doc);
    if (first.size < BIRD_LANDING_WINDOW_LIMIT) {
      const wrapped = await tx.get(query.endBefore(pivot).limit(BIRD_LANDING_WINDOW_LIMIT - first.size));
      for (const doc of wrapped.docs) samples.set(doc.id, doc);
    }
  }
  const choices = [...samples.values()];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = roll(i + 1); [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  for (const doc of choices) {
    const plot = readSharedBasePinState(doc.data());
    if (!plot || plot.pinId === excludePinId || !eligibleBirdPlot(plot, ownerUid, now) || doc.id !== sharedWorldDocumentId(plot.pinId)
      || Math.abs(plot.latitude) > 90 || Math.abs(plot.longitude) > 180
      || (plot.plant?.miracleGrownAt && plot.plant.miracleGrownAt > now)) continue;
    try { parseCanonicalPinId(plot.pinId); } catch { continue; }
    // Ownership is server-only, but recheck the stored base classification too.
    // No map generation, source-geometry fetch or player capture reads are needed.
    const base = (await tx.get(db.collection("authoritativeWaterPinStates").doc(plot.pinId))).data();
    if (base?.pinId !== plot.pinId || base.type !== "base" || !Number.isFinite(base.latitude) || !Number.isFinite(base.longitude)
      || Math.abs(base.latitude) > 90 || Math.abs(base.longitude) > 180
      || calculateHaversineDistanceMetres(plot, { latitude: base.latitude, longitude: base.longitude }) > 1) continue;
    return { id: plot.pinId, lat: plot.latitude, lng: plot.longitude };
  }
  return null;
}
