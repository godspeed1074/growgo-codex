export const serverAuthoritativePlayerFields = [
  "xp",
  "coins",
  "points",
  "level",
  "inventory",
  "captureHistory",
  "rewards",
  "questProgress",
  "cardOwnership",
  "birdProgress",
  "plotOwnership",
  "marketplaceOwnership"
] as const;

export type ServerAuthoritativePlayerField =
  (typeof serverAuthoritativePlayerFields)[number];

export interface PlayerBootstrapRequest {
  requestId: string;
}

export interface PlayerSnapshotRequest {}

export interface PlayerDocument {
  schemaVersion: 1;
  displayName: string | null;
  avatarUrl: string | null;
  level: 1;
  xp: 0;
  coins: 0;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface SafePlayerSnapshot {
  schemaVersion: 1;
  displayName: string | null;
  avatarUrl: string | null;
  level: 1;
  xp: 0;
  coins: 0;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface CallableScaffoldResponse {
  ok: false;
  accepted: false;
  status: "not-implemented";
  message: string;
  requestId: string;
  playerId: string;
}
