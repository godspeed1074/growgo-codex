import { onCall } from "firebase-functions/v2/https";
import { runtimeConfig } from "../config/runtimeConfig";
import { createSocialProfileHandler } from "./getFriendProfile";

// Same public stats as Friends, but restricted to a server-confirmed Meet.
// Looking at a profile never creates a friendship or alters either account.
export const getMetPlayerProfileHandler = createSocialProfileHandler("met");
export const getMetPlayerProfile = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getMetPlayerProfileHandler
);
