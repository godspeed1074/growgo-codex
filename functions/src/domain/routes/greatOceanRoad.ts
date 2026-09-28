import { Timestamp, type Firestore } from "firebase-admin/firestore";

export const GREAT_OCEAN_ROAD_ROUTE_ID =
  "great-ocean-road-memorial-arch-to-allansford" as const;
export const GREAT_OCEAN_ROAD_TITLE = "Great Ocean Road" as const;
export const GREAT_OCEAN_ROAD_ACHIEVEMENT_ID =
  "achievement-great-ocean-road" as const;
export const GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS = 150 as const;
export const PLAYER_CIRCUIT_ROUTE_PROGRESS_COLLECTION =
  "playerCircuitRouteProgress" as const;

// Great Ocean Road OSM relation (6592912), from the Memorial Arch at Eastern
// View to Allansford. Starting with the eligible base pin closest to the Arch,
// every twentieth pin on the exact mapped route is replaced. This produces 203
// road-trip pins from 4,060 eligible base pins after GrowGo's 46m density rule.
const GREAT_OCEAN_ROAD_SPECIAL_PIN_IDS = new Set([
  "ggpin:v1:osm-way:770577438:6",
  "ggpin:v1:osm-way:770576342:13",
  "ggpin:v1:osm-way:1303033174:13",
  "ggpin:v1:osm-way:283592809:15",
  "ggpin:v1:osm-way:770410690:13",
  "ggpin:v1:osm-way:770410690:33",
  "ggpin:v1:osm-way:770412355:6",
  "ggpin:v1:osm-way:770410567:6",
  "ggpin:v1:osm-way:770410567:26",
  "ggpin:v1:osm-way:770409192:7",
  "ggpin:v1:osm-way:655882934:6",
  "ggpin:v1:osm-way:770409775:11",
  "ggpin:v1:osm-way:69560173:6",
  "ggpin:v1:osm-way:69559979:9",
  "ggpin:v1:osm-way:770399376:2",
  "ggpin:v1:osm-way:72711503:38",
  "ggpin:v1:osm-way:72711503:17",
  "ggpin:v1:osm-way:23160381:22",
  "ggpin:v1:osm-way:23160381:2",
  "ggpin:v1:osm-way:1361440777:6",
  "ggpin:v1:osm-way:713999960:13",
  "ggpin:v1:osm-way:72711489:17",
  "ggpin:v1:osm-way:72711489:38",
  "ggpin:v1:osm-way:72711442:4",
  "ggpin:v1:osm-way:72711442:24",
  "ggpin:v1:osm-way:72711442:44",
  "ggpin:v1:osm-way:72711442:64",
  "ggpin:v1:osm-way:72711442:84",
  "ggpin:v1:osm-way:72711453:10",
  "ggpin:v1:osm-way:172654900:1",
  "ggpin:v1:osm-way:172654900:22",
  "ggpin:v1:osm-way:770407335:9",
  "ggpin:v1:osm-way:172654902:7",
  "ggpin:v1:osm-way:172654902:27",
  "ggpin:v1:osm-way:38703736:6",
  "ggpin:v1:osm-way:769363014:12",
  "ggpin:v1:osm-way:769363014:32",
  "ggpin:v1:osm-way:72711525:7",
  "ggpin:v1:osm-way:72711525:27",
  "ggpin:v1:osm-way:72711525:47",
  "ggpin:v1:osm-way:130406919:8",
  "ggpin:v1:osm-way:172654901:6",
  "ggpin:v1:osm-way:72711528:8",
  "ggpin:v1:osm-way:72711528:28",
  "ggpin:v1:osm-way:72711528:48",
  "ggpin:v1:osm-way:72711522:0",
  "ggpin:v1:osm-way:72711445:10",
  "ggpin:v1:osm-way:72711445:30",
  "ggpin:v1:osm-way:72711427:11",
  "ggpin:v1:osm-way:769363967:11",
  "ggpin:v1:osm-way:72711544:17",
  "ggpin:v1:osm-way:72711520:6",
  "ggpin:v1:osm-way:1304185587:3",
  "ggpin:v1:osm-way:72711412:0",
  "ggpin:v1:osm-way:424856176:4",
  "ggpin:v1:osm-way:424856175:5",
  "ggpin:v1:osm-way:1544995313:1",
  "ggpin:v1:osm-way:197450354:8",
  "ggpin:v1:osm-way:1262427609:0",
  "ggpin:v1:osm-way:1262427696:6",
  "ggpin:v1:osm-way:1262427696:26",
  "ggpin:v1:osm-way:1262427696:46",
  "ggpin:v1:osm-way:1262427696:66",
  "ggpin:v1:osm-way:355913368:17",
  "ggpin:v1:osm-way:355913368:37",
  "ggpin:v1:osm-way:355913368:57",
  "ggpin:v1:osm-way:769384992:6",
  "ggpin:v1:osm-way:769384992:26",
  "ggpin:v1:osm-way:769384992:46",
  "ggpin:v1:osm-way:769384992:66",
  "ggpin:v1:osm-way:769384992:86",
  "ggpin:v1:osm-way:769384992:106",
  "ggpin:v1:osm-way:769384992:126",
  "ggpin:v1:osm-way:23160444:19",
  "ggpin:v1:osm-way:23160444:39",
  "ggpin:v1:osm-way:23160444:59",
  "ggpin:v1:osm-way:100403693:10",
  "ggpin:v1:osm-way:100403693:30",
  "ggpin:v1:osm-way:100403693:50",
  "ggpin:v1:osm-way:762114332:1",
  "ggpin:v1:osm-way:762114332:21",
  "ggpin:v1:osm-way:762114332:41",
  "ggpin:v1:osm-way:762114332:61",
  "ggpin:v1:osm-way:355923132:6",
  "ggpin:v1:osm-way:355923132:26",
  "ggpin:v1:osm-way:355923132:46",
  "ggpin:v1:osm-way:769387457:20",
  "ggpin:v1:osm-way:23160455:1",
  "ggpin:v1:osm-way:23160455:21",
  "ggpin:v1:osm-way:769388457:5",
  "ggpin:v1:osm-way:769388457:25",
  "ggpin:v1:osm-way:769388457:45",
  "ggpin:v1:osm-way:769388456:18",
  "ggpin:v1:osm-way:769389591:5",
  "ggpin:v1:osm-way:23160488:18",
  "ggpin:v1:osm-way:23160488:38",
  "ggpin:v1:osm-way:23160488:58",
  "ggpin:v1:osm-way:23160488:78",
  "ggpin:v1:osm-way:23160488:98",
  "ggpin:v1:osm-way:23160488:118",
  "ggpin:v1:osm-way:23160488:138",
  "ggpin:v1:osm-way:23160488:158",
  "ggpin:v1:osm-way:784832081:1",
  "ggpin:v1:osm-way:656249936:0",
  "ggpin:v1:osm-way:23160500:16",
  "ggpin:v1:osm-way:23160500:36",
  "ggpin:v1:osm-way:23160500:56",
  "ggpin:v1:osm-way:23160500:76",
  "ggpin:v1:osm-way:23160500:96",
  "ggpin:v1:osm-way:23160500:116",
  "ggpin:v1:osm-way:23160500:136",
  "ggpin:v1:osm-way:23160500:156",
  "ggpin:v1:osm-way:23160500:176",
  "ggpin:v1:osm-way:284769222:126",
  "ggpin:v1:osm-way:284769222:106",
  "ggpin:v1:osm-way:284769222:86",
  "ggpin:v1:osm-way:284769222:66",
  "ggpin:v1:osm-way:284769222:46",
  "ggpin:v1:osm-way:284769222:26",
  "ggpin:v1:osm-way:284769222:6",
  "ggpin:v1:osm-way:1262429598:13",
  "ggpin:v1:osm-way:1262429598:33",
  "ggpin:v1:osm-way:1262429598:53",
  "ggpin:v1:osm-way:1262429598:73",
  "ggpin:v1:osm-way:1262429598:93",
  "ggpin:v1:osm-way:769403806:8",
  "ggpin:v1:osm-way:239942330:1",
  "ggpin:v1:osm-way:239942330:22",
  "ggpin:v1:osm-way:239942330:42",
  "ggpin:v1:osm-way:239942330:64",
  "ggpin:v1:osm-way:355965860:1",
  "ggpin:v1:osm-way:355965860:21",
  "ggpin:v1:osm-way:355965860:41",
  "ggpin:v1:osm-way:769407208:3",
  "ggpin:v1:osm-way:26597246:19",
  "ggpin:v1:osm-way:769417085:37",
  "ggpin:v1:osm-way:769417085:17",
  "ggpin:v1:osm-way:769420386:11",
  "ggpin:v1:osm-way:361420279:11",
  "ggpin:v1:osm-way:361420280:1",
  "ggpin:v1:osm-way:355932369:50",
  "ggpin:v1:osm-way:355932369:30",
  "ggpin:v1:osm-way:355932369:10",
  "ggpin:v1:osm-way:24569001:3",
  "ggpin:v1:osm-way:284770176:17",
  "ggpin:v1:osm-way:284770176:37",
  "ggpin:v1:osm-way:24551817:9",
  "ggpin:v1:osm-way:24551870:11",
  "ggpin:v1:osm-way:24551870:31",
  "ggpin:v1:osm-way:24551870:51",
  "ggpin:v1:osm-way:117366096:3",
  "ggpin:v1:osm-way:808101818:19",
  "ggpin:v1:osm-way:24551862:74",
  "ggpin:v1:osm-way:24551862:54",
  "ggpin:v1:osm-way:24551862:34",
  "ggpin:v1:osm-way:24551862:14",
  "ggpin:v1:osm-way:1534176999:2",
  "ggpin:v1:osm-way:1534176997:30",
  "ggpin:v1:osm-way:1534176997:10",
  "ggpin:v1:osm-way:1534176996:3",
  "ggpin:v1:osm-way:1534176995:8",
  "ggpin:v1:osm-way:84882977:1",
  "ggpin:v1:osm-way:221464943:9",
  "ggpin:v1:osm-way:1127643770:9",
  "ggpin:v1:osm-way:1127643771:2",
  "ggpin:v1:osm-way:25913799:16",
  "ggpin:v1:osm-way:1534137422:30",
  "ggpin:v1:osm-way:1534137422:10",
  "ggpin:v1:osm-way:1534137423:2",
  "ggpin:v1:osm-way:221464941:20",
  "ggpin:v1:osm-way:221464941:0",
  "ggpin:v1:osm-way:281500599:196",
  "ggpin:v1:osm-way:281500599:176",
  "ggpin:v1:osm-way:281500599:156",
  "ggpin:v1:osm-way:281500599:136",
  "ggpin:v1:osm-way:281500599:116",
  "ggpin:v1:osm-way:281500599:96",
  "ggpin:v1:osm-way:281500599:76",
  "ggpin:v1:osm-way:281500599:56",
  "ggpin:v1:osm-way:281500599:36",
  "ggpin:v1:osm-way:281500599:16",
  "ggpin:v1:osm-way:281500480:29",
  "ggpin:v1:osm-way:281500480:9",
  "ggpin:v1:osm-way:281500481:8",
  "ggpin:v1:osm-way:769428563:16",
  "ggpin:v1:osm-way:769428562:2",
  "ggpin:v1:osm-way:769428560:2",
  "ggpin:v1:osm-way:285163905:278",
  "ggpin:v1:osm-way:285163905:258",
  "ggpin:v1:osm-way:285163905:238",
  "ggpin:v1:osm-way:285163905:218",
  "ggpin:v1:osm-way:285163905:198",
  "ggpin:v1:osm-way:285163905:178",
  "ggpin:v1:osm-way:285163905:158",
  "ggpin:v1:osm-way:285163905:138",
  "ggpin:v1:osm-way:285163905:118",
  "ggpin:v1:osm-way:285163905:98",
  "ggpin:v1:osm-way:285163905:78",
  "ggpin:v1:osm-way:285163905:58",
  "ggpin:v1:osm-way:285163905:38",
  "ggpin:v1:osm-way:285163905:18",
  "ggpin:v1:osm-way:769429929:4",
  "ggpin:v1:osm-way:769429928:2"
]);

