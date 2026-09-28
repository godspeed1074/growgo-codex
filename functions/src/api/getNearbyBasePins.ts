import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireDevelopmentBackendOperationalSafeguardAccess
} from "../config/developmentBackendOperationalSafeguards";
import {
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  type CanonicalBasePin,
  type CanonicalCoordinate
} from "../domain/pins/basePinTypes";
import { parseCanonicalPinId } from "../domain/pins/canonicalPinId";
import {
  filterCanonicalPinsByBoundingBox,
  generateCanonicalPinsForWay
} from "../domain/pins/canonicalPinGenerator";
import {
  buildPositiveAuthoritativeSourceCacheRecord,
  shouldRepairNearbySourceCache
} from "../domain/pins/authoritativePinCache";
import type { AuthoritativePinSourceGeometry } from "../domain/pins/authoritativePinSource";
import { filterCanonicalPinsByMinimumSeparation } from "../domain/pins/canonicalPinDensity";
import {
  classifyCanonicalPinsByWater,
  type ClassifiedNearbyPin,
  type WaterFeature
} from "../domain/pins/waterPinClassifier";
import {
  getWaterFishCycle,
  readWaterFishActivitiesForPins,
  WATER_FISH_SPAWN_CHANCE
} from "../domain/pins/waterFishSpawns";
import {
  getWaterFishSpawnMultiplier,
  readOfficialEventSchedule
} from "../domain/events/officialEvents";
import {
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID,
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT,
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_TITLE,
  getAlbertParkGrandPrixCircuitProgressRef,
  isAlbertParkGrandPrixCircuitSpecialPin,
  isAlbertParkGrandPrixCircuitTrackSource,
  readAlbertParkGrandPrixCircuitProgress,
  serializeAlbertParkGrandPrixCircuitProgress
} from "../domain/routes/albertParkGrandPrixCircuit";
import {
  GREAT_OCEAN_ROAD_ROUTE_ID,
  GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT,
  GREAT_OCEAN_ROAD_TITLE,
  getGreatOceanRoadProgressRef,
  isGreatOceanRoadSpecialPin,
  readGreatOceanRoadProgress,
  serializeGreatOceanRoadProgress
} from "../domain/routes/greatOceanRoad";
import {
  BASE_PIN_STARTING_POINTS,
  getBasePinPointValue,
  readBasePinCaptureValueState,
  SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION,
  type BasePinCaptureValueState
} from "../domain/pins/basePinValue";
import {
  SHARED_BASE_PIN_STATES_COLLECTION,
  SHARED_POI_PINS_COLLECTION,
  reconcileSharedBasePinOwnerProfile,
  readSharedBasePinState,
  serializeSharedBasePinState,
  sharedWorldDocumentId,
  type SharedBasePinState
} from "../domain/world/sharedWorld";
import { isCropHarvestActive } from "../domain/world/cropLifecycle";
import {
  verifyActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import { getAdminFirestore } from "../firebaseAdmin";
import {
  createSharedMapGeometryCache,
  MAP_GEOMETRY_LOOKUP_MS,
  normalizeStaticMapGeometry,
  SHARED_MAP_GEOMETRY_COLLECTION,
  type MapGeometryDelivery
} from "../infrastructure/pins/sharedMapGeometryCache";
import { withMapReadDeadline } from "../infrastructure/pins/mapReadDeadline";
import { createInFlightMapRead } from "../infrastructure/pins/inFlightMapRead";
import { createNearbyMapProvider } from "../infrastructure/pins/nearbyMapProvider";
import { readSparseBasePinCaptureValues } from "../infrastructure/pins/sparseBasePinCaptureValues";
import { readNearbyOwnedPinStates } from "../infrastructure/pins/nearbyOwnedPinStates";
import { createPlayerDailyCaptureCache } from "../infrastructure/pins/playerDailyCaptureCache";
import { readNearbyDailyPoiCaptures } from "../infrastructure/pins/nearbyDailyPoiCaptures";
import { readOptimizationEnabled } from "../infrastructure/sharedReadCache";
import {
  AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
  createFirestoreAuthoritativeSourceCache
} from "../infrastructure/pins/firestoreAuthoritativePinCache";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
import {
  requireDevelopmentBackendCapabilityAccess
} from "../security/developmentBackendCapabilityGuard";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber
} from "../validation/requestValidation";

import { countMapCost, withMapCostProbe } from "../infrastructure/pins/mapCostProbe";
import { createCoalescedEvidenceReads } from "../infrastructure/pins/coalescedEvidenceReads";
import { persistMapPreparedSnapshot } from "../infrastructure/pins/persistMapPreparedSnapshot";
import { canPersistMapPreparation, withMapPreparationPilot } from "../infrastructure/pins/mapPreparationPilot";
import { getOperationalDenialReason } from "../config/developmentBackendOperationalSafeguards";

const NEARBY_PIN_RADIUS_DEGREES = 0.006;
const MAX_NEARBY_PINS = 350;
// Leave time for dynamic player/world reads inside the live 60-second limit.
const CACHED_NEARBY_PIN_FALLBACK_MS = 4_000;
const readInFlightPinFallback = createInFlightMapRead<NearbyCanonicalPinResult>(CACHED_NEARBY_PIN_FALLBACK_MS);
const fetchNearbyMapGeometry = createNearbyMapProvider();
const CACHED_NEARBY_PIN_FALLBACK_LIMIT = MAX_NEARBY_PINS * 3;
// This provider is intentionally used only after the configured primary and
// fallback providers. It keeps the live map available when a public Overpass
// mirror temporarily rate-limits or drops a Cloud Run request.
const EMERGENCY_OVERPASS_FALLBACK_ENDPOINT =
  "https://overpass.private.coffee/api/interpreter";
const AUTHORITATIVE_PIN_PROVIDER_USER_AGENT =
  "GrowGo Alpha/1.0 (+https://growgo-account-profile.vercel.app)";
