import { onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  type PlayerDocument,
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
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireRequestId
} from "../validation/requestValidation";

export interface BootstrapPlayerTransactionResult {
  created: boolean;
  player: PlayerDocument;
}

export interface BootstrapPlayerHandlerDependencies {
  requireInvitedUserAccess(request: CallableRequest<unknown>): void;
  reserveIdempotency(params: {
    requestId: string;
    uid: string;
  }): Promise<Awaited<ReturnType<typeof reserveIdempotencySlot>>>;
  runBootstrapTransaction(uid: string): Promise<BootstrapPlayerTransactionResult>;
}

const defaultBootstrapPlayerHandlerDependencies: BootstrapPlayerHandlerDependencies = {
  requireInvitedUserAccess(request) {
    requireInvitedUserAccess(request);
  },
  async reserveIdempotency(params) {
    return reserveIdempotencySlot(
      buildIdempotencyEnvelope({
        requestId: params.requestId,
        operation: "bootstrapPlayer",
        uid: params.uid
      })
    );
  },
  async runBootstrapTransaction(uid: string): Promise<BootstrapPlayerTransactionResult> {
    const db = getAdminFirestore();
    const playerRef = getPlayerDocumentRef(uid);

    return db.runTransaction(async (transaction) => {
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
  }
};

export function createBootstrapPlayerHandler(
  dependencies: Partial<BootstrapPlayerHandlerDependencies> = defaultBootstrapPlayerHandlerDependencies
) {
  const resolvedDependencies: BootstrapPlayerHandlerDependencies = {
    ...defaultBootstrapPlayerHandlerDependencies,
    ...dependencies
  };

  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    resolvedDependencies.requireInvitedUserAccess(request);

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
    const idempotencyReservation = await resolvedDependencies.reserveIdempotency({
      requestId,
      uid: authContext.uid
    });

    // requestId is validated now for future persistent request-ledger support,
    // but this phase only guarantees safe bootstrap semantics for a single uid.
    const bootstrapResult = await resolvedDependencies.runBootstrapTransaction(
      authContext.uid
    );

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
  };
}

export const bootstrapPlayer = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createBootstrapPlayerHandler()
);
