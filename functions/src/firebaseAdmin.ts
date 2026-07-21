import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { runtimeConfig } from "./config/runtimeConfig";

export function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    projectId: runtimeConfig.projectId
  });
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
