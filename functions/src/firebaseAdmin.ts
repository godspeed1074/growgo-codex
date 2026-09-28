import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { runtimeConfig } from "./config/runtimeConfig";

export function getFirebaseAdminApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    // A second-generation Functions container can supply a pre-initialised
    // Admin app with a non-default name. Reuse that exact app rather than
    // asking only for the default name, which would turn a valid capture into
    // a generic internal error.
    return existingApps[0];
  }

  return initializeApp({
    projectId: runtimeConfig.projectId,
    storageBucket: runtimeConfig.storageBucket
  });
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}

// Cloud Functions provides its own pre-initialised Admin app. Unlike our
// local app it does not necessarily include a default bucket, so callers
// must always select GrowGo's configured bucket explicitly.
export function getAdminStorageBucket() {
  return getAdminStorage().bucket(runtimeConfig.storageBucket);
}
