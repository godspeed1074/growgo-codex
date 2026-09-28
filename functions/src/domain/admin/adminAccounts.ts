import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";

export const ADMIN_ACCOUNTS_COLLECTION = "adminAccounts" as const;
export const ADMIN_ACCOUNT_SCHEMA_VERSION = 1 as const;
export const adminRoles = ["owner", "admin"] as const;

export type AdminRole = (typeof adminRoles)[number];

export interface AdminAccount {
  schemaVersion: typeof ADMIN_ACCOUNT_SCHEMA_VERSION;
  uid: string;
  role: AdminRole;
  enabled: boolean;
  assignedAt: Date;
  assignedByUid: string | null;
  updatedAt: Date;
}

export function getAdminAccountRef(uid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection(ADMIN_ACCOUNTS_COLLECTION).doc(uid);
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && adminRoles.includes(value as AdminRole);
}

export function readAdminAccount(data: DocumentData | undefined): AdminAccount | null {
  if (!data || typeof data !== "object") return null;
  if (data.schemaVersion !== ADMIN_ACCOUNT_SCHEMA_VERSION) return null;
  if (typeof data.uid !== "string" || data.uid.trim().length === 0) return null;
  // Early alpha used a Moderator role. The current approved model has only
  // Owner and Admin, so legacy Moderator records retain access as Admin
  // rather than unexpectedly locking a staff member out.
  const role = data.role === "moderator" ? "admin" : data.role;
  if (!isAdminRole(role) || data.enabled !== true) return null;

  const assignedAt = readDate(data.assignedAt);
  const updatedAt = readDate(data.updatedAt);
  if (!assignedAt || !updatedAt) return null;

  return {
    schemaVersion: ADMIN_ACCOUNT_SCHEMA_VERSION,
    uid: data.uid,
    role,
    enabled: true,
    assignedAt,
    assignedByUid: typeof data.assignedByUid === "string" ? data.assignedByUid : null,
    updatedAt
  };
}

export async function requireAdminAccount(
  uid: string,
  allowedRoles: readonly AdminRole[] = adminRoles
): Promise<AdminAccount> {
  const snapshot = await getAdminAccountRef(uid).get();
  const account = readAdminAccount(snapshot.data());

  if (!account || !allowedRoles.includes(account.role)) {
    throw new HttpsError(
      "permission-denied",
      "This GrowGo account does not have access to the Control Center."
    );
  }

  return account;
}

export function buildAdminAccountDocument(params: {
  uid: string;
  role: AdminRole;
  assignedByUid: string | null;
  now?: Timestamp;
}) {
  const now = params.now ?? Timestamp.now();
  return {
    schemaVersion: ADMIN_ACCOUNT_SCHEMA_VERSION,
    uid: params.uid,
    role: params.role,
    enabled: true,
    assignedAt: now,
    assignedByUid: params.assignedByUid,
    updatedAt: now
  } as const;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  return null;
}
