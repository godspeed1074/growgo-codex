import { createHash, randomBytes } from "node:crypto";
import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { verifyActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";
import { markMapDirectoryChanged, MAP_DIRECTORY_VERSIONS } from "../domain/world/mapDirectoryReads";
import { readSharedCache, readOptimizationEnabled } from "../infrastructure/sharedReadCache";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import {
  ALPHA_PEW_PEW_TEST_KIT_ID,
  getPewPewChargeState,
  PEW_PEW_DAILY_TEST_CHARGES
} from "./alphaPewPewTestKit";
import { getGrowGoUtcDayKey } from "../domain/leaderboards/leaderboardPeriods";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireIsoTimestamp,
  requireRequestId,
  requireString
} from "../validation/requestValidation";

const FARMER_MARKETS_COLLECTION = "farmerMarkets";
const FARMER_MARKET_HOSTS_COLLECTION = "farmerMarketHosts";
const FARMER_MARKET_REQUESTS_COLLECTION = "farmerMarketRequests";
const FARMER_MARKET_CHECK_IN_TICKETS_COLLECTION = "farmerMarketCheckInTickets";
const FARMER_MARKET_EVENT_PEW_PEW_PASSES_COLLECTION = "farmerMarketEventPewPewPasses";
const FARMER_MARKET_RSVP_STATES_COLLECTION = "farmerMarketRsvpStates";
const FARMER_MARKET_SCHEMA_VERSION = 1;
const FARMER_MARKET_HOST_LEVEL = 10;
const FARMER_MARKET_MAX_ACTIVE_OR_UPCOMING_PER_HOST = 2;
const FARMER_MARKET_MAX_DURATION_MS = 4 * 60 * 60 * 1_000;
const FARMER_MARKET_START_GRACE_MS = 2 * 60 * 1_000;
const FARMER_MARKET_DIRECTORY_LIMIT = 100;
export const FARMER_MARKET_CHECK_IN_RADIUS_METRES = 100;
export const FARMER_MARKET_CHECK_IN_MAX_ACCURACY_METRES = 100;
export const FARMER_MARKET_CHECK_IN_QR_ROTATION_MS = 10 * 60 * 1_000;
export const FARMER_MARKET_EVENT_PEW_PEW_CHARGES = 5;

type FarmerMarketTier = 1 | 2 | 3 | 4;
type FarmerMarketStatus = "upcoming" | "active";

interface CreateFarmerMarketInput {
  requestId: string;
  name: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  latitude: number;
  longitude: number;
  tier: FarmerMarketTier;
  deviceId?: string;
}

interface SafeFarmerMarket {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  latitude: number;
  longitude: number;
  tier: FarmerMarketTier;
  status: FarmerMarketStatus;
  hostName: string;
  hostAvatarUrl: string | null;
  isHost: boolean;
  attendeeCount: number;
  willAttendCount: number;
  tierUpgradeAvailable: boolean;
  checkedIn: boolean;
  willAttend: boolean;
}

interface FarmerMarketLocation {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
}

interface FarmerMarketEventPewPewPass {
  marketId: string;
  marketName: string;
  endsAt: Date;
  chargesAvailable: number;
}

function marketRef(id: string) {
  return getAdminFirestore().collection(FARMER_MARKETS_COLLECTION).doc(id);
}

function hostStateRef(uid: string) {
  return getAdminFirestore().collection(FARMER_MARKET_HOSTS_COLLECTION).doc(uid);
}

function requestRef(uid: string, requestId: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_REQUESTS_COLLECTION)
    .doc(hashValue(`${uid}|${requestId}`));
}

function attendanceRef(marketId: string, uid: string) {
  return marketRef(marketId).collection("attendees").doc(uid);
}

function rsvpRef(marketId: string, uid: string) {
  return marketRef(marketId).collection("rsvps").doc(uid);
}

function rsvpStateRef(uid: string) {
  return getAdminFirestore().collection(FARMER_MARKET_RSVP_STATES_COLLECTION).doc(uid);
}

function checkInTicketRef(marketId: string, presenterUid: string, epoch: number) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_CHECK_IN_TICKETS_COLLECTION)
    .doc(hashValue(`${marketId}|${presenterUid}|${epoch}`));
}

function checkInTokenRef(marketId: string, token: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_CHECK_IN_TICKETS_COLLECTION)
    .doc(hashValue(`${marketId}|token|${token}`));
}

export function getFarmerMarketEventPewPewPassRef(uid: string) {
  return getAdminFirestore().collection(FARMER_MARKET_EVENT_PEW_PEW_PASSES_COLLECTION).doc(uid);
}

function getAlphaPewPewRewardRef(uid: string) {
  return getAdminFirestore()
    .collection("playerRewardGrants")
    .doc(uid)
    .collection("rewards")
    .doc(ALPHA_PEW_PEW_TEST_KIT_ID);
}