// A map view is a read path. These small warm-instance guards prevent the
// same static OpenStreetMap evidence from repeatedly touching Firestore while
// a player remains in an already-loaded area.
const PASSIVE_MAP_CACHE_MEMORY_TTL_MILLISECONDS = 24 * 60 * 60 * 1_000;
const MAX_PASSIVE_MAP_CACHE_MEMORY_ENTRIES = 20_000;
const NEARBY_RESPONSE_CACHE_TTL_MILLISECONDS = 90_000;
const MAX_NEARBY_RESPONSE_CACHE_ENTRIES = 500;
const recentlyObservedSourceKeys = new Map<string, number>();
const readDailyCaptureList = createPlayerDailyCaptureCache();
const recentlyObservedClassificationKeys = new Map<string, number>();
const evidenceReaders = new WeakMap<FirebaseFirestore.Firestore,
  (pins: ClassifiedNearbyPin[]) => Promise<FirebaseFirestore.DocumentSnapshot[]>>();
function readClassificationEvidence(db: FirebaseFirestore.Firestore, pins: ClassifiedNearbyPin[]) {
  let reader = evidenceReaders.get(db);
  if (!reader) {
    reader = createCoalescedEvidenceReads<ClassifiedNearbyPin, FirebaseFirestore.DocumentSnapshot>(
      pin => JSON.stringify([pin.pinId, pin.type, pin.latitude, pin.longitude]),
      async missing => {
        const result = await db.getAll(...missing.map(pin =>
          db.collection("authoritativeWaterPinStates").doc(pin.pinId)));
        countMapCost('classification_reads', missing.length);
        return result;
      });
    evidenceReaders.set(db, reader);
  }
  return reader(pins);
}
const recentlyLoadedNearbyResponses = new Map<
  string,
  { expiresAt: number; response: unknown }
>();
const sharedMapGeometryCache = createSharedMapGeometryCache({
  persistPrepared: async (key, expected, next, signal) => {
    if (!canPersistMapPreparation()) return false;
    countMapCost('preparation_persist_attempts');
    const saved = await persistMapPreparedSnapshot(
      getAdminFirestore(), key, expected, next, signal,
      kind => {
        countMapCost(kind === "read" ? 'geometry_reads' : 'geometry_writes');
        countMapCost(kind === "read" ? 'preparation_persist_reads' : 'preparation_persist_write_attempts');
      }
    );
    countMapCost(saved ? 'preparation_persist_saved' : 'preparation_persist_conflicts');
    return saved;
  },
  read: async (key) => {
    countMapCost('geometry_reads');
    const snapshot = await getAdminFirestore()
      .collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(key).get();
    return snapshot.data();
  },
  write: async (key, value) => {
    countMapCost('geometry_writes');
    await getAdminFirestore()
      .collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(key).set(value);
  },
  fetch: (bounds, signal) => {
    countMapCost('provider_fetches');
    return fetchAuthoritativeMapGeometry(bounds, signal);
  },
  extract: (payload, center, bounds) => extractCanonicalPins(payload, center, bounds),
  prepare: async ({ pins, sources }, signal) => {
    countMapCost('prepared_pins', pins.length);
    countMapCost('prepared_sources', sources.length);
    await Promise.all([
      cacheNearbyPinSources(sources, true, signal),
      cacheNearbyPinClassifications(pins, true, signal)
    ]);
  },
  report: (event) => {
    // Sample operational counters without player IDs/locations or extra DB writes.
    if (process.env.GROWGO_MAP_CACHE_METRICS === "true" || Math.random() < 0.02) {
      console.info(JSON.stringify({ component: "shared_map_geometry", event }));
    }
  }
});

export function isSharedMapCacheEnabled(): boolean {
  return process.env.GROWGO_SHARED_MAP_CACHE_ENABLED !== "false";
}
const HIGHWAY_TYPES = [
  // Motorways and trunks are the OpenStreetMap classifications used for
  // freeways and major highways. They follow the same 50 m base-pin spacing
  // as all other eligible roads.
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "residential",
  "living_street",
  "unclassified",
  "tertiary",
  "tertiary_link",
  "secondary",
  "secondary_link",
  "primary",
  "primary_link",
  "service",
  "road",
  "track",
  "raceway",
  "path",
  "footway",
  "cycleway",
  "pedestrian"
] as const;

interface NearbyPinRequest {
  latitude: number;
  longitude: number;
  deviceId: string | undefined;
  delivery?: "interactive" | "prepare";
}

interface OverpassWay {
  id: unknown;
  type: unknown;
  geometry: unknown;
  tags: unknown;
}

export function validateNearbyBasePinRequest(
  request: CallableRequest<unknown>
): NearbyPinRequest {
  const payload = asObject(request.data, "getNearbyBasePins payload");
  assertAllowedKeys(
    payload,
    ["latitude", "longitude", "deviceId", "delivery"],
    "getNearbyBasePins payload"
  );

  if (payload.delivery !== undefined && payload.delivery !== "interactive" && payload.delivery !== "prepare") {
    throw new HttpsError("invalid-argument", "Unknown map delivery mode.");
  }
  return {
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    ...(payload.delivery ? { delivery: payload.delivery as "interactive" | "prepare" } : {})
  };
}

export async function getNearbyBasePinsHandler(
  request: CallableRequest<unknown>
) {
  return withMapCostProbe(request.auth?.uid, () =>
    withMapPreparationPilot(request.auth?.uid, () => handleNearbyBasePins(request)));
}

