import { onCall, type CallableRequest } from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireActiveDeviceSessionIfEnabled
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

/** A low-frequency session heartbeat with no player or game side effects. */
export function createRenewActiveDeviceSessionHandler() {
  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);

    const payload = asObject(request.data, "renewActiveDeviceSession payload");
    assertAllowedKeys(payload, ["deviceId"], "renewActiveDeviceSession payload");
    const activeDeviceSession = await requireActiveDeviceSessionIfEnabled({
      uid: authContext.uid,
      deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
    });

    return { ok: true, activeDeviceSession };
  };
}

export const renewActiveDeviceSession = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createRenewActiveDeviceSessionHandler()
);
