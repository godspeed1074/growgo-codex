import { randomBytes } from "node:crypto";
import { Timestamp, type DocumentData, type DocumentReference, type Transaction } from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";

export const PLAYER_PUBLIC_CODES_COLLECTION = "playerPublicCodes" as const;
export const PLAYER_PUBLIC_CODE_PATTERN = /^GG[A-Z0-9]{6}$/;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_CODE_RESERVATION_ATTEMPTS = 32;

export function normalizePlayerPublicCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return PLAYER_PUBLIC_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function getPlayerPublicCodeRef(code: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection(PLAYER_PUBLIC_CODES_COLLECTION).doc(code);
}

function createRandomPlayerPublicCode(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `GG${suffix}`;
}

/**
 * Reserves one public QR code atomically. A collision can never result in two
 * players receiving the same code because the code document is created within
 * the caller's Firestore transaction.
 */
export async function reservePlayerPublicCode(params: {
  transaction: Transaction;
  uid: string;
  currentCode: unknown;
  now: Timestamp;
}): Promise<string> {
  const preferredCode = normalizePlayerPublicCode(params.currentCode);
  const candidates = preferredCode ? [preferredCode] : [];

  for (let attempt = 0; attempt < MAX_CODE_RESERVATION_ATTEMPTS; attempt += 1) {
    const candidate = candidates[attempt] || createRandomPlayerPublicCode();
    const codeRef = getPlayerPublicCodeRef(candidate);
    const codeSnapshot = await params.transaction.get(codeRef);
    const mappedUid = typeof codeSnapshot.data()?.uid === "string" ? codeSnapshot.data()?.uid : null;

    if (codeSnapshot.exists && mappedUid !== params.uid) continue;

    if (!codeSnapshot.exists) {
      params.transaction.create(codeRef, {
        schemaVersion: 1,
        uid: params.uid,
        createdAt: params.now,
        updatedAt: params.now
      });
    } else {
      params.transaction.update(codeRef, { updatedAt: params.now });
    }

    return candidate;
  }

  throw new Error("Could not reserve a unique GrowGo player code.");
}
