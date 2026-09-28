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
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
import {
  SHARED_POI_PINS_COLLECTION,
  sharedWorldDocumentId
} from "../domain/world/sharedWorld";
import { getAdminFirestore } from "../firebaseAdmin";
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

const POI_SEARCH_RADIUS_METRES = 5_000;
const MAX_NEARBY_POIS = 250;
const QUERY_TIMEOUT_MILLISECONDS = 20_000;

interface NearbyPoiSearchRequest {
  postOfficesOnly?: boolean;
  latitude: number;
  longitude: number;
  deviceId: string | undefined;
}

interface NearbyPoi {
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
}

interface OverpassPoiElement {
  id: unknown;
  type: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: unknown;
}

export function validateNearbyPoiSearchRequest(
  request: CallableRequest<unknown>
): NearbyPoiSearchRequest {
  const payload = asObject(request.data, "searchNearbyPois payload");
  assertAllowedKeys(
    payload,
    ["latitude", "longitude", "deviceId", "postOfficesOnly"],
    "searchNearbyPois payload"
  );

  if (payload.postOfficesOnly !== undefined && typeof payload.postOfficesOnly !== 'boolean') throw new HttpsError('invalid-argument', 'Invalid post office search mode');
  return {
    ...(payload.postOfficesOnly === true ? { postOfficesOnly: true } : {}),
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

export async function searchNearbyPoisHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({
    capability: "authoritative_pin_acquisition"
  });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "authoritative_pin_acquisition",
    uid: authContext.uid
  });

  const input = validateNearbyPoiSearchRequest(request);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError(
      "failed-precondition",
      "Create your GrowGo profile before searching for nearby POIs."
    );
  }

  if (input.postOfficesOnly) {
    const cell = postOfficeSearchCell(input.latitude, input.longitude);
    const ref = getAdminFirestore().collection('postOfficeDiscoveryCells').doc(cell.id);
    const saved = (await ref.get()).data();
    if (saved?.version === 1 && saved.expiresAt > Date.now() && Array.isArray(saved.pois)) return { ok: true, pois: saved.pois };
    const pois = await acquireNearbyPois({ ...input, latitude: cell.latitude, longitude: cell.longitude });
    await persistSharedPoiPins({ uid: authContext.uid, pois });
    await ref.set({ version: 1, expiresAt: Date.now() + 7 * 86400000, pois });
    return { ok: true, pois };
  }
  const pois = await acquireNearbyPois(input);
  await persistSharedPoiPins({ uid: authContext.uid, pois });

  return {
    ok: true,
    pois
  };
}

async function persistSharedPoiPins(params: {
  uid: string;
  pois: readonly NearbyPoi[];
}): Promise<void> {
  if (params.pois.length === 0) return;

  const db = getAdminFirestore();
  const refs = params.pois.map((poi) =>
    db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(poi.id))
  );
  const existingSnapshots = await db.getAll(...refs);
  const now = new Date();
  const changedPois = params.pois.filter((poi, index) => {
    const existing = existingSnapshots[index]?.data();
    return !existingSnapshots[index]?.exists ||
      existing?.schemaVersion !== 1 ||
      existing?.id !== poi.id ||
      existing?.name !== poi.name ||
      existing?.category !== poi.category ||
      existing?.subcategory !== poi.subcategory ||
      existing?.rarity !== poi.rarity ||
      existing?.icon !== poi.icon ||
      Number(existing?.lat) !== poi.lat ||
      Number(existing?.lng) !== poi.lng ||
      existing?.description !== poi.description ||
      existing?.poiName !== poi.poiName ||
      existing?.poiCategory !== poi.poiCategory ||
      existing?.isSpecial !== poi.isSpecial ||
      existing?.cardRewardSetId !== poi.cardRewardSetId;
  });
  if (changedPois.length === 0) return;

  const batch = db.batch();
  changedPois.forEach((poi) => {
    batch.set(
      db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(poi.id)),
      {
        schemaVersion: 1,
        ...poi,
        discoveredByUid: params.uid,
        discoveredAt: now,
        updatedAt: now
      },
      { merge: true }
    );
  });
  await batch.commit();
}

export const searchNearbyPois = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  searchNearbyPoisHandler
);

