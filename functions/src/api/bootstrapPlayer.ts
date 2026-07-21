import { onCall } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  type PlayerBootstrapRequest,
  serverAuthoritativePlayerFields
} from "../domain/players/playerTypes";
import {
  buildDefaultPlayerDocument,
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";
import {
  buildIdempotencyEnvelope,
  reserveIdempotencySlot
} from "../idempotency/idempotency";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import {
  asObject,
  assertAllowedKeys,
  requireRequestId
} from "../validation/requestValidation";

export const bootstrapPlayer = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  async (request) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);

    const payload = asObject(request.data, "bootstrapPlayer payload");
    assertAllowedKeys(payload, ["requestId"], "bootstrapPlayer payload");

    const validatedRequest: PlayerBootstrapRequest = {
      requestId: requireRequestId(payload.requestId)
    };
    const { requestId } = validatedRequest;

    const idempotency = buildIdempotencyEnvelope({
      requestId,
      operation: "bootstrapPlayer",
      uid: authContext.uid
    });
    const idempotencyReservation = await reserveIdempotencySlot(idempotency);

    // requestId is validated now for future persistent request-ledger support,
    // but this phase only guarantees safe bootstrap semantics for a single uid.
    const db = getAdminFirestore();
    const playerRef = getPlayerDocumentRef(authContext.uid);
    const bootstrapResult = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(playerRef);
      const now = Timestamp.now();

      if (!snapshot.exists) {
        const player = buildDefaultPlayerDocument(now);
        transaction.create(playerRef, player);

        return {
          created: true,
          player
        };
      }

      const existingPlayer = readStoredPlayerDocument(snapshot.data());
      transaction.update(playerRef, {
        updatedAt: now,
        lastLoginAt: now
      });

      return {
        created: false,
        player: {
          ...existingPlayer,
          updatedAt: now.toDate(),
          lastLoginAt: now.toDate()
        }
      };
    });

    return {
      ok: true,
      created: bootstrapResult.created,
      player: serializePlayerSnapshot(bootstrapResult.player),
      idempotency,
      idempotencyReservation,
      appCheck: {
        prepared: runtimeConfig.appCheck.prepared,
        enforced: runtimeConfig.appCheck.enforceOnCallable,
        verified: authContext.appCheckVerified
      },
      serverAuthoritativeFieldsRejectedFromClient:
        serverAuthoritativePlayerFields.slice(),
      rewardAuthority: runtimeConfig.serverAuthority.rewardComputation
    };
  }
);