async function handleNearbyBasePins(
  request: CallableRequest<unknown>
) {
  let stage = "authentication";
  try {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({
    capability: "authoritative_pin_acquisition"
  });
  stage = "map-safeguard";
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "authoritative_pin_acquisition",
    uid: authContext.uid
  });

  stage = "request-validation";
  const input = validateNearbyBasePinRequest(request);
  if (input.delivery && (process.env.GROWGO_MAP_DELIVERY_PREVIEW_ENABLED !== "true" || !isSharedMapCacheEnabled())) {
    throw new HttpsError("failed-precondition", "Map delivery preview is not enabled.", { reason: "map-delivery-disabled" });
  }
  stage = "device-session";
  await verifyActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const now = new Date();
  // A committed player change (including a capture/beam) invalidates this
  // player's display cache without changing any authoritative capture writer.
  stage = "player-profile";
  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  const playerRevision = `${playerSnapshot.updateTime?.seconds}:${playerSnapshot.updateTime?.nanoseconds}`;
  const responseCacheKey = buildNearbyResponseCacheKey({
    uid: authContext.uid,
    latitude: input.latitude,
    longitude: input.longitude,
    now
  }) + `|${playerRevision}` + (input.delivery ? `|${input.delivery}` : "");
  const cachedResponse = recentlyLoadedNearbyResponses.get(responseCacheKey);
  if (cachedResponse && cachedResponse.expiresAt > now.getTime()) {
    countMapCost('response_hit');
    return cachedResponse.response;
  }
  countMapCost('response_miss');

  stage = "player-profile";
  if (!playerSnapshot.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Create your GrowGo profile before loading nearby pins."
    );
  }

  const player = readStoredPlayerDocument(playerSnapshot.data());
  if (!player.profileComplete) {
    throw new HttpsError(
      "failed-precondition",
      "Create your GrowGo profile before loading nearby pins."
    );
  }

  if (input.delivery === "prepare") {
    stage = "map-preparation";
    const center = { latitude: input.latitude, longitude: input.longitude };
    const result = await sharedMapGeometryCache.getForDelivery(center, createBounds(center), true);
    // Static-only: no fish, ownership reconciliation, captures, crops, routes,
    // inventory, scores or rewards are read/written below this return.
    return { ok: true, mapDelivery: result.delivery ?? null };
  }

  stage = "nearby-map-source";
  const nearbyPins = await acquireNearbyCanonicalPins({
    latitude: input.latitude,
    longitude: input.longitude
  }, input.delivery === "interactive");
  countMapCost('returned_pins', nearbyPins.pins.length);
  const waterFishCycle = getWaterFishCycle(now);
  const db = getAdminFirestore();
  stage = "world-state";
  const officialEvents = await readOfficialEventSchedule(db, now);
  const waterFishSpawnChance = WATER_FISH_SPAWN_CHANCE * getWaterFishSpawnMultiplier(officialEvents, now);
  const waterFishByPinId = await readWaterFishActivitiesForPins({
    db,
    pinIds: nearbyPins.pins
      .filter((pin) => pin.type === "water")
      .map((pin) => pin.pinId),
    now,
    spawnChance: waterFishSpawnChance
  });
  const [
    storedSharedStates,
    basePinValueStates,
    sharedPoiPins,
    circuitProgressSnapshot,
    greatOceanRoadProgressSnapshot
  ] = await Promise.all([
    readNearbySharedBasePinStates(nearbyPins.pins),
    readNearbyBasePinCaptureValueStates(nearbyPins.pins),
    readNearbySharedPoiPins({
      latitude: input.latitude,
      longitude: input.longitude
    }),
    getAlbertParkGrandPrixCircuitProgressRef(db, authContext.uid).get(),
    getGreatOceanRoadProgressRef(db, authContext.uid).get()
  ]);
  const sharedStates = await reconcileNearbySharedBasePinOwnerProfiles(storedSharedStates);
  const circuitRoute = serializeAlbertParkGrandPrixCircuitProgress(
    readAlbertParkGrandPrixCircuitProgress(circuitProgressSnapshot.data())
  );
  const greatOceanRoad = serializeGreatOceanRoadProgress(
    readGreatOceanRoadProgress(greatOceanRoadProgressSnapshot.data())
  );

  const captureDay = now.toISOString().slice(0, 10);
  const [captureList, harvestedPinIds, dailyPoiCapturedPinIds] = await Promise.all([
    readDailyCaptureList({
      db,
      uid: authContext.uid,
      day: captureDay,
      pinIds: nearbyPins.pins.map(pin => pin.pinId),
      revision: playerRevision,
      now: now.getTime(),
      enabled: readOptimizationEnabled("CAPTURES")
    }),
    readNearbyPlayerHarvestStates({
      uid: authContext.uid,
      sharedStates,
      harvestDay: captureDay,
      now
    }),
    readNearbyDailyPoiCaptures({
      db, uid: authContext.uid, captureDay,
      pinIds: sharedPoiPins.filter(isDailyGreenPoiPin).map(poi => poi.id)
    })
  ]);

  const response = {
    ok: true,
    ...(nearbyPins.usedCachedFallback ? { mapPinsFallback: true } : {}),
    ...(input.delivery ? { mapDelivery: nearbyPins.delivery ?? null } : {}),
    fishCycle: {
      expiresAt: waterFishCycle.expiresAt.toISOString()
    },
    circuitRoute,
    greatOceanRoad,
    pins: nearbyPins.pins.map((pin) => {
      const waterFish = pin.type === "water"
        ? waterFishByPinId.get(pin.pinId) ?? null
        : null;
      const sharedState = sharedStates.get(pin.pinId) ?? null;
      const basePinValueState = basePinValueStates.get(pin.pinId) ?? null;
      const pointValue = pin.type === "base"
        ? getBasePinPointValue({
            lastCapturedAt: basePinValueState?.lastCapturedAt,
            now
          })
        : 10;
      const isCircuitSpecial = isAlbertParkGrandPrixCircuitSpecialPin(pin.pinId);
      const isGreatOceanRoadSpecial = isGreatOceanRoadSpecialPin(pin.pinId);

      return {
        ...pin,
        // Send the reset value and timestamp separately so the client can
        // keep the +1-per-week value moving without ever double-counting it.
        basePoints: pin.type === "base" ? BASE_PIN_STARTING_POINTS : pointValue,
        pointValue,
        lastValueCaptureAt: basePinValueState?.lastCapturedAt.toISOString() ?? null,
        captureStateKnown: true,
        capturedToday: captureList.ids.has(pin.pinId),
        harvestedToday: harvestedPinIds.has(pin.pinId),
        // Send the server day as well as the boolean so an old client-side
        // marker cannot remain locked after the next UTC reset.
        harvestDay: harvestedPinIds.has(pin.pinId) ? captureDay : null,
        worldStateKnown: sharedState !== null,
        ...(sharedState ? serializeSharedBasePinState(sharedState, authContext.uid) : {}),
        ...(isCircuitSpecial
          ? {
              isCircuitSpecial: true,
              circuitRouteId: ALBERT_PARK_GRAND_PRIX_CIRCUIT_ROUTE_ID,
              circuitTitle: ALBERT_PARK_GRAND_PRIX_CIRCUIT_TITLE,
              circuitPinCount: ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT
            }
          : {}),
        ...(isGreatOceanRoadSpecial
          ? {
              isGreatOceanRoadSpecial: true,
              greatOceanRoadRouteId: GREAT_OCEAN_ROAD_ROUTE_ID,
              greatOceanRoadTitle: GREAT_OCEAN_ROAD_TITLE,
              greatOceanRoadPinCount: GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT
            }
          : {}),
        fish: waterFish?.active && waterFish.type
          ? {
              type: waterFish.type,
              spawnedAt: waterFish.spawnedAt?.toISOString() ?? now.toISOString(),
              expiresAt: waterFish.expiresAt?.toISOString() ?? now.toISOString()
            }
          : null
      };
    }),
    poiPins: sharedPoiPins.map((poi) => ({
      ...poi,
      ...(isDailyGreenPoiPin(poi)
        ? {
            capturedToday: dailyPoiCapturedPinIds.has(poi.id),
            dailyCaptureDay: dailyPoiCapturedPinIds.has(poi.id) ? captureDay : null
          }
        : {})
    }))
  };
  // Do not cache a degraded map response: the client makes one bounded retry
  // after the provider's cold-failure cooldown to request fresh geometry.
  if (!nearbyPins.usedCachedFallback) {
    rememberNearbyResponse({
      key: responseCacheKey,
      response,
      now,
      expiresAt: captureList.expiresAt
    });
  }
  return response;
  } catch (error) {
    // This is deliberately redacted: it gives us the failed subsystem without
    // logging a player, a location, or any account data.
    console.error(
      `getNearbyBasePins failure at ${stage}: ${
        getOperationalDenialReason(error) ?? (error instanceof Error ? error.message : "Unknown failure")
      }`
    );
    throw error;
  }
}