async function acquireNearbyPois(input: NearbyPoiSearchRequest): Promise<NearbyPoi[]> {
  const endpoint = readPrivateAlphaOverpassEndpoint();
  if (!endpoint) {
    throw new HttpsError("unavailable", "Nearby POI search is unavailable right now.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MILLISECONDS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: input.postOfficesOnly ? buildPostOfficeQuery(input.latitude, input.longitude) : buildNearbyPoiQuery(input.latitude, input.longitude),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new HttpsError("unavailable", "Nearby POI search is unavailable right now.");
    }

    const payload = await response.json() as { remark?: unknown; elements?: unknown };
    if (input.postOfficesOnly && (!payload || payload.remark || !Array.isArray(payload.elements) || payload.elements.length > MAX_NEARBY_POIS))
      throw new HttpsError('unavailable', 'Post office lookup was incomplete. Please try again later.');
    const pois = extractNearbyPoiPins(payload);
    return input.postOfficesOnly ? pois.filter(p => p.subcategory === 'Post Office') : pois;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unavailable", "Nearby POI search is unavailable right now.");
  } finally {
    clearTimeout(timeout);
  }
}

export function postOfficeSearchCell(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) throw Error('Invalid location');
  const lat = Math.round(latitude * 20), lng = Math.round(longitude * 20);
  return { id: `${lat}_${lng}`, latitude: lat / 20, longitude: lng / 20 };
}
export function buildPostOfficeQuery(latitude: number, longitude: number) {
  postOfficeSearchCell(latitude, longitude);
  return `[out:json][timeout:18];nwr["amenity"="post_office"](around:5000,${latitude},${longitude});out tags center 251;`;
}

export function buildNearbyPoiQuery(latitude: number, longitude: number) {
  return `[out:json][timeout:18];(nwr["amenity"="place_of_worship"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["amenity"="hospital"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["amenity"="cinema"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["building"="cinema"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["historic"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["tourism"~"^(attraction|museum|gallery|viewpoint|artwork|information)$"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["leisure"~"^(park|garden|nature_reserve)$"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["boundary"="national_park"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude});nwr["man_made"~"^(lighthouse|tower|water_tower|obelisk)$"](around:${POI_SEARCH_RADIUS_METRES},${latitude},${longitude}););out tags center ${MAX_NEARBY_POIS};`;
}

export function extractNearbyPoiPins(payload: unknown): NearbyPoi[] {
  const elements = Array.isArray((payload as { elements?: unknown } | null)?.elements)
    ? (payload as { elements: unknown[] }).elements
    : [];
  const candidates: Array<{
    id: string;
    type: "node" | "way" | "relation";
    latitude: number;
    longitude: number;
    tags: Record<string, unknown>;
    name: string;
  }> = [];

  for (const value of elements) {
    const element = value as OverpassPoiElement;
    const id = typeof element.id === "number" || typeof element.id === "string"
      ? String(element.id)
      : "";
    const type = typeof element.type === "string" ? element.type : "";
    const latitude = typeof element.lat === "number" ? element.lat : element.center?.lat;
    const longitude = typeof element.lon === "number" ? element.lon : element.center?.lon;

    if (!/^(node|way|relation)$/.test(type) || !/^[1-9]\d{0,18}$/.test(id)) continue;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const tags = asTags(element.tags);
    if (!resolvePoiCategory(tags, false)) continue;
    const name = typeof tags.name === "string" && tags.name.trim()
      ? tags.name.trim()
      : typeof tags["name:en"] === "string" && tags["name:en"].trim()
        ? tags["name:en"].trim()
        : "Point of Interest";
    const poiId = `poi:osm:${type}:${id}`;

    candidates.push({
      id: poiId,
      type: type as "node" | "way" | "relation",
      latitude: Number(latitude),
      longitude: Number(longitude),
      tags,
      name
    });
  }

  const majorMuseumIds = selectMajorMuseumIds(candidates);
  const pois = new Map<string, NearbyPoi>();

  candidates.forEach((candidate) => {
    const category = resolvePoiCategory(candidate.tags, majorMuseumIds.has(candidate.id));
    if (!category) return;

    const name = candidate.name === "Point of Interest"
      ? category.subcategory
      : candidate.name;

    pois.set(candidate.id, {
      id: candidate.id,
      type: "poi",
      name,
      category: category.collection,
      subcategory: category.subcategory,
      rarity: category.rarity,
      icon: category.icon,
      lat: candidate.latitude,
      lng: candidate.longitude,
      description: category.description,
      poiName: name,
      poiCategory: category.subcategory,
      ...(category.isSpecial ? { isSpecial: true as const } : {}),
      ...(category.cardRewardSetId ? { cardRewardSetId: category.cardRewardSetId } : {})
    });
  });

  return [...pois.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, MAX_NEARBY_POIS);
}

