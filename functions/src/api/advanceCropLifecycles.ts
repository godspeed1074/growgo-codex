import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../domain/market/marketCatalog";
import {
  hasCropHarvestWindowEnded
} from "../domain/world/cropLifecycle";
import {
  readSharedBasePinState,
  serializeSharedBasePinStateForStorage
} from "../domain/world/sharedWorld";
import { getAdminFirestore } from "../firebaseAdmin";
import { readDueCropLifecycleStates } from "../infrastructure/dueCropLifecycleReads";

export async function advanceCropLifecyclesAt(now: Date = new Date()) {
  const db = getAdminFirestore();
  const candidates = await readDueCropLifecycleStates(db, now);

  let replanted = 0;
  let cleared = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const outcome = await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(candidate.ref);
      const current = readSharedBasePinState(currentSnapshot.data());
      if (!current?.plant || !hasCropHarvestWindowEnded(current.plant, now)) {
        return "skipped" as const;
      }

      if (!current.replantEnabled) {
        transaction.set(candidate.ref, serializeSharedBasePinStateForStorage({
          ...current,
          plant: null,
          updatedAt: now
        }));
        return "cleared" as const;
      }

      const inventoryRef = db.collection("playerMarketInventories").doc(current.ownerUid);
      const inventorySnapshot = await transaction.get(inventoryRef);
      const inventory = readMarketInventory(inventorySnapshot.data());
      const seedCount = Number(inventory[current.plant.seedId] || 0);

      if (seedCount < 1) {
        transaction.set(candidate.ref, serializeSharedBasePinStateForStorage({
          ...current,
          plant: null,
          updatedAt: now
        }));
        return "cleared" as const;
      }

      const nextInventory = {
        ...inventory,
        [current.plant.seedId]: seedCount - 1
      };
      transaction.set(candidate.ref, serializeSharedBasePinStateForStorage({
        ...current,
        plant: {
          seedId: current.plant.seedId,
          plantedAt: now,
          miracleGrownAt: null
        },
        updatedAt: now
      }));
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextInventory,
        updatedAt: Timestamp.fromDate(now),
        ...(inventorySnapshot.exists ? {} : { initializedAt: Timestamp.fromDate(now), import: "crop-lifecycle-v1" })
      });
      return "replanted" as const;
    });

    if (outcome === "replanted") replanted += 1;
    else if (outcome === "cleared") cleared += 1;
    else skipped += 1;
  }

  return { replanted, cleared, skipped };
}

export const advanceCropLifecycles = onSchedule(
  {
    region: runtimeConfig.region,
    schedule: "*/15 * * * *",
    timeZone: "Etc/UTC"
  },
  async () => {
    const result = await advanceCropLifecyclesAt();
    console.info("Crop lifecycles advanced", result);
  }
);