export const GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT =
  GREAT_OCEAN_ROAD_SPECIAL_PIN_IDS.size;

export interface GreatOceanRoadProgress {
  capturedPinIds: readonly string[];
  completedAt: Date | null;
}

export interface RecordedGreatOceanRoadProgress extends GreatOceanRoadProgress {
  capturedCount: number;
  completedNow: boolean;
}

export function isGreatOceanRoadSpecialPin(pinId: string): boolean {
  return GREAT_OCEAN_ROAD_SPECIAL_PIN_IDS.has(pinId);
}

export function getGreatOceanRoadSpecialPinIds(): readonly string[] {
  return [...GREAT_OCEAN_ROAD_SPECIAL_PIN_IDS].sort();
}

export function getGreatOceanRoadProgressRef(db: Firestore, uid: string) {
  return db
    .collection(PLAYER_CIRCUIT_ROUTE_PROGRESS_COLLECTION)
    .doc(uid)
    .collection("routes")
    .doc(GREAT_OCEAN_ROAD_ROUTE_ID);
}

export function readGreatOceanRoadProgress(value: unknown): GreatOceanRoadProgress {
  const data = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const capturedPinIds = Array.isArray(data.capturedPinIds)
    ? [...new Set(data.capturedPinIds.filter(isGreatOceanRoadSpecialPin))].sort()
    : [];

  return {
    capturedPinIds,
    completedAt: readDate(data.completedAt)
  };
}