function resolvePoiCategory(value: unknown, isMajorMuseum: boolean): {
  collection: NearbyPoi["category"];
  subcategory: NearbyPoi["subcategory"];
  icon: NearbyPoi["icon"];
  rarity: NearbyPoi["rarity"];
  isSpecial?: true;
  cardRewardSetId?: NearbyPoi["cardRewardSetId"];
  description: string;
} | null {
  const tags = asTags(value);
  if (tags.amenity === 'post_office') {
    if (tags.disused === 'yes' || tags.abandoned === 'yes' || tags['disused:amenity'] || tags['abandoned:amenity']) return null;
    return normalPoiCategory('Places', 'Post Office', 'landmark');
  }
  if (tags.amenity === "cinema" || tags.building === "cinema") {
    return {
      ...normalPoiCategory("Tourist Attractions", "Movie Theater", "tourist"),
      cardRewardSetId: "land-of-oz",
      description: "A movie theater. Capture it to discover a Land of Oz card."
    };
  }
  if (isMajorMuseum && tags.tourism === "museum") {
    return {
      collection: "Special POIs",
      subcategory: "Major Museum",
      icon: "museum",
      rarity: "special",
      isSpecial: true,
      cardRewardSetId: "dinosaur-discoveries",
      description: "A major museum. Collect it once to discover a Dinosaur Discoveries card."
    };
  }
  if (tags.amenity === "place_of_worship") {
    return normalPoiCategory("Places", "Church", "church");
  }
  if (tags.amenity === "hospital") {
    return normalPoiCategory("Places", "Hospital", "landmark");
  }
  if (typeof tags.historic === "string") {
    return normalPoiCategory("Tourist Attractions", "Historic", "historic");
  }
  if (
    tags.leisure === "park" ||
    tags.leisure === "garden" ||
    tags.leisure === "nature_reserve" ||
    tags.boundary === "national_park"
  ) {
    return normalPoiCategory("Places", "Park", "park");
  }
  if (
    tags.man_made === "lighthouse" ||
    tags.man_made === "tower" ||
    tags.man_made === "water_tower" ||
    tags.man_made === "obelisk"
  ) {
    return normalPoiCategory("Places", "Landmark", "landmark");
  }
  if (typeof tags.tourism === "string") {
    return normalPoiCategory("Tourist Attractions", "Local POI", "tourist");
  }
  return null;
}

function normalPoiCategory(
  collection: NearbyPoi["category"],
  subcategory: NearbyPoi["subcategory"],
  icon: NearbyPoi["icon"]
) {
  return {
    collection,
    subcategory,
    icon,
    rarity: "normal" as const,
    description: `${subcategory} from OpenStreetMap.`
  };
}

function selectMajorMuseumIds(candidates: ReadonlyArray<{
  id: string;
  latitude: number;
  longitude: number;
  tags: Record<string, unknown>;
  name: string;
}>): Set<string> {
  const grouped = new Map<string, Array<(typeof candidates)[number]>>();

  candidates.forEach((candidate) => {
    if (candidate.tags.tourism !== "museum" || candidate.name === "Point of Interest") return;

    const cityKey = getMuseumCityKey(candidate.tags, candidate.latitude, candidate.longitude);
    const group = grouped.get(cityKey) || [];
    group.push(candidate);
    grouped.set(cityKey, group);
  });

  const selected = new Set<string>();
  grouped.forEach((museums) => {
    museums
      .slice()
      .sort((left, right) => {
        const scoreDifference = getMajorMuseumScore(right) - getMajorMuseumScore(left);
        return scoreDifference || left.id.localeCompare(right.id);
      })
      .slice(0, 2)
      .forEach((museum) => selected.add(museum.id));
  });

  return selected;
}

function getMuseumCityKey(tags: Record<string, unknown>, latitude: number, longitude: number): string {
  const listedCity = [tags["addr:city"], tags["is_in:city"]]
    .find((value) => typeof value === "string" && value.trim());
  if (typeof listedCity === "string") {
    return `city:${listedCity.trim().toLowerCase()}`;
  }

  // OSM museums often lack a city tag. A 0.2 degree zone keeps nearby city
  // scans together while still allowing each city to have its own two POIs.
  return `zone:${Math.round(latitude * 5) / 5}:${Math.round(longitude * 5) / 5}`;
}

function getMajorMuseumScore(candidate: {
  tags: Record<string, unknown>;
  name: string;
}): number {
  const tags = candidate.tags;
  const name = candidate.name.toLowerCase();
  let score = 1;

  if (typeof tags.wikidata === "string") score += 5;
  if (typeof tags.wikipedia === "string") score += 4;
  if (typeof tags.website === "string" || typeof tags["contact:website"] === "string") score += 2;
  if (typeof tags.operator === "string" || typeof tags["heritage:operator"] === "string") score += 1;
  if (/\b(national|state|city|science|natural history|art gallery|museum)\b/.test(name)) score += 2;
  if (/\b(dinosaur|fossil|paleontolog)/.test(name)) score += 3;

  return score;
}

function asTags(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readPrivateAlphaOverpassEndpoint(): string | null {
  const value = process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