interface SharedPoiPinResponse {
  id: string;
  type: "poi";
  name: string;
  category: "Places" | "Tourist Attractions" | "Special POIs";
  subcategory: "Church" | "Hospital" | "Historic" | "Park" | "Landmark" | "Local POI" | "Major Museum" | "Movie Theater" | "Post Office";
  rarity: "normal" | "special";
  icon: "church" | "park" | "historic" | "landmark" | "tourist" | "museum";
  lat: number;
  lng: number;
  description: string;
  poiName: string;
  poiCategory: string;
  isSpecial?: true;
  cardRewardSetId?: "dinosaur-discoveries" | "land-of-oz";
  capturedToday?: boolean;
  dailyCaptureDay?: string | null;
}

function isDailyGreenPoiPin(poi: SharedPoiPinResponse): boolean {
  return poi.category === "Places" && poi.rarity !== "special" &&
    ((poi.subcategory === "Church" && poi.icon === "church") ||
      (poi.subcategory === "Park" && poi.icon === "park"));
}

async function readNearbySharedPoiPins(
  center: CanonicalCoordinate
): Promise<SharedPoiPinResponse[]> {
  const bounds = createBounds(center);
  const snapshots = await getAdminFirestore()
    .collection(SHARED_POI_PINS_COLLECTION)
    .where("lat", ">=", bounds.south)
    .where("lat", "<=", bounds.north)
    .limit(500)
    .get();
  const allowedCategories = new Set(["Places", "Tourist Attractions", "Special POIs"]);
  const allowedSubcategories = new Set([
    "Church", "Hospital", "Historic", "Park", "Landmark", "Local POI", "Major Museum", "Movie Theater", "Post Office"
  ]);
  const allowedIcons = new Set(["church", "park", "historic", "landmark", "tourist", "museum"]);

  return snapshots.docs.flatMap((snapshot) => {
    const value = snapshot.data();
    if (
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      !allowedCategories.has(value.category) ||
      !allowedSubcategories.has(value.subcategory) ||
      !allowedIcons.has(value.icon) ||
      !Number.isFinite(value.lat) ||
      !Number.isFinite(value.lng) ||
      value.lat < bounds.south || value.lat > bounds.north ||
      value.lng < bounds.west || value.lng > bounds.east
    ) {
      return [];
    }
    const isMajorMuseum =
      value.category === "Special POIs" &&
      value.subcategory === "Major Museum" &&
      value.icon === "museum" &&
      value.isSpecial === true &&
      value.cardRewardSetId === "dinosaur-discoveries";
    const isLandOfOzMovieTheater = value.category === "Tourist Attractions" &&
      value.subcategory === "Movie Theater" && value.icon === "tourist" &&
      value.cardRewardSetId === "land-of-oz";
    const icon = value.subcategory === "Historic" ? "historic" : value.icon;
    return [{
      id: value.id,
      type: "poi" as const,
      name: value.name,
      category: value.category as SharedPoiPinResponse["category"],
      subcategory: value.subcategory as SharedPoiPinResponse["subcategory"],
      rarity: isMajorMuseum ? "special" as const : "normal" as const,
      icon: icon as SharedPoiPinResponse["icon"],
      lat: Number(value.lat),
      lng: Number(value.lng),
      description: typeof value.description === "string"
        ? value.description
        : `${value.subcategory} from OpenStreetMap.`,
      poiName: typeof value.poiName === "string" ? value.poiName : value.name,
      poiCategory: typeof value.poiCategory === "string" ? value.poiCategory : value.subcategory,
      ...(isMajorMuseum
        ? { isSpecial: true as const, cardRewardSetId: "dinosaur-discoveries" as const }
        : isLandOfOzMovieTheater ? { cardRewardSetId: "land-of-oz" as const } : {})
    }];
  });
}

