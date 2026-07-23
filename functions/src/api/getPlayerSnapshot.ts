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
  type PlayerSnapshotRequest,
  type PlayerDocument
} from "../domain/players/playerTypes";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
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
  assertAllowedKeys
} from "../validation/requestValidation";

export const GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY =
  "player_snapshot" as const;

export interface GetPlayerSnapshotHandlerDependencies {
  requireInvitedUserAccess(request: CallableRequest<unknown>): void;
  requireDevelopmentCapabilityAccess(params: {
    capability: typeof GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY;
  }): void;
  requireOperationalSafeguardAccess(params: { uid: string }): void;
  readPlayer(uid: string): Promise<PlayerDocument>;
}

const defaultGetPlayerSnapshotHandlerDependencies: GetPlayerSnapshotHandlerDependencies = {
  requireInvitedUserAccess(request) {
    requireInvitedUserAccess(request);
  },
  requireDevelopmentCapabilityAccess(params) {
    requireDevelopmentBackendCapabilityAccess({
      capability: params.capability
    });
  },
  requireOperationalSafeguardAccess(params) {
    requireDevelopmentBackendOperationalSafeguardAccess({
      operation: "player_snapshot",
      uid: params.uid
    });
  },
  async readPlayer(uid: string): Promise<PlayerDocument> {
    const snapshot = await getPlayerDocumentRef(uid).get();

    if (!snapshot.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Player bootstrap is required before requesting a snapshot."
      );
    }

    return readStoredPlayerDocument(snapshot.data());
  }
};

export function createGetPlayerSnapshotHandler(
  dependencies: Partial<GetPlayerSnapshotHandlerDependencies> = defaultGetPlayerSnapshotHandlerDependencies
) {
  const resolvedDependencies: GetPlayerSnapshotHandlerDependencies = {
    ...defaultGetPlayerSnapshotHandlerDependencies,
    ...dependencies
  };

  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    resolvedDependencies.requireInvitedUserAccess(request);
    resolvedDependencies.requireDevelopmentCapabilityAccess({
      capability: GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY
    });
    resolvedDependencies.requireOperationalSafeguardAccess({
      uid: authContext.uid
    });

    const payload = asObject(request.data, "getPlayerSnapshot payload");
    assertAllowedKeys(payload, [], "getPlayerSnapshot payload");

    const _validatedRequest: PlayerSnapshotRequest = {};
    const player = await resolvedDependencies.readPlayer(authContext.uid);

    return {
      ok: true,
      player: serializePlayerSnapshot(player),
      appCheck: {
        prepared: runtimeConfig.appCheck.prepared,
        enforced: runtimeConfig.appCheck.enforceOnCallable,
        verified: authContext.appCheckVerified
      }
    };
  };
}

export const getPlayerSnapshot = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createGetPlayerSnapshotHandler()
);
