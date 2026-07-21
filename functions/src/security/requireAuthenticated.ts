import type { CallableRequest } from "firebase-functions/v2/https";
import { HttpsError } from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";

export interface AuthenticatedRequestContext {
  uid: string;
  appCheckVerified: boolean;
}

export function requireAuthenticated(
  request: CallableRequest<unknown>
): AuthenticatedRequestContext {
  if (!request.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Firebase Authentication is required for this callable scaffold."
    );
  }

  return {
    uid: request.auth.uid,
    appCheckVerified: request.app != null
  };
}

export function requireAppCheckIfEnabled(
  request: CallableRequest<unknown>
): void {
  if (runtimeConfig.appCheck.enforceOnCallable && request.app == null) {
    throw new HttpsError(
      "failed-precondition",
      "App Check enforcement is enabled for this callable scaffold."
    );
  }
}