export const getNearbyBasePins = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  getNearbyBasePinsHandler
);

export interface NearbyCanonicalPinResult {
  pins: ClassifiedNearbyPin[];
  sources: AuthoritativePinSourceGeometry[];
  delivery?: MapGeometryDelivery;
  usedCachedFallback?: boolean;
}

export interface AcquireAuthoritativePinsParams {
  center: CanonicalCoordinate;
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  maxPins: number;
  pinFilter?: (pin: CanonicalBasePin) => boolean;
  signal?: AbortSignal;
}

async function acquireNearbyCanonicalPins(
  center: CanonicalCoordinate,
  immediateDelivery = false
): Promise<NearbyCanonicalPinResult> {
  try {
    if (isSharedMapCacheEnabled()) {
      // Cache reads/writes fail soft inside the cache. Provider failures reach
      // the existing persisted-pin fallback below, without a second retry loop.
      return immediateDelivery
        ? await sharedMapGeometryCache.getForDelivery(center, createBounds(center))
        : await sharedMapGeometryCache.get(center, createBounds(center));
    }
    return await withMapReadDeadline(MAP_GEOMETRY_LOOKUP_MS, async (signal) => {
      const result = await acquireAuthoritativePins({
        center, bounds: createBounds(center), maxPins: MAX_NEARBY_PINS, signal
      });
      signal.throwIfAborted();
      await Promise.all([
        cacheNearbyPinSources(result.sources, false, signal),
        cacheNearbyPinClassifications(result.pins, false, signal)
      ]);
      signal.throwIfAborted();
      return result;
    });
  } catch (error) {
    // The client should never lose a known neighbourhood simply because an
    // upstream OpenStreetMap mirror is momentarily unavailable. These cached
    // records are server-authored pin locations and classifications, so this
    // fallback preserves normal fish spawning and ownership display without
    // inventing client-side pins.
    const db = getAdminFirestore();
    // Only identical cameras on the same database share an active static read.
    // Completed/empty/error results are not retained. Player captures, crops,
    // fish and rewards are still read separately below for every caller.
    const cachedNearbyPins = await readInFlightPinFallback(
      db, JSON.stringify([center.latitude, center.longitude]),
      () => readCachedNearbyCanonicalPins(center, db)
    ).catch(() => ({ pins: [], sources: [] }));
    if (cachedNearbyPins.pins.length > 0) {
      console.warn("getNearbyBasePins using cached nearby-pin fallback");
      return { ...cachedNearbyPins, usedCachedFallback: true };
    }

    throw new HttpsError("unavailable", "Nearby pins are taking longer than expected. Please try again shortly.");
  }
}

async function readCachedNearbyCanonicalPins(
  center: CanonicalCoordinate,
  db: ReturnType<typeof getAdminFirestore>
): Promise<NearbyCanonicalPinResult> {
  const bounds = createBounds(center);
  const snapshot = await db
    .collection("authoritativeWaterPinStates")
    .where("latitude", ">=", bounds.south)
    .where("latitude", "<=", bounds.north)
    .limit(CACHED_NEARBY_PIN_FALLBACK_LIMIT)
    .get();

  const pins = snapshot.docs.flatMap((document) => {
    const value = document.data();
    const pinId = typeof value.pinId === "string" ? value.pinId : "";
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    if (
      (value.type !== "base" && value.type !== "water") ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < bounds.south || latitude > bounds.north ||
      longitude < bounds.west || longitude > bounds.east
    ) {
      return [];
    }

    try {
      const identity = parseCanonicalPinId(pinId);
      return [{
        ...identity,
        pinId,
        // Segment position is not needed to render or capture a cached pin.
        // Retaining its deterministic index makes the fallback compatible
        // with the client contract until the provider recovers.
        segmentIndex: 0,
        latitude,
        longitude,
        distanceAlongWayMetres:
          identity.positionIndex * CANONICAL_V1_BASE_PIN_SPACING_METRES,
        type: value.type as ClassifiedNearbyPin["type"]
      } satisfies ClassifiedNearbyPin];
    } catch {
      return [];
    }
  })
    .sort((left, right) => squaredDistance(left, center) - squaredDistance(right, center))
    .slice(0, MAX_NEARBY_PINS);

  return { pins, sources: [] };
}

export async function acquireAuthoritativePins(
  params: AcquireAuthoritativePinsParams
): Promise<NearbyCanonicalPinResult> {
  const payload = await fetchAuthoritativeMapGeometry(params.bounds, params.signal);
  params.signal?.throwIfAborted();
  return extractCanonicalPins(payload, params.center, params.bounds, {
    maxPins: params.maxPins,
    pinFilter: params.pinFilter
  });
}

async function fetchAuthoritativeMapGeometry(bounds: AcquireAuthoritativePinsParams["bounds"], signal?: AbortSignal) {
  const endpoints = readPrivateAlphaOverpassEndpoints();
  if (endpoints.length === 0) {
    throw new HttpsError("unavailable", "Nearby pins are unavailable right now.");
  }

  return fetchNearbyMapGeometry({
    endpoints, body: buildNearbyRoadQuery(bounds),
    userAgent: AUTHORITATIVE_PIN_PROVIDER_USER_AGENT,
    normalize: normalizeStaticMapGeometry, signal
  }).catch(() => {
    // Keep the existing callable error contract for other authoritative readers.
    throw new HttpsError("unavailable", "Nearby pins are unavailable right now.");
  });
}

