import { HttpsError, onCall } from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  type PlayerSnapshotRequest,
} from "../domain/players/playerTypes";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import {
  asObject,
  assertAllowedKeys
} from "../validation/requestValidation";

export const getPlayerSnapshot = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  async (request) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);

    const payload = asObject(request.data, "getPlayerSnapshot payload");
    assertAllowedKeys(payload, [], "getPlayerSnapshot payload");

    const _validatedRequest: PlayerSnapshotRequest = {};
    const snapshot = await getPlayerDocumentRef(authContext.uid).get();

    if (!snapshot.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Player bootstrap is required before requesting a snapshot."
      );
    }

    const player = readStoredPlayerDocument(snapshot.data());

    return {
      ok: true,
      player: serializePlayerSnapshot(player),
      appCheck: {
        prepared: runtimeConfig.appCheck.prepared,
        enforced: runtimeConfig.appCheck.enforceOnCallable,
        verified: authContext.appCheckVerified
      }
    };
  }
);
