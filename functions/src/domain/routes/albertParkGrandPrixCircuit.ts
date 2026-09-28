import { Timestamp, type Firestore } from "firebase-admin/firestore";

export const ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID =
  "albert-park-grand-prix-circuit" as const;
export const ALBERT_PARK_GRAND_PRIX_CIRCUIT_TITLE =
  "Albert Park Grand Prix Circuit" as const;
export const ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_ID =
  "achievement-albert-park-grand-prix-circuit" as const;
export const ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS = 150 as const;
export const PLAYER_CIRCUIT_ROUTE_PROGRESS_COLLECTION =
  "playerCircuitRouteProgress" as const;

// This excludes the relation's pit lane. The source list comes from the public
// Albert Park Circuit OSM relation (280443), in the track's forward order.
const ALBERT_PARK_GRAND_PRIX_CIRCUIT_TRACK_SOURCE_IDS = new Set([
  "987030977",
  "784076843",
  "784076839",
  "987030969",
  "1070446542",
  "784087846",
  "987030978",
  "987030966",
  "784083210",
  "987030982",
  "1050371045",
  "1013633268",
  "1013633269",
  "1050342733",
  "1021617920",
  "1021617874",
  "15856988",
  "979723480",
  "987030968",
  "784071296",
  "979723479",
  "979723477",
  "1253159342",
  "979723478",
  "1126808201",
  "987030972",
  "987030985",
  "987030974",
  "987030973",
  "784076847"
]);

// Every other visible canonical base pin, ordered around the circuit. This
// creates a 49-pin loop from the 98 ordinary base pins that survive GrowGo's
// standard 46m density rule on the exact mapped course.
const ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_IDS = new Set([
  "ggpin:v1:osm-way:987030977:1",
  "ggpin:v1:osm-way:987030977:3",
  "ggpin:v1:osm-way:784076839:1",
  "ggpin:v1:osm-way:784076839:3",
  "ggpin:v1:osm-way:784076839:5",
  "ggpin:v1:osm-way:784076839:7",
  "ggpin:v1:osm-way:784076839:9",
  "ggpin:v1:osm-way:784076839:11",
  "ggpin:v1:osm-way:784076839:13",
  "ggpin:v1:osm-way:1070446542:0",
  "ggpin:v1:osm-way:987030978:1",
  "ggpin:v1:osm-way:987030978:3",
  "ggpin:v1:osm-way:784083210:1",
  "ggpin:v1:osm-way:784083210:3",
  "ggpin:v1:osm-way:987030982:1",
  "ggpin:v1:osm-way:1013633268:0",
  "ggpin:v1:osm-way:1021617874:1",
  "ggpin:v1:osm-way:15856988:2",
  "ggpin:v1:osm-way:15856988:4",
  "ggpin:v1:osm-way:15856988:6",
  "ggpin:v1:osm-way:15856988:8",
  "ggpin:v1:osm-way:15856988:10",
  "ggpin:v1:osm-way:15856988:12",
  "ggpin:v1:osm-way:15856988:14",
  "ggpin:v1:osm-way:15856988:16",
  "ggpin:v1:osm-way:15856988:18",
  "ggpin:v1:osm-way:15856988:20",
  "ggpin:v1:osm-way:15856988:22",
  "ggpin:v1:osm-way:15856988:24",
  "ggpin:v1:osm-way:979723480:0",
  "ggpin:v1:osm-way:979723480:2",
  "ggpin:v1:osm-way:784071296:0",
  "ggpin:v1:osm-way:784071296:2",
  "ggpin:v1:osm-way:979723478:0",
  "ggpin:v1:osm-way:979723478:2",
  "ggpin:v1:osm-way:1126808201:0",
  "ggpin:v1:osm-way:987030972:0",
  "ggpin:v1:osm-way:987030985:2",
  "ggpin:v1:osm-way:987030985:4",
  "ggpin:v1:osm-way:987030974:1",
  "ggpin:v1:osm-way:987030974:3",
  "ggpin:v1:osm-way:784076847:0",
  "ggpin:v1:osm-way:784076847:2",
  "ggpin:v1:osm-way:784076847:4",
  "ggpin:v1:osm-way:784076847:6",
  "ggpin:v1:osm-way:784076847:8",
  "ggpin:v1:osm-way:784076847:10",
  "ggpin:v1:osm-way:784076847:12",
  "ggpin:v1:osm-way:784076847:14"
]);

export const ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT =
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_IDS.size;

export interface CircuitRouteProgress {
  capturedPinIds: readonly string[];
  completedAt: Date | null;
}

export interface RecordedCircuitRouteProgress extends CircuitRouteProgress {
  capturedCount: number;
  completedNow: boolean;
}

export function isAlbertParkGrandPrixCircuitTrackSource(sourceId: string): boolean {
  return ALBERT_PARK_GRAND_PRIX_CIRCUIT_TRACK_SOURCE_IDS.has(sourceId);
}

export function isAlbertParkGrandPrixCircuitSpecialPin(pinId: string): boolean {
  return ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_IDS.has(pinId);
}

export function getAlbertParkGrandPrixCircuitProgressRef(
  db: Firestore,
  uid: string
) {
  return db
    .collection(PLAYER_CIRCUIT_ROUTE_PROGRESS_COLLECTION)
    .doc(uid)
    .collection("routes")
    .doc(ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID);
}

export function readAlbertParkGrandPrixCircuitProgress(value: unknown): CircuitRouteProgress {
  const data = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const capturedPinIds = Array.isArray(data.capturedPinIds)
    ? [...new Set(data.capturedPinIds.filter(isAlbertParkGrandPrixCircuitSpecialPin))].sort()
    : [];

  return {
    capturedPinIds,
    completedAt: readDate(data.completedAt)
  };
}

export function recordAlbertParkGrandPrixCircuitCaptures(params: {
  progress: CircuitRouteProgress;
  pinIds: readonly string[];
  now: Date;
}): RecordedCircuitRouteProgress {
  const capturedPinIds = new Set(params.progress.capturedPinIds);
  params.pinIds.forEach((pinId) => {
    if (isAlbertParkGrandPrixCircuitSpecialPin(pinId)) capturedPinIds.add(pinId);
  });
  const captured = [...capturedPinIds].sort();
  const completedNow =
    params.progress.completedAt === null &&
    captured.length >= ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT;

  return {
    capturedPinIds: captured,
    capturedCount: captured.length,
    completedAt: completedNow ? params.now : params.progress.completedAt,
    completedNow
  };
}

export function serializeAlbertParkGrandPrixCircuitProgress(
  progress: CircuitRouteProgress | RecordedCircuitRouteProgress
) {
  return {
    routeId: ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID,
    title: ALBERT_PARK_GRAND_PRIX_CIRCUIT_TITLE,
    achievementId: ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_ID,
    achievementPoints: ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS,
    totalPins: ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT,
    capturedCount: Math.min(
      ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT,
      progress.capturedPinIds.length
    ),
    completedAt: progress.completedAt?.toISOString() ?? null,
    completed: progress.completedAt !== null,
    completedNow: "completedNow" in progress && progress.completedNow === true
  };
}

export function buildAlbertParkGrandPrixCircuitProgressStorage(
  progress: CircuitRouteProgress
) {
  return {
    schemaVersion: 1,
    routeId: ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID,
    capturedPinIds: [...progress.capturedPinIds],
    capturedCount: progress.capturedPinIds.length,
    completedAt: progress.completedAt ? Timestamp.fromDate(progress.completedAt) : null,
    updatedAt: Timestamp.now()
  };
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate(): Date }).toDate();
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
  }
  return null;
}