export function createBounds(center: CanonicalCoordinate) {
  const longitudeRadius = Math.min(
    0.018,
    NEARBY_PIN_RADIUS_DEGREES / Math.max(0.25, Math.cos((center.latitude * Math.PI) / 180))
  );

  return {
    south: Math.max(-90, center.latitude - NEARBY_PIN_RADIUS_DEGREES),
    west: Math.max(-180, center.longitude - longitudeRadius),
    north: Math.min(90, center.latitude + NEARBY_PIN_RADIUS_DEGREES),
    east: Math.min(180, center.longitude + longitudeRadius)
  };
}

function buildNearbyRoadQuery(bounds: {
  south: number;
  west: number;
  north: number;
  east: number;
}) {
  const highwayRegex = HIGHWAY_TYPES.join("|");
  const area = `(${bounds.south},${bounds.west},${bounds.north},${bounds.east})`;
  return `[out:json][timeout:10];(way["highway"~"^(${highwayRegex})$"]${area};way["disused:highway"="raceway"]${area};way["natural"="water"]${area};way["natural"="coastline"]${area};way["water"]${area};way["waterway"~"^(river|stream|canal)$"]${area};way["landuse"~"^(reservoir|basin)$"]${area};);out geom;`;
}

export function extractCanonicalPins(
  payload: unknown,
  center: CanonicalCoordinate,
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  },
  options: {
    maxPins: number;
    pinFilter?: (pin: CanonicalBasePin) => boolean;
  } = { maxPins: MAX_NEARBY_PINS }
): NearbyCanonicalPinResult {
  const elements = Array.isArray((payload as { elements?: unknown } | null)?.elements)
    ? (payload as { elements: unknown[] }).elements
    : [];
  const pins: CanonicalBasePin[] = [];
  const sources = new Map<string, AuthoritativePinSourceGeometry>();
  const waterFeatures: WaterFeature[] = [];

  for (const element of elements) {
    const way = element as OverpassWay;
    if (way.type !== "way") continue;

    const orderedCoordinates = parseWayGeometry(way.geometry);
    if (orderedCoordinates.length < 2) continue;

    if (isWaterFeature(way.tags)) {
      waterFeatures.push({
        orderedCoordinates,
        closed: isClosedWay(orderedCoordinates)
      });
      continue;
    }

    if (!isRoadFeature(way.tags)) continue;

    const sourceId = String(way.id ?? "");
    if (!/^[1-9]\d{0,18}$/.test(sourceId)) continue;

    try {
      const source: AuthoritativePinSourceGeometry = {
        generatorVersion: GROWGO_BASE_PIN_GENERATOR_VERSION,
        sourceType: CANONICAL_BASE_PIN_SOURCE_TYPE,
        sourceId,
        orderedCoordinates,
        spacingMetres: CANONICAL_V1_BASE_PIN_SPACING_METRES
      };
      const roadPins = filterCanonicalPinsByBoundingBox(
        generateCanonicalPinsForWay(source),
        bounds
      );
      if (roadPins.length === 0) continue;

      sources.set(sourceId, source);
      pins.push(
        ...roadPins
      );
    } catch {
      // A malformed OpenStreetMap way is skipped without affecting nearby roads.
    }
  }

  const densityFilteredPins = filterCanonicalPinsByMinimumSeparation(
    pins,
    undefined,
    (pin) =>
      isAlbertParkGrandPrixCircuitTrackSource(pin.sourceId) ||
      isGreatOceanRoadSpecialPin(pin.pinId)
  )
    .filter((pin) => !options.pinFilter || options.pinFilter(pin))
    .sort((left, right) => squaredDistance(left, center) - squaredDistance(right, center))
    .slice(0, options.maxPins);

  const visibleSourceIds = new Set(
    densityFilteredPins.map((pin) => pin.sourceId)
  );

  const classifiedPins = classifyCanonicalPinsByWater(densityFilteredPins, waterFeatures)
    .map((pin) =>
      isAlbertParkGrandPrixCircuitTrackSource(pin.sourceId) ||
      isGreatOceanRoadSpecialPin(pin.pinId)
      ? { ...pin, type: "base" as const }
      : pin);

  return {
    pins: classifiedPins,
    sources: [...sources.values()].filter((source) =>
      visibleSourceIds.has(source.sourceId)
    )
  };
}

export async function cacheNearbyPinSources(
  sources: readonly AuthoritativePinSourceGeometry[],
  verifyPersistence = false,
  signal?: AbortSignal
): Promise<void> {
  signal?.throwIfAborted();
  if (sources.length === 0) return;

  const cache = createFirestoreAuthoritativeSourceCache({
    firestore: getAdminFirestore(),
    collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
    readsEnabled: true,
    writesEnabled: true,
    propagateErrors: verifyPersistence
  });
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() +
      runtimeConfig.authoritativeSourceAcquisition.policy
        .positiveStaleLifetimeSeconds *
        1000
  );

  const uniqueSources = new Map<string, AuthoritativePinSourceGeometry>();
  sources.forEach((source) => {
    uniqueSources.set(
      `${source.generatorVersion}|${source.sourceType}|${source.sourceId}`,
      source
    );
  });

  await Promise.all([...uniqueSources.entries()].map(async ([memoryKey, source]) => {
    signal?.throwIfAborted();
    if (!verifyPersistence && wasRecentlyObserved(recentlyObservedSourceKeys, memoryKey, now)) return;

    const reference = {
      generatorVersion: source.generatorVersion,
      sourceType: source.sourceType,
      sourceId: source.sourceId
    };
    const existing = await cache.read(reference);
    signal?.throwIfAborted();

    // Keep usable positives write-free, but let server-verified map geometry
    // repair outage records. A refresh must not leave a known road blocked.
    if (shouldRepairNearbySourceCache(existing, now)) {
      await cache.write(
        reference,
        buildPositiveAuthoritativeSourceCacheRecord({
          source: {
            ...source,
            fetchedAt: now.toISOString()
          },
          cachedAt: now,
          expiresAt
        })
      );
    }

    signal?.throwIfAborted();
    rememberObservation(recentlyObservedSourceKeys, memoryKey, now);
  }));
}

