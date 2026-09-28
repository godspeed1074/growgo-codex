import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { asObject, assertAllowedKeys, requireFiniteNumber } from "../../validation/requestValidation";

export const MAP_DIRECTORY_VERSIONS = "mapDirectoryVersions";
export function markMapDirectoryChanged(transaction: Transaction, db: Firestore, directory: "bingles" | "markets") {
  // Small public invalidation signal, never player details or balances.
  transaction.set(db.collection(MAP_DIRECTORY_VERSIONS).doc(directory), { updatedAt: FieldValue.serverTimestamp() });
}

export interface MapViewport { north: number; south: number; west: number; east: number }
export function readMapViewport(value: unknown): MapViewport | null {
  if (value === undefined) return null; // Backward-compatible with older clients.
  const data = asObject(value, "viewport");
  assertAllowedKeys(data, ["north", "south", "west", "east"], "viewport");
  const north = requireFiniteNumber(data.north, "north", -90, 90);
  const south = requireFiniteNumber(data.south, "south", -90, north);
  return { north, south, west: requireFiniteNumber(data.west, "west", -180, 180),
    east: requireFiniteNumber(data.east, "east", -180, 180) };
}

export async function readScarecrowsInViewport(db: Firestore, viewport: MapViewport | null, limit = 200) {
  const active = db.collection("worldScarecrows").where("status", "==", "active");
  if (!viewport) return (await active.limit(limit).get()).docs;
  const longitudeRanges = viewport.west <= viewport.east
    ? [[viewport.west, viewport.east]] : [[viewport.west, 180], [-180, viewport.east]];
  const pages = await Promise.all(longitudeRanges.map(([west, east]) => active
    .where("latitude", ">=", viewport.south).where("latitude", "<=", viewport.north)
    .where("longitude", ">=", west).where("longitude", "<=", east)
    .orderBy("latitude").orderBy("longitude").limit(limit).get()));
  return [...new Map(pages.flatMap((page) => page.docs).map((doc) => [doc.id, doc])).values()].slice(0, limit);
}
