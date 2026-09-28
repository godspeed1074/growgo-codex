import { onCall, type CallableRequest } from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  transferActiveDeviceSession
} from "../domain/players/activeDeviceSession";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys
} from "../validation/requestValidation";

export function createTransferActiveDeviceHandler() {
  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);

    const payload = asObject(request.data, "transferActiveDevice payload");
    assertAllowedKeys(payload, ["deviceId"], "transferActiveDevice payload");
    const result = await transferActiveDeviceSession({
      uid: authContext.uid,
      deviceId: payload.deviceId,
      authTimeSeconds: request.auth?.token?.auth_time
    });

    return {
      ok: true,
      ...result
    };
  };
}

export const transferActiveDevice = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createTransferActiveDeviceHandler()
);