export async function cacheNearbyPinClassifications(
  pins: readonly ClassifiedNearbyPin[],
  verifyPersistence = false,
  signal?: AbortSignal
): Promise<void> {
  signal?.throwIfAborted();
  if (pins.length === 0) return;

  const db = getAdminFirestore();
  const observedAt = new Date();
  const uniquePins = new Map<string, ClassifiedNearbyPin>();
  pins.forEach((pin) => uniquePins.set(pin.pinId, pin));
  const unseenPins = [...uniquePins.values()].filter((pin) =>
    verifyPersistence || !wasRecentlyObserved(recentlyObservedClassificationKeys, pin.pinId, observedAt)
  );
  if (unseenPins.length === 0) return;

  const snapshots = await readClassificationEvidence(db, unseenPins);
  signal?.throwIfAborted();
  const writes = unseenPins.filter((pin, index) => {
    const existing = snapshots[index]?.data();
    return !snapshots[index]?.exists ||
      existing?.schemaVersion !== 1 ||
      existing?.pinId !== pin.pinId ||
      existing?.type !== pin.type ||
      Number(existing?.latitude) !== pin.latitude ||
      Number(existing?.longitude) !== pin.longitude;
  });

  if (writes.length > 0) {
    const batch = db.batch();
    writes.forEach((pin) => {
      batch.set(
        db.collection("authoritativeWaterPinStates").doc(pin.pinId),
        {
          schemaVersion: 1,
          pinId: pin.pinId,
          type: pin.type,
          latitude: pin.latitude,
          longitude: pin.longitude,
          observedAt
        },
        { merge: true }
      );
    });
    await batch.commit();
  }

  signal?.throwIfAborted();
  unseenPins.forEach((pin) =>
    rememberObservation(recentlyObservedClassificationKeys, pin.pinId, observedAt)
  );
}

async function readNearbySharedBasePinStates(
  pins: readonly ClassifiedNearbyPin[]
): Promise<Map<string, SharedBasePinState>> {
  if (pins.length === 0) return new Map();

  const db = getAdminFirestore();
  const requestedPinIds = new Set(pins.map((pin) => pin.pinId));
  if (process.env.GROWGO_EXACT_OWNED_PIN_READS === "true") {
    const result = await readNearbyOwnedPinStates(db, [...requestedPinIds]);
    countMapCost('owned_query_documents', result.documentsRead);
    countMapCost('owned_visible_documents', result.states.size);
    return result.states;
  }
  const bounds = getPinBounds(pins);
  // Only a tiny fraction of the map's base pins are owned. Query those sparse
  // world records instead of reading an empty document for every visible pin.
  const snapshot = await db
    .collection(SHARED_BASE_PIN_STATES_COLLECTION)
    .where("latitude", ">=", bounds.south)
    .where("latitude", "<=", bounds.north)
    .limit(500)
    .get();
  const states = new Map<string, SharedBasePinState>();
  countMapCost('owned_query_documents', snapshot.size);
  snapshot.docs.forEach((document) => {
    const state = readSharedBasePinState(document.data());
    if (
      state &&
      requestedPinIds.has(state.pinId) &&
      state.longitude >= bounds.west &&
      state.longitude <= bounds.east
    ) {
      states.set(state.pinId, state);
    }
  });
  countMapCost('owned_visible_documents', states.size);
  return states;
}

async function readNearbyBasePinCaptureValueStates(
  pins: readonly ClassifiedNearbyPin[]
): Promise<Map<string, BasePinCaptureValueState>> {
  const basePins = pins.filter((pin) => pin.type === "base");
  if (basePins.length === 0) return new Map();

  const db = getAdminFirestore();
  if (isSharedMapCacheEnabled()) {
    // Most visible pins have never been captured. Query the sparse existing
    // records in batches instead of billing one read per missing document.
    return readSparseBasePinCaptureValues(db, basePins.map((pin) => pin.pinId));
  }
  const refs = basePins.map((pin) =>
    db.collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION).doc(sharedWorldDocumentId(pin.pinId))
  );
  const snapshots = await db.getAll(...refs);
  const values = new Map<string, BasePinCaptureValueState>();

  snapshots.forEach((snapshot) => {
    const value = readBasePinCaptureValueState(snapshot.data());
    if (value) values.set(value.pinId, value);
  });

  return values;
}

async function reconcileNearbySharedBasePinOwnerProfiles(
  states: ReadonlyMap<string, SharedBasePinState>
): Promise<Map<string, SharedBasePinState>> {
  if (states.size === 0) return new Map();

  const db = getAdminFirestore();
  const ownerUids = [...new Set(
    [...states.values()].map((state) => state.ownerUid).filter(Boolean)
  )];
  const ownerSnapshots = await db.getAll(
    ...ownerUids.map((uid) => getPlayerDocumentRef(uid))
  );
  const ownerProfiles = new Map<string, { displayName?: unknown; avatarUrl?: unknown }>();
  ownerSnapshots.forEach((snapshot) => {
    const data = snapshot.data();
    if (data && typeof data.displayName === "string" && data.displayName.trim()) {
      ownerProfiles.set(snapshot.id, {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl
      });
    }
  });

  const reconciled = new Map<string, SharedBasePinState>();
  states.forEach((state, pinId) => {
    const corrected = reconcileSharedBasePinOwnerProfile(
      state,
      ownerProfiles.get(state.ownerUid)
    );
    reconciled.set(pinId, corrected);
  });

  return reconciled;
}

