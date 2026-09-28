// Preview handler only: deliberately not exported as a deployed callable yet.
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { validateCapturePinRequestPayload, createCapturePinHandler, defaultCapturePinDependencies } from "./capturePin";
import { runtimeConfig } from "../config/runtimeConfig";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getActivePlayerFoodBuff } from "../domain/players/playerBuffs";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";
import { requireAuthenticated, requireAppCheckIfEnabled } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";

export function createCapturePinBatchHandler(
  capture: (request: CallableRequest<unknown>) => Promise<unknown>,
  now = Date.now
) {
  return async (request: CallableRequest<unknown>) => {
    requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);
    const payload = asObject(request.data, "capture batch");
    assertAllowedKeys(payload, ["captures"], "capture batch");
    if (!Array.isArray(payload.captures) || payload.captures.length < 1 || payload.captures.length > 10)
      throw new HttpsError("invalid-argument", "A batch requires 1 to 10 captures.");
    const ids = new Set<string>(), pins = new Set<string>();
    // Validate the entire envelope before performing any writes.
    const entries = payload.captures.map((data: unknown) => {
      const child = {...request, data};
      const typed = validateCapturePinRequestPayload(child);
      if (ids.has(typed.requestId) || pins.has(typed.pinId))
        throw new HttpsError("invalid-argument", "Duplicate capture in batch.");
      ids.add(typed.requestId); pins.add(typed.pinId);
      return {child, typed};
    });
    const results = [];
    for (const {child, typed} of entries) {
      try {
        const age = now() - Date.parse(typed.clientCapturedAt);
        if (age < -1000 || age > 15000)
          throw new HttpsError("failed-precondition", "Capture evidence expired; refresh your location.");
        // Original handler preserves auth/device checks, canonical geometry,
        // range, rewards, daily lockouts and durable per-request idempotency.
        // Sequential processing prevents out-of-order player snapshots.
        const response = await capture(child);
        results.push({requestId: typed.requestId, response});
      } catch (error) {
        const safe = error instanceof HttpsError ? error : new HttpsError("internal", "Capture failed.");
        results.push({requestId: typed.requestId, error: {code: safe.code, message: safe.message, details: safe.details ?? null}});
      }
    }
    return {results};
  };
}

const pilotCapture = createCapturePinHandler(defaultCapturePinDependencies);
export const capturePinBatch = onCall({region: runtimeConfig.region,
  enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable}, async request => {
  const auth = requireAuthenticated(request);
  if (auth.uid !== "LkR8ugTK6lXGFfUlLvKSiqMoMBh1" || process.env.GROWGO_AUTO_CAPTURE_BATCH_PILOT !== "true")
    throw new HttpsError("permission-denied", "Batch capture pilot is disabled.");
  return createCapturePinBatchHandler(async child => {
    const snapshot = await getPlayerDocumentRef(auth.uid).get();
    if (!snapshot.exists || getActivePlayerFoodBuff(readStoredPlayerDocument(snapshot.data()), new Date())?.autoCapture !== true)
      throw new HttpsError("failed-precondition", "Auto-capture boost is not active.");
    return pilotCapture(child);
  })(request);
});
