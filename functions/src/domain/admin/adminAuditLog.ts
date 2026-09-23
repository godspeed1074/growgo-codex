import { Timestamp, type DocumentData, type DocumentReference } from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";

export const ADMIN_AUDIT_LOG_COLLECTION = "adminAuditLog" as const;
export const ADMIN_AUDIT_LOG_SCHEMA_VERSION = 1 as const;

/**
 * Append-only internal history for access-changing Control Center actions.
 * Direct client writes are denied by the default Firestore rules, so every
 * entry originates from an authenticated server-side action.
 */
export async function recordAdminAuditEvent(params: {
  actorUid: string;
  action: "admin_owner_bootstrapped" | "admin_role_assigned" | "official_event_updated" | "quest_reset";
  targetUid: string;
  role?: "owner" | "admin";
  details?: Record<string, string | number | boolean>;
  now?: Timestamp;
}): Promise<DocumentReference<DocumentData>> {
  const now = params.now ?? Timestamp.now();
  return getAdminFirestore().collection(ADMIN_AUDIT_LOG_COLLECTION).add({
    schemaVersion: ADMIN_AUDIT_LOG_SCHEMA_VERSION,
    actorUid: params.actorUid,
    action: params.action,
    targetUid: params.targetUid,
    ...(params.role ? { role: params.role } : {}),
    ...(params.details ? { details: params.details } : {}),
    createdAt: now
  });
}