async function readNearbyPlayerHarvestStates(params: {
  uid: string;
  sharedStates: ReadonlyMap<string, SharedBasePinState>;
  harvestDay: string;
  now: Date;
}): Promise<Set<string>> {
  const activeCrops = [...params.sharedStates.values()].filter((state) =>
    state.plant !== null && isCropHarvestActive(state.plant, params.now)
  );
  if (activeCrops.length === 0) return new Set();

  const db = getAdminFirestore();
  const snapshots = await db.getAll(...activeCrops.map((state) =>
    db
      .collection("sharedBasePinHarvests")
      .doc(sharedWorldDocumentId(state.pinId))
      .collection("players")
      .doc(params.uid)
  ));
  const harvested = new Set<string>();

  snapshots.forEach((snapshot, index) => {
    const value = snapshot.data();
    const cropPlantedAt = value?.cropPlantedAt;
    const matchesCurrentCrop =
      cropPlantedAt?.toMillis?.() === activeCrops[index].plant?.plantedAt.getTime();
    if (value?.harvestDay === params.harvestDay && matchesCurrentCrop) {
      harvested.add(activeCrops[index].pinId);
    }
  });

  return harvested;
}

function getPinBounds(pins: readonly ClassifiedNearbyPin[]) {
  return pins.reduce((bounds, pin) => ({
    south: Math.min(bounds.south, pin.latitude),
    north: Math.max(bounds.north, pin.latitude),
    west: Math.min(bounds.west, pin.longitude),
    east: Math.max(bounds.east, pin.longitude)
  }), {
    south: Number.POSITIVE_INFINITY,
    north: Number.NEGATIVE_INFINITY,
    west: Number.POSITIVE_INFINITY,
    east: Number.NEGATIVE_INFINITY
  });
}

function wasRecentlyObserved(
  cache: Map<string, number>,
  key: string,
  now: Date
): boolean {
  const observedAt = cache.get(key);
  return observedAt !== undefined &&
    now.getTime() - observedAt < PASSIVE_MAP_CACHE_MEMORY_TTL_MILLISECONDS;
}

function rememberObservation(
  cache: Map<string, number>,
  key: string,
  now: Date
): void {
  cache.set(key, now.getTime());

  if (cache.size <= MAX_PASSIVE_MAP_CACHE_MEMORY_ENTRIES) return;

  const oldestKey = cache.keys().next().value;
  if (oldestKey) cache.delete(oldestKey);
}

function buildNearbyResponseCacheKey(params: {
  uid: string;
  latitude: number;
  longitude: number;
  now: Date;
}): string {
  // Matches the client viewport precision: small GPS drift returns the same
  // short-lived response, but moving to the next visible area loads fresh pins.
  return `${params.uid}|${params.now.toISOString().slice(0, 10)}|${getWaterFishCycle(params.now).key}|${params.latitude.toFixed(3)}|${params.longitude.toFixed(3)}`;
}

function rememberNearbyResponse(params: {
  key: string;
  response: unknown;
  now: Date;
  expiresAt?: number;
}): void {
  recentlyLoadedNearbyResponses.set(params.key, {
    response: params.response,
    expiresAt: Math.min(
      params.now.getTime() + NEARBY_RESPONSE_CACHE_TTL_MILLISECONDS,
      params.expiresAt ?? Infinity,
      getWaterFishCycle(params.now).expiresAt.getTime()
    )
  });

  if (recentlyLoadedNearbyResponses.size <= MAX_NEARBY_RESPONSE_CACHE_ENTRIES) return;

  const oldestKey = recentlyLoadedNearbyResponses.keys().next().value;
  if (oldestKey) recentlyLoadedNearbyResponses.delete(oldestKey);
}

function parseWayGeometry(value: unknown): CanonicalCoordinate[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const point = entry as { lat?: unknown; lon?: unknown } | null;
    return Number.isFinite(point?.lat) && Number.isFinite(point?.lon)
      ? [{ latitude: Number(point?.lat), longitude: Number(point?.lon) }]
      : [];
  });
}

function squaredDistance(pin: CanonicalBasePin, center: CanonicalCoordinate) {
  const longitudeScale = Math.cos((center.latitude * Math.PI) / 180);
  const latitudeDelta = pin.latitude - center.latitude;
  const longitudeDelta = (pin.longitude - center.longitude) * longitudeScale;
  return latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta;
}

function isRoadFeature(tags: unknown): boolean {
  const parsedTags = asTags(tags);
  return typeof parsedTags.highway === "string" ||
    parsedTags["disused:highway"] === "raceway";
}

function isWaterFeature(tags: unknown): boolean {
  const parsedTags = asTags(tags);
  return (
    parsedTags.natural === "water" ||
    parsedTags.natural === "coastline" ||
    typeof parsedTags.water === "string" ||
    parsedTags.waterway === "river" ||
    parsedTags.waterway === "stream" ||
    parsedTags.waterway === "canal" ||
    parsedTags.landuse === "reservoir" ||
    parsedTags.landuse === "basin"
  );
}

function asTags(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function isClosedWay(coordinates: readonly CanonicalCoordinate[]): boolean {
  if (coordinates.length < 4) return false;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return first.latitude === last.latitude && first.longitude === last.longitude;
}

function readPrivateAlphaOverpassEndpoints(): string[] {
  const candidates = [
    process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT,
    process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_FALLBACK_ENDPOINT,
    EMERGENCY_OVERPASS_FALLBACK_ENDPOINT
  ];
  const endpoints = new Set<string>();

  candidates.forEach((candidate) => {
    const value = candidate?.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      if (url.protocol === "https:") endpoints.add(url.toString());
    } catch {
      // An invalid optional fallback must never take the primary provider down.
    }
  });

  return [...endpoints];
}