export function recordGreatOceanRoadCaptures(params: {
  progress: GreatOceanRoadProgress;
  pinIds: readonly string[];
  now: Date;
}): RecordedGreatOceanRoadProgress {
  const capturedPinIds = new Set(params.progress.capturedPinIds);
  params.pinIds.forEach((pinId) => {
    if (isGreatOceanRoadSpecialPin(pinId)) capturedPinIds.add(pinId);
  });
  const captured = [...capturedPinIds].sort();
  const completedNow =
    params.progress.completedAt === null &&
    captured.length >= GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT;

  return {
    capturedPinIds: captured,
    capturedCount: captured.length,
    completedAt: completedNow ? params.now : params.progress.completedAt,
    completedNow
  };
}

export function serializeGreatOceanRoadProgress(
  progress: GreatOceanRoadProgress | RecordedGreatOceanRoadProgress
) {
  return {
    routeId: GREAT_OCEAN_ROAD_ROUTE_ID,
    title: GREAT_OCEAN_ROAD_TITLE,
    achievementId: GREAT_OCEAN_ROAD_ACHIEVEMENT_ID,
    achievementPoints: GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS,
    totalPins: GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT,
    capturedCount: Math.min(
      GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT,
      progress.capturedPinIds.length
    ),
    completedAt: progress.completedAt?.toISOString() ?? null,
    completed: progress.completedAt !== null,
    completedNow: "completedNow" in progress && progress.completedNow === true
  };
}

export function buildGreatOceanRoadProgressStorage(
  progress: GreatOceanRoadProgress
) {
  return {
    schemaVersion: 1,
    routeId: GREAT_OCEAN_ROAD_ROUTE_ID,
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
