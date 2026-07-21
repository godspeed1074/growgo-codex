import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";
import type { PlayerDocument, SafePlayerSnapshot } from "./playerTypes";

export const PLAYER_SCHEMA_VERSION = 1 as const;

export function getPlayerDocumentRef(uid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection("players").doc(uid);
}

export function buildDefaultPlayerDocument(now: Timestamp): PlayerDocument {
  return {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    displayName: null,
    avatarUrl: null,
    level: 1,
    xp: 0,
    coins: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    lastLoginAt: now.toDate()
  };
}

export function serializePlayerSnapshot(
  player: PlayerDocument
): SafePlayerSnapshot {
  return {
    schemaVersion: player.schemaVersion,
    displayName: player.displayName,
    avatarUrl: player.avatarUrl,
    level: player.level,
    xp: player.xp,
    coins: player.coins,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    lastLoginAt: player.lastLoginAt.toISOString()
  };
}

export function readStoredPlayerDocument(data: DocumentData | undefined): PlayerDocument {
  if (!data || typeof data !== "object") {
    throw new HttpsError("internal", "Stored player document is missing.");
  }

  const createdAt = asDate(data.createdAt, "createdAt");
  const updatedAt = asDate(data.updatedAt, "updatedAt");
  const lastLoginAt = asDate(data.lastLoginAt, "lastLoginAt");

  if (data.schemaVersion !== PLAYER_SCHEMA_VERSION) {
    throw new HttpsError("internal", "Stored player schemaVersion is invalid.");
  }

  if (data.displayName !== null) {
    throw new HttpsError("internal", "Stored player displayName is invalid.");
  }

  if (data.avatarUrl !== null) {
    throw new HttpsError("internal", "Stored player avatarUrl is invalid.");
  }

  if (data.level !== 1 || data.xp !== 0 || data.coins !== 0) {
    throw new HttpsError(
      "internal",
      "Stored player progression fields are outside the scaffold baseline."
    );
  }

  return {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    displayName: null,
    avatarUrl: null,
    level: 1,
    xp: 0,
    coins: 0,
    createdAt,
    updatedAt,
    lastLoginAt
  };
}

function asDate(value: unknown, label: string): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  throw new HttpsError("internal", `Stored player ${label} is invalid.`);
}