function getAlphaPewPewChargeStateRef(uid: string) {
  return getAdminFirestore()
    .collection("playerToyChargeStates")
    .doc(uid)
    .collection("toys")
    .doc("pew-pew-2-2");
}

function hashValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function createMarketId() {
  return `FM${randomBytes(7).toString("hex").toUpperCase()}`;
}

function normalizePublicText(value: unknown, label: string, maxLength: number): string {
  const normalized = requireString(value, label, 1, maxLength)
    .replace(/\s+/g, " ")
    .trim();
  if (/[\u0000-\u001f<>]/.test(normalized)) {
    throw new HttpsError("invalid-argument", `${label} contains unsupported characters.`);
  }
  return normalized;
}

function normalizeOptionalPublicText(value: unknown, label: string, maxLength: number): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${label} must be a string.`);
  }
  if (value.trim().length === 0) return "";
  return normalizePublicText(value, label, maxLength);
}

function readTier(value: unknown): FarmerMarketTier {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  throw new HttpsError("invalid-argument", "Choose a valid Farmer Market tier.");
}

function readFarmerMarketLocation(payload: Record<string, unknown>, label: string): FarmerMarketLocation {
  const latitude = requireFiniteNumber(payload.latitude, "latitude", -90, 90);
  const longitude = requireFiniteNumber(payload.longitude, "longitude", -180, 180);
  const accuracyMetres = requireFiniteNumber(
    payload.accuracyMetres,
    "accuracyMetres",
    0,
    FARMER_MARKET_CHECK_IN_MAX_ACCURACY_METRES
  );
  return { latitude, longitude, accuracyMetres };
}

function assertPlayerIsAtMarket(market: DocumentData, location: FarmerMarketLocation) {
  const marketLatitude = Number(market.latitude);
  const marketLongitude = Number(market.longitude);
  const distance = calculateHaversineDistanceMetres(
    { latitude: location.latitude, longitude: location.longitude },
    { latitude: marketLatitude, longitude: marketLongitude }
  );
  if (distance > FARMER_MARKET_CHECK_IN_RADIUS_METRES) {
    throw new HttpsError(
      "failed-precondition",
      "Move within 100 m of this Farmer Market to check in or show its code."
    );
  }
}

function assertActiveFarmerMarket(market: DocumentData, now: Date) {
  const startsAt = timestampToDate(market.startsAt);
  const endsAt = timestampToDate(market.endsAt);
  if (!startsAt || !endsAt || startsAt.getTime() > now.getTime() || endsAt.getTime() <= now.getTime()) {
    throw new HttpsError("failed-precondition", "This Farmer Market is not live right now.");
  }
  return { startsAt, endsAt };
}

function currentCheckInEpoch(now: Date) {
  return Math.floor(now.getTime() / FARMER_MARKET_CHECK_IN_QR_ROTATION_MS);
}

function createCheckInToken() {
  // Short enough to scan easily, while still being random and server-stored.
  return randomBytes(12).toString("base64url");
}

function normalizeMarketId(value: unknown): string {
  const marketId = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^FM[A-F0-9]{14}$/.test(marketId)) {
    throw new HttpsError("invalid-argument", "That Farmer Market code is not valid.");
  }
  return marketId;
}

function readRsvpRequest(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "setFarmerMarketWillAttend payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "marketId", "willAttend"],
    "setFarmerMarketWillAttend payload"
  );
  if (typeof payload.willAttend !== "boolean") {
    throw new HttpsError("invalid-argument", "Choose whether you will attend this Farmer Market.");
  }
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    marketId: normalizeMarketId(payload.marketId),
    willAttend: payload.willAttend
  };
}

function readEventPewPewPasses(value: unknown, now: Date): FarmerMarketEventPewPewPass[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const rawPasses = (value as Record<string, unknown>).passes;
  if (!rawPasses || typeof rawPasses !== "object" || Array.isArray(rawPasses)) return [];
  return Object.entries(rawPasses as Record<string, unknown>).flatMap(([marketId, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value) || !/^FM[A-F0-9]{14}$/.test(marketId)) {
      return [];
    }
    const record = value as Record<string, unknown>;
    const endsAt = timestampToDate(record.endsAt);
    const chargesAvailable = Number(record.chargesAvailable);
    const marketName = typeof record.marketName === "string" ? record.marketName.trim() : "Farmer Market";
    if (!endsAt || endsAt.getTime() <= now.getTime() || !Number.isSafeInteger(chargesAvailable)) return [];
    return [{
      marketId,
      marketName: marketName || "Farmer Market",
      endsAt,
      chargesAvailable: Math.max(0, Math.min(FARMER_MARKET_EVENT_PEW_PEW_CHARGES, chargesAvailable))
    }];
  });
}

export function getActiveFarmerMarketEventPewPewPass(value: unknown, now: Date) {
  return readEventPewPewPasses(value, now)
    .filter((pass) => pass.chargesAvailable > 0)
    .sort((left, right) => left.endsAt.getTime() - right.endsAt.getTime())[0] || null;
}

function readCreateInput(request: CallableRequest<unknown>): CreateFarmerMarketInput {
  const payload = asObject(request.data, "createFarmerMarket payload");
  assertAllowedKeys(
    payload,
    [
      "requestId",
      "deviceId",
      "name",
      "description",
      "startsAt",
      "endsAt",
      "latitude",
      "longitude",
      "tier"
    ],
    "createFarmerMarket payload"
  );

  const startsAt = new Date(requireIsoTimestamp(payload.startsAt, "startsAt"));
  const endsAt = new Date(requireIsoTimestamp(payload.endsAt, "endsAt"));
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
    throw new HttpsError("invalid-argument", "Choose a valid local market date and time.");
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new HttpsError("invalid-argument", "The market must end after it starts.");
  }
  if (endsAt.getTime() - startsAt.getTime() > FARMER_MARKET_MAX_DURATION_MS) {
    throw new HttpsError("invalid-argument", "A Farmer Market can run for up to 4 hours.");
  }
  if (startsAt.getTime() < Date.now() - FARMER_MARKET_START_GRACE_MS) {
    throw new HttpsError("invalid-argument", "Choose a market start time that has not already passed.");
  }

  return {
    requestId: requireRequestId(payload.requestId),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    name: normalizePublicText(payload.name, "Market name", 40),
    description: normalizeOptionalPublicText(payload.description, "Market information", 200),
    startsAt,
    endsAt,
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    tier: readTier(payload.tier)
  };
}

async function requireFarmerMarketPlayer(request: CallableRequest<unknown>, deviceId?: string) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  await verifyActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before using Farmer Markets.");
  }
  const player = readStoredPlayerDocument(playerSnapshot.data());
  if (!player.profileComplete || !player.displayName) {
    throw new HttpsError("failed-precondition", "Complete your GrowGo profile before using Farmer Markets.");
  }
  return { uid: authContext.uid, player };
}

function timestampToDate(value: unknown, fallback: Date | null = null): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return fallback;
}

function asStoredMarket(document: { id: string; data(): DocumentData | undefined }): DocumentData {
  const data = document.data();
  if (!data || data.schemaVersion !== FARMER_MARKET_SCHEMA_VERSION) {
    throw new HttpsError("internal", "Stored Farmer Market data is invalid.");
  }
  return data;
}

function serializeFarmerMarket(params: {
  id: string;
  data: DocumentData;
  viewerUid: string;
  now: Date;
  checkedIn?: boolean;
  willAttend?: boolean;
}): SafeFarmerMarket | null {
  const startsAt = timestampToDate(params.data.startsAt);
  const endsAt = timestampToDate(params.data.endsAt);
  const latitude = Number(params.data.latitude);
  const longitude = Number(params.data.longitude);
  const tier = params.data.tier;
  const hostUid = typeof params.data.hostUid === "string" ? params.data.hostUid : "";
  const name = typeof params.data.name === "string" ? params.data.name.trim() : "";
  const description = typeof params.data.description === "string" ? params.data.description.trim() : "";

  if (!startsAt || !endsAt || !name || !hostUid ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    ![1, 2, 3, 4].includes(tier)) {
    return null;
  }
  if (endsAt.getTime() <= params.now.getTime()) return null;

  const isHost = hostUid === params.viewerUid;
  // Hosts are always counted as planning to attend. Existing markets created
  // before this field was introduced receive the same sensible default.
  const storedWillAttendCount = Number.isSafeInteger(params.data.willAttendCount) && params.data.willAttendCount >= 0
    ? params.data.willAttendCount
    : 0;
  const willAttendCount = params.data.hostWillAttend === false
    ? storedWillAttendCount
    : Math.max(1, storedWillAttendCount);
  return {
    id: params.id,
    name,
    description,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    latitude,
    longitude,
    tier: tier as FarmerMarketTier,
    status: startsAt.getTime() <= params.now.getTime() ? "active" : "upcoming",
    hostName: typeof params.data.hostName === "string" && params.data.hostName.trim()
      ? params.data.hostName.trim()
      : "GrowGo player",
    hostAvatarUrl: typeof params.data.hostAvatarUrl === "string" ? params.data.hostAvatarUrl : null,
    isHost,
    attendeeCount: Number.isSafeInteger(params.data.attendeeCount) && params.data.attendeeCount >= 0
      ? params.data.attendeeCount
      : 0,
    willAttendCount,
    // A real Tier 2–4 upgrade needs a verified mobile-store receipt. The UI
    // can show the host where this control belongs without accepting money or
    // upgrading a market client-side.
    tierUpgradeAvailable: isHost && startsAt.getTime() > params.now.getTime() && tier < 4,
    checkedIn: params.checkedIn === true,
    willAttend: isHost || params.willAttend === true
  };
}

function readActiveRsvpMarketIds(value: unknown, now: Date): Set<string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Set();
  const marketIds = (value as Record<string, unknown>).marketIds;
  if (!marketIds || typeof marketIds !== "object" || Array.isArray(marketIds)) return new Set();

  return new Set(Object.entries(marketIds as Record<string, unknown>).flatMap(([marketId, entry]) => {
    if (!/^FM[A-F0-9]{14}$/.test(marketId) || !entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }
    const endsAt = timestampToDate((entry as Record<string, unknown>).endsAt);
    return endsAt && endsAt.getTime() > now.getTime() ? [marketId] : [];
  }));
}

function readActiveRsvpState(value: unknown, now: Date): Record<string, { endsAt: Timestamp }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const marketIds = (value as Record<string, unknown>).marketIds;
  if (!marketIds || typeof marketIds !== "object" || Array.isArray(marketIds)) return {};

  return Object.entries(marketIds as Record<string, unknown>).reduce<Record<string, { endsAt: Timestamp }>>(
    (result, [marketId, entry]) => {
      if (!/^FM[A-F0-9]{14}$/.test(marketId) || !entry || typeof entry !== "object" || Array.isArray(entry)) {
        return result;
      }
      const endsAt = timestampToDate((entry as Record<string, unknown>).endsAt);
      if (endsAt && endsAt.getTime() > now.getTime()) {
        result[marketId] = { endsAt: Timestamp.fromDate(endsAt) };
      }
      return result;
    },
    {}
  );
}

function readHostMarketIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string" && /^FM[A-F0-9]{14}$/.test(id))
    : [];
}

export async function createFarmerMarketHandler(request: CallableRequest<unknown>) {
  const input = readCreateInput(request);
  const context = await requireFarmerMarketPlayer(request, input.deviceId);

  if (context.player.level < FARMER_MARKET_HOST_LEVEL) {
    throw new HttpsError(
      "failed-precondition",
      `Reach level ${FARMER_MARKET_HOST_LEVEL} before creating a Farmer Market.`
    );
  }
  if (input.tier !== 1) {
    throw new HttpsError(
      "failed-precondition",
      "Tier 2–4 markets need a verified in-app payment. Start with the free Tier 1 market for now."
    );
  }

  const db = getAdminFirestore();
  const now = Timestamp.now();
  const hostRef = hostStateRef(context.uid);
  const submissionRef = requestRef(context.uid, input.requestId);

  const result = await db.runTransaction(async (transaction) => {
    const [hostSnapshot, submissionSnapshot] = await Promise.all([
      transaction.get(hostRef),
      transaction.get(submissionRef)
    ]);

    if (submissionSnapshot.exists) {
      const replay = submissionSnapshot.data()?.response;
      if (replay && typeof replay === "object") return replay as { market: SafeFarmerMarket };
      throw new HttpsError("already-exists", "This Farmer Market request was already submitted.");
    }

    const existingIds = readHostMarketIds(hostSnapshot.data()?.marketIds);
    const existingRefs = existingIds.map((id) => marketRef(id));
    const existingSnapshots = await Promise.all(existingRefs.map((ref) => transaction.get(ref)));
    const activeMarketIds = existingSnapshots.flatMap((snapshot, index) => {
      if (!snapshot.exists) return [];
      const endsAt = timestampToDate(snapshot.data()?.endsAt);
      return endsAt && endsAt.getTime() > now.toMillis() ? [existingIds[index]] : [];
    });

    if (activeMarketIds.length >= FARMER_MARKET_MAX_ACTIVE_OR_UPCOMING_PER_HOST) {
      throw new HttpsError(
        "resource-exhausted",
        "You can have up to 2 upcoming or active Farmer Markets at a time."
      );
    }

    let marketId = createMarketId();
    let marketSnapshot = await transaction.get(marketRef(marketId));
    for (let attempt = 0; marketSnapshot.exists && attempt < 4; attempt += 1) {
      marketId = createMarketId();
      marketSnapshot = await transaction.get(marketRef(marketId));
    }
    if (marketSnapshot.exists) {
      throw new HttpsError("aborted", "Could not reserve a Farmer Market. Please try again.");
    }

    const createdAt = now;
    const marketData = {
      schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
      name: input.name,
      description: input.description,
      startsAt: Timestamp.fromDate(input.startsAt),
      endsAt: Timestamp.fromDate(input.endsAt),
      latitude: input.latitude,
      longitude: input.longitude,
      tier: input.tier,
      hostUid: context.uid,
      hostName: context.player.displayName,
      hostAvatarUrl: context.player.avatarUrl || null,
      attendeeCount: 0,
      hostWillAttend: true,
      willAttendCount: 1,
      createdAt,
      updatedAt: createdAt
    };
    const market = serializeFarmerMarket({
      id: marketId,
      data: marketData,
      viewerUid: context.uid,
      now: now.toDate(),
      willAttend: true
    });
    if (!market) throw new HttpsError("internal", "Could not prepare the Farmer Market.");

    transaction.create(marketRef(marketId), marketData);
    markMapDirectoryChanged(transaction, db, "markets");
    transaction.set(hostRef, {
      schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
      marketIds: [...activeMarketIds, marketId],
      updatedAt: createdAt
    });
    const response = { ok: true, requestId: input.requestId, market };
    transaction.create(submissionRef, {
      schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
      requestId: input.requestId,
      response,
      createdAt
    });
    return response;
  });

  return result;
}

/**
 * RSVPs are deliberately separate from on-site attendance. A player can plan
 * to attend from anywhere, but only the existing GPS-and-QR check-in can
 * unlock an event pass or increase the verified attendee total.
 */
export async function setFarmerMarketWillAttendHandler(request: CallableRequest<unknown>) {
  const input = readRsvpRequest(request);
  const context = await requireFarmerMarketPlayer(request, input.deviceId);
  const db = getAdminFirestore();
  const now = new Date();
  const selectedMarketRef = marketRef(input.marketId);
  const selectedRsvpRef = rsvpRef(input.marketId, context.uid);
  const viewerRsvpStateRef = rsvpStateRef(context.uid);

  const result = await db.runTransaction(async (transaction) => {
    const [marketSnapshot, rsvpSnapshot, stateSnapshot] = await Promise.all([
      transaction.get(selectedMarketRef),
      transaction.get(selectedRsvpRef),
      transaction.get(viewerRsvpStateRef)
    ]);
    if (!marketSnapshot.exists) throw new HttpsError("not-found", "This Farmer Market is no longer available.");
    const market = asStoredMarket(marketSnapshot);
    const startsAt = timestampToDate(market.startsAt);
    const endsAt = timestampToDate(market.endsAt);
    if (!startsAt || !endsAt || endsAt.getTime() <= now.getTime()) {
      throw new HttpsError("failed-precondition", "This Farmer Market has already ended.");
    }
    if (startsAt.getTime() <= now.getTime()) {
      throw new HttpsError("failed-precondition", "The Will attend list closes when this Farmer Market begins.");
    }

    const isHost = market.hostUid === context.uid;
    if (isHost && !input.willAttend) {
      throw new HttpsError("failed-precondition", "The market host is always marked as planning to attend.");
    }
    const currentlyAttending = isHost || rsvpSnapshot.exists;
    const storedWillAttendCount = Number.isSafeInteger(market.willAttendCount) && market.willAttendCount >= 0
      ? market.willAttendCount
      : 0;
    const willAttendCount = market.hostWillAttend === false
      ? storedWillAttendCount
      : Math.max(1, storedWillAttendCount);
    const nextState = readActiveRsvpState(stateSnapshot.data(), now);
    const updatedAt = Timestamp.fromDate(now);
    let nextWillAttendCount = willAttendCount;

    if (input.willAttend && !currentlyAttending) {
      transaction.create(selectedRsvpRef, {
        schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
        uid: context.uid,
        displayName: context.player.displayName,
        avatarUrl: context.player.avatarUrl || null,
        createdAt: updatedAt,
        updatedAt
      });
      nextWillAttendCount += 1;
    } else if (!input.willAttend && currentlyAttending) {
      transaction.delete(selectedRsvpRef);
      delete nextState[input.marketId];
      nextWillAttendCount = Math.max(1, willAttendCount - 1);
    }

    // Keep the viewer's direct RSVP index self-healing. The directory reads
    // only this one small document, rather than scanning every market RSVP.
    if (input.willAttend) {
      nextState[input.marketId] = { endsAt: Timestamp.fromDate(endsAt) };
    } else {
      delete nextState[input.marketId];
    }

    transaction.update(selectedMarketRef, {
      hostWillAttend: true,
      willAttendCount: nextWillAttendCount,
      updatedAt
    });
    markMapDirectoryChanged(transaction, db, "markets");

    transaction.set(viewerRsvpStateRef, {
      schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
      marketIds: nextState,
      updatedAt
    });

    const nextWillAttend = isHost || input.willAttend;

    return {
      ok: true,
      market: serializeFarmerMarket({
        id: input.marketId,
        data: { ...market, willAttendCount: nextWillAttendCount },
        viewerUid: context.uid,
        now,
        willAttend: nextWillAttend
      })
    };
  });

  return result;
}

function readCheckInCodeRequest(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "getFarmerMarketCheckInCode payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "marketId", "latitude", "longitude", "accuracyMetres"],
    "getFarmerMarketCheckInCode payload"
  );
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    marketId: normalizeMarketId(payload.marketId),
    location: readFarmerMarketLocation(payload, "getFarmerMarketCheckInCode payload")
  };
}

function readCheckInRequest(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "checkInToFarmerMarket payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "qrPayload", "latitude", "longitude", "accuracyMetres"],
    "checkInToFarmerMarket payload"
  );
  const rawCode = typeof payload.qrPayload === "string" ? payload.qrPayload.trim() : "";
  const match = /^GGM1:(FM[A-F0-9]{14}):([A-Za-z0-9_-]{12,32})$/.exec(rawCode);
  if (!match) throw new HttpsError("invalid-argument", "That Farmer Market code is not valid.");
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    marketId: match[1],
    token: match[2],
    location: readFarmerMarketLocation(payload, "checkInToFarmerMarket payload")
  };
}

function serializeFarmerMarketEventPewPewStatus(params: {
  pass: FarmerMarketEventPewPewPass | null;
  normalChargesAvailable: number;
  normalDailyCharges: number;
  normalBonusCharges: number;
  permanentOwned: boolean;
}) {
  const eventChargesAvailable = params.pass?.chargesAvailable || 0;
  return {
    owned: params.permanentOwned || eventChargesAvailable > 0,
    permanentOwned: params.permanentOwned,
    mode: eventChargesAvailable > 0 ? "farmer-market" : "live-alpha",
    chargesAvailable: eventChargesAvailable + Math.max(0, params.normalChargesAvailable),
    eventChargesAvailable,
    regularChargesAvailable: Math.max(0, params.normalChargesAvailable),
    dailyCharges: Math.max(0, params.normalDailyCharges),
    bonusCharges: Math.max(0, params.normalBonusCharges),
    eventPass: params.pass
      ? {
          marketId: params.pass.marketId,
          marketName: params.pass.marketName,
          endsAt: params.pass.endsAt.toISOString(),
          chargesAvailable: params.pass.chargesAvailable,
          maximumCharges: FARMER_MARKET_EVENT_PEW_PEW_CHARGES
        }
      : null
  };
}

/**
 * Hosts seed an event's check-in chain. Once a player has checked in, they can
 * show this same time-limited code to another attendee while they are both at
 * the market. The server checks the presenter's eligibility, live event, and
 * GPS location before emitting a code.
 */
export async function getFarmerMarketCheckInCodeHandler(request: CallableRequest<unknown>) {
  const input = readCheckInCodeRequest(request);
  const context = await requireFarmerMarketPlayer(request, input.deviceId);
  const db = getAdminFirestore();
  const now = new Date();
  const epoch = currentCheckInEpoch(now);
  const ticketRef = checkInTicketRef(input.marketId, context.uid, epoch);
  const selectedMarketRef = marketRef(input.marketId);
  const presenterAttendanceRef = attendanceRef(input.marketId, context.uid);

  const result = await db.runTransaction(async (transaction) => {
    const [marketSnapshot, attendanceSnapshot, existingTicketSnapshot] = await Promise.all([
      transaction.get(selectedMarketRef),
      transaction.get(presenterAttendanceRef),
      transaction.get(ticketRef)
    ]);
    if (!marketSnapshot.exists) throw new HttpsError("not-found", "This Farmer Market is no longer available.");
    const market = asStoredMarket(marketSnapshot);
    const { endsAt } = assertActiveFarmerMarket(market, now);
    assertPlayerIsAtMarket(market, input.location);
    if (market.hostUid !== context.uid && !attendanceSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Check in first before showing this market's code.");
    }

    const expiresAt = new Date((epoch + 1) * FARMER_MARKET_CHECK_IN_QR_ROTATION_MS);
    const existing = existingTicketSnapshot.data();
    const existingToken = typeof existing?.token === "string" ? existing.token : "";
    const token = /^[A-Za-z0-9_-]{12,32}$/.test(existingToken) ? existingToken : createCheckInToken();
    if (!existingTicketSnapshot.exists || token !== existingToken) {
      const ticket = {
        schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
        marketId: input.marketId,
        presenterUid: context.uid,
        token,
        epoch,
        issuedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        presenterLocation: input.location,
        marketEndsAt: Timestamp.fromDate(endsAt)
      };
      transaction.set(ticketRef, ticket);
      transaction.set(checkInTokenRef(input.marketId, token), ticket);
    }
    return {
      ok: true,
      marketId: input.marketId,
      qrPayload: `GGM1:${input.marketId}:${token}`,
      expiresAt: expiresAt.toISOString(),
      rotatesEverySeconds: FARMER_MARKET_CHECK_IN_QR_ROTATION_MS / 1_000
    };
  });

  return result;
}

export async function checkInToFarmerMarketHandler(request: CallableRequest<unknown>) {
  const input = readCheckInRequest(request);
  const context = await requireFarmerMarketPlayer(request, input.deviceId);
  const db = getAdminFirestore();
  const now = new Date();
  const selectedMarketRef = marketRef(input.marketId);
  const attendeeRef = attendanceRef(input.marketId, context.uid);
  const viewerRsvpRef = rsvpRef(input.marketId, context.uid);
  const passRef = getFarmerMarketEventPewPewPassRef(context.uid);

  const result = await db.runTransaction(async (transaction) => {
    const marketSnapshot = await transaction.get(selectedMarketRef);
    if (!marketSnapshot.exists) throw new HttpsError("not-found", "This Farmer Market is no longer available.");
    const market = asStoredMarket(marketSnapshot);
    const { endsAt } = assertActiveFarmerMarket(market, now);
    assertPlayerIsAtMarket(market, input.location);

    // The QR carries only its compact random token. Its server-side index
    // resolves the authenticated presenter without exposing a player ID.
    const ticketSnapshot = await transaction.get(checkInTokenRef(input.marketId, input.token));
    // The token lookup document is written below when the QR is created. It
    // avoids exposing a presenter UID in the QR while keeping the scanned
    // payload deliberately small.
    if (!ticketSnapshot.exists) throw new HttpsError("failed-precondition", "That check-in code has expired. Ask someone at the market to show a fresh code.");
    const ticket = ticketSnapshot.data() || {};
    const ticketExpiresAt = timestampToDate(ticket.expiresAt);
    const presenterUid = typeof ticket.presenterUid === "string" ? ticket.presenterUid : "";
    if (
      ticket.marketId !== input.marketId || ticket.token !== input.token || !ticketExpiresAt ||
      ticketExpiresAt.getTime() <= now.getTime() || !presenterUid
    ) {
      throw new HttpsError("failed-precondition", "That check-in code has expired. Ask someone at the market to show a fresh code.");
    }

    const presenterAttendanceRef = attendanceRef(input.marketId, presenterUid);
    const [presenterAttendanceSnapshot, attendeeSnapshot, viewerRsvpSnapshot, passSnapshot] = await Promise.all([
      transaction.get(presenterAttendanceRef),
      transaction.get(attendeeRef),
      transaction.get(viewerRsvpRef),
      transaction.get(passRef)
    ]);
    if (market.hostUid !== presenterUid && !presenterAttendanceSnapshot.exists) {
      throw new HttpsError("failed-precondition", "This check-in code is no longer active.");
    }

    const alreadyCheckedIn = attendeeSnapshot.exists;
    const attendeeCount = Number.isSafeInteger(market.attendeeCount) && market.attendeeCount >= 0
      ? market.attendeeCount
      : 0;
    if (!alreadyCheckedIn) {
      transaction.create(attendeeRef, {
        schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
        uid: context.uid,
        displayName: context.player.displayName,
        avatarUrl: context.player.avatarUrl || null,
        checkedInAt: Timestamp.fromDate(now),
        verifiedByUid: presenterUid
      });
      transaction.update(selectedMarketRef, {
        attendeeCount: attendeeCount + 1,
        updatedAt: Timestamp.fromDate(now)
      });
      markMapDirectoryChanged(transaction, db, "markets");
    }

    const existingPasses = passSnapshot.data()?.passes;
    const safePasses = existingPasses && typeof existingPasses === "object" && !Array.isArray(existingPasses)
      ? { ...(existingPasses as Record<string, unknown>) }
      : {};
    const existingPass = safePasses[input.marketId] as Record<string, unknown> | undefined;
    const existingPassEndsAt = timestampToDate(existingPass?.endsAt);
    if (!existingPassEndsAt || existingPassEndsAt.getTime() <= now.getTime()) {
      safePasses[input.marketId] = {
        marketId: input.marketId,
        marketName: market.name,
        endsAt: Timestamp.fromDate(endsAt),
        chargesAvailable: FARMER_MARKET_EVENT_PEW_PEW_CHARGES,
        checkedInAt: Timestamp.fromDate(now)
      };
      transaction.set(passRef, {
        schemaVersion: FARMER_MARKET_SCHEMA_VERSION,
        passes: safePasses,
        updatedAt: Timestamp.fromDate(now)
      });
    }

    const activePass = getActiveFarmerMarketEventPewPewPass(
      { passes: safePasses },
      now
    );
    return {
      ok: true,
      checkedInNow: !alreadyCheckedIn,
      market: serializeFarmerMarket({
        id: input.marketId,
        data: { ...market, attendeeCount: alreadyCheckedIn ? attendeeCount : attendeeCount + 1 },
        viewerUid: context.uid,
        now,
        checkedIn: true,
        willAttend: viewerRsvpSnapshot.exists
      }),
      eventPewPew: activePass
        ? {
            marketId: activePass.marketId,
            marketName: activePass.marketName,
            endsAt: activePass.endsAt.toISOString(),
            chargesAvailable: activePass.chargesAvailable,
            maximumCharges: FARMER_MARKET_EVENT_PEW_PEW_CHARGES
          }
        : null
    };
  });

  return result;
}

/**
 * A temporary Farmer Market Pew-Pew pass never becomes a permanent inventory
 * item. This small status call lets the map restore its event charges after a
 * reload and keeps those charges ahead of any normal test charges.
 */
export async function getFarmerMarketPewPewStatusHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "getFarmerMarketPewPewStatus payload");
  assertAllowedKeys(payload, ["deviceId"], "getFarmerMarketPewPewStatus payload");
  const context = await requireFarmerMarketPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const db = getAdminFirestore();
  const now = new Date();
  const dayKey = getGrowGoUtcDayKey(now);
  const [rewardSnapshot, chargeStateSnapshot, eventPassSnapshot] = await Promise.all([
    getAlphaPewPewRewardRef(context.uid).get(),
    getAlphaPewPewChargeStateRef(context.uid).get(),
    getFarmerMarketEventPewPewPassRef(context.uid).get()
  ]);
  const normalState = rewardSnapshot.exists
    ? getPewPewChargeState(chargeStateSnapshot.data(), dayKey)
    : { dayKey, chargesAvailable: 0, bonusCharges: 0 };
  return {
    ok: true,
    ...serializeFarmerMarketEventPewPewStatus({
      pass: getActiveFarmerMarketEventPewPewPass(eventPassSnapshot.data(), now),
      normalChargesAvailable: normalState.chargesAvailable,
      normalDailyCharges: rewardSnapshot.exists ? PEW_PEW_DAILY_TEST_CHARGES : 0,
      normalBonusCharges: normalState.bonusCharges,
      permanentOwned: rewardSnapshot.exists
    })
  };
}

export async function getFarmerMarketDirectoryHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "getFarmerMarketDirectory payload");
  assertAllowedKeys(payload, ["deviceId"], "getFarmerMarketDirectory payload");
  const context = await requireFarmerMarketPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const now = new Date();
  const db = getAdminFirestore();
  const [version, viewerEventPassSnapshot, viewerRsvpStateSnapshot] = await Promise.all([
    db.collection(MAP_DIRECTORY_VERSIONS).doc("markets").get(),
    getFarmerMarketEventPewPewPassRef(context.uid).get(),
    rsvpStateRef(context.uid).get()
  ]);
  const checkedInMarketIds = new Set(
    readEventPewPewPasses(viewerEventPassSnapshot.data(), now)
      .map((pass) => pass.marketId)
  );
  const willAttendMarketIds = readActiveRsvpMarketIds(viewerRsvpStateSnapshot.data(), now);

  const catalog = await readSharedCache({
    db, key: "farmer-market-public-directory-v1", ttlMs: 60_000,
    revision: `${version.updateTime?.seconds}:${version.updateTime?.nanoseconds}`,
    enabled: readOptimizationEnabled("MARKETS"),
    load: async () => {
      const snapshot = await db.collection(FARMER_MARKETS_COLLECTION)
        .where("endsAt", ">", Timestamp.fromDate(now)).orderBy("endsAt", "asc")
        .limit(FARMER_MARKET_DIRECTORY_LIMIT).get();
      return snapshot.docs.flatMap((document) => {
        const data = asStoredMarket(document);
        const market = serializeFarmerMarket({ id: document.id, data, viewerUid: "", now });
        return market ? [{ market, hostUid: String(data.hostUid) }] : [];
      });
    },
    validate: (value): value is Array<{ market: SafeFarmerMarket; hostUid: string }> =>
      Array.isArray(value) && value.every((row) => typeof row?.hostUid === "string" &&
        typeof row.market?.id === "string" && typeof row.market?.name === "string" &&
        Number.isFinite(Date.parse(row.market.startsAt)) && Number.isFinite(Date.parse(row.market.endsAt)) &&
        Number.isFinite(row.market.latitude) && Number.isFinite(row.market.longitude) &&
        [1, 2, 3, 4].includes(row.market.tier))
  });
  const markets = personalizeMarketDirectory(catalog.value, {
    uid: context.uid, now, checkedInMarketIds, willAttendMarketIds
  })
    .sort((left, right) => {
      const leftStatus = left.status === "active" ? 0 : 1;
      const rightStatus = right.status === "active" ? 0 : 1;
      return leftStatus - rightStatus || Date.parse(left.startsAt) - Date.parse(right.startsAt);
    });

  return {
    ok: true,
    generatedAt: new Date(catalog.loadedAt).toISOString(),
    markets
  };
}

export function personalizeMarketDirectory(
  rows: Array<{ market: SafeFarmerMarket; hostUid: string }>,
  viewer: { uid: string; now: Date; checkedInMarketIds: Set<string>; willAttendMarketIds: Set<string> }
): SafeFarmerMarket[] {
  return rows.filter(({ market }) => Date.parse(market.endsAt) > viewer.now.getTime()).map(({ market, hostUid }) => {
    const isHost = hostUid === viewer.uid;
    const active = Date.parse(market.startsAt) <= viewer.now.getTime();
    return { ...market, status: active ? "active" : "upcoming", isHost,
      tierUpgradeAvailable: isHost && !active && market.tier < 4,
      checkedIn: viewer.checkedInMarketIds.has(market.id),
      willAttend: isHost || viewer.willAttendMarketIds.has(market.id) };
  });
}

export const createFarmerMarket = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  createFarmerMarketHandler
);

export const getFarmerMarketDirectory = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getFarmerMarketDirectoryHandler
);

export const setFarmerMarketWillAttend = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  setFarmerMarketWillAttendHandler
);

export const getFarmerMarketCheckInCode = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getFarmerMarketCheckInCodeHandler
);

export const checkInToFarmerMarket = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  checkInToFarmerMarketHandler
);

export const getFarmerMarketPewPewStatus = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getFarmerMarketPewPewStatusHandler
);
