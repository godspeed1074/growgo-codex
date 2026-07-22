import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
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
import {
  asObject,
  assertAllowedKeys
} from "../validation/requestValidation";

export const GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY =
  "player_snapshot" as const;

export interface GetPlayerSnapshotHandlerDependencies {
  requireDevelopmentCapabilityAccess(params: {
    capability: typeof GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY;
  }): void;
  readPlayer(uid: string): Promise<PlayerDocument>;
}

const defaultGetPlayerSnapshotHandlerDependencies: GetPlayerSnapshotHandlerDependencies = {
  requireDevelopmentCapabilityAccess(params) {
    requireDevelopmentBackendCapabilityAccess({
      capability: params.capability
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
  dependencies: GetPlayerSnapshotHandlerDependencies = defaultGetPlayerSnapshotHandlerDependencies
) {
  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    dependencies.requireDevelopmentCapabilityAccess({
      capability: GET_PLAYER_SNAPSHOT_DEVELOPMENT_BACKEND_CAPABILITY
    });

    const payload = asObject(request.data, "getPlayerSnapshot payload");
    assertAllowedKeys(payload, [], "getPlayerSnapshot payload");

    const _validatedRequest: PlayerSnapshotRequest = {};
    const player = await dependencies.readPlayer(authContext.uid);

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
