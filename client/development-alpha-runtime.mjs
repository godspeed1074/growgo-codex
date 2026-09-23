import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { resolveDevelopmentAlphaSignInPlan } from "./development-alpha-contract.mjs";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserLocalPersistence,
  reauthenticateWithPopup,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import {
  doc,
  getFirestore,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getDownloadURL,
  getBlob,
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

let emulatorConnectionsApplied = false;

export async function createDevelopmentAlphaFirebaseRuntime(runtimeContract) {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: runtimeContract.firebase.apiKey,
          authDomain: runtimeContract.firebase.authDomain,
          projectId: runtimeContract.firebase.projectId,
          storageBucket: runtimeContract.firebase.storageBucket,
          messagingSenderId: runtimeContract.firebase.messagingSenderId,
          appId: runtimeContract.firebase.appId,
          measurementId: runtimeContract.firebase.measurementId ?? undefined
        });

  const auth = getAuth(app);
  const functions = getFunctions(app, "australia-southeast1");
  const storage = getStorage(app);
  const firestore = getFirestore(app);

  if (runtimeContract.connectionMode === "emulator" && !emulatorConnectionsApplied) {
    connectAuthEmulator(
      auth,
      `http://${runtimeContract.emulator.auth.host}:${runtimeContract.emulator.auth.port}`,
      { disableWarnings: true }
    );
    connectFunctionsEmulator(
      functions,
      runtimeContract.emulator.functions.host,
      runtimeContract.emulator.functions.port
    );
    emulatorConnectionsApplied = true;
  }

  await setPersistence(auth, browserLocalPersistence);

  // Alpha sign-in is popup-only. Do not invoke the legacy redirect resolver:
  // on some mobile browsers it can leave Firebase waiting before it begins
  // delivering the current signed-in user to the game.

  const provider = new GoogleAuthProvider();
  const deviceId = getOrCreateDeviceId();
  const sharedAvatarObjectUrls = new Map();

  return {
    onAuthStateChanged(callback) {
      return onAuthStateChanged(auth, callback);
    },
    subscribeWorldFirstAnnouncement(callback) {
      if (typeof callback !== "function") return () => {};
      return onSnapshot(
        doc(firestore, "worldFirstAnnouncements", "current"),
        (snapshot) => {
          if (snapshot.exists()) callback(snapshot.data());
        },
        () => {
          // A celebration must never interfere with sign-in or map play.
        }
      );
    },
    subscribeMapDirectory(directory, callback) {
      if (!["bingles", "markets"].includes(directory) || typeof callback !== "function") return () => {};
      return onSnapshot(doc(firestore, "mapDirectoryVersions", directory), { includeMetadataChanges: true },
        (snapshot) => callback({ connected: !snapshot.metadata.fromCache,
          revision: String(snapshot.data()?.updatedAt?.toMillis?.() ?? "empty") }),
        () => callback({ connected: false }));
    },
    async signIn() {
      const signInPlan = resolveDevelopmentAlphaSignInPlan(runtimeContract);

      if (signInPlan.mode === "emulator-password") {
        await signInWithEmailAndPassword(
          auth,
          signInPlan.email,
          signInPlan.password
        );
        return;
      }

      if (signInPlan.mode === "blocked") {
        throw new Error(
          "Local emulator sign-in is unavailable until the development emulator password is configured."
        );
      }

      await signInWithPopup(auth, provider);
    },
    async signOut() {
      await firebaseSignOut(auth);
    },
    async bootstrapPlayer(payload) {
      const callable = httpsCallable(functions, "bootstrapPlayer");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getPlayerSnapshot() {
      const callable = httpsCallable(functions, "getPlayerSnapshot");
      const response = await callable({ deviceId });
      return response.data.player ?? null;
    },
    async completePlayerProfile(payload) {
      const callable = httpsCallable(functions, "completePlayerProfile");
      const response = await callable({ ...payload, deviceId });
      return response.data.player ?? null;
    },
    async completeInterfaceTutorial() {
      const callable = httpsCallable(functions, "completeInterfaceTutorial");
      const response = await callable({ deviceId });
      return response.data;
    },
    async updatePlayerAvatar(file) {
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in before changing your profile picture.");

      const avatarBlob = await prepareProfileAvatar(file);
      const avatarRef = ref(storage, `player-avatars/${user.uid}/profile-${Date.now()}.jpg`);
      await uploadBytes(avatarRef, avatarBlob, {
        contentType: "image/jpeg",
        cacheControl: "public,max-age=31536000,immutable"
      });
      const avatarUrl = await getDownloadURL(avatarRef);
      const callable = httpsCallable(functions, "updatePlayerAvatar");
      const response = await callable({ requestId: createAvatarRequestId(), deviceId, avatarUrl });
      return response.data.player ?? null;
    },
    async clearPlayerAvatar() {
      const callable = httpsCallable(functions, "updatePlayerAvatar");
      const response = await callable({ requestId: createAvatarRequestId(), deviceId, avatarUrl: null });
      return response.data.player ?? null;
    },
    async getSharedAvatarObjectUrl(avatarUrl) {
      if (typeof avatarUrl !== "string" || !avatarUrl.trim()) return null;
      const canonicalUrl = avatarUrl.trim();
      const cached = sharedAvatarObjectUrls.get(canonicalUrl);
      if (cached) return cached;

      // Storage SDK requests include the active GrowGo sign-in, unlike an
      // ordinary image tag. This keeps profile photos visible to players in
      // the game without making avatar storage publicly browsable.
      const imageBlob = await getBlob(ref(storage, canonicalUrl));
      const objectUrl = URL.createObjectURL(imageBlob);
      sharedAvatarObjectUrls.set(canonicalUrl, objectUrl);
      return objectUrl;
    },
    async scanGrowGoPlayerCode(payload) {
      const callable = httpsCallable(functions, "scanGrowGoPlayerCode");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async addGrowGoFriend(payload) {
      const callable = httpsCallable(functions, "addGrowGoFriend");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getGrowGoSocialSnapshot() {
      const callable = httpsCallable(functions, "getGrowGoSocialSnapshot");
      const response = await callable({ deviceId });
      return response.data;
    },
    async getFriendProfile(payload) {
      const response = await httpsCallable(functions, "getFriendProfile")({ ...payload, deviceId });
      return response.data;
    },
    async getMetPlayerProfile(payload) {
      const response = await httpsCallable(functions, "getMetPlayerProfile")({ ...payload, deviceId });
      return response.data;
    },
    async getOfficialEventCalendar() {
      const callable = httpsCallable(functions, "getOfficialEventCalendar");
      const response = await callable({ deviceId });
      return response.data;
    },
    async createFarmerMarket(payload) {
      const callable = httpsCallable(functions, "createFarmerMarket");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getFarmerMarketDirectory() {
      const callable = httpsCallable(functions, "getFarmerMarketDirectory");
      const response = await callable({ deviceId });
      return response.data;
    },
    async setFarmerMarketWillAttend(payload) {
      const callable = httpsCallable(functions, "setFarmerMarketWillAttend");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getFarmerMarketCheckInCode(payload) {
      const callable = httpsCallable(functions, "getFarmerMarketCheckInCode");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async checkInToFarmerMarket(payload) {
      const callable = httpsCallable(functions, "checkInToFarmerMarket");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getFarmerMarketPewPewStatus() {
      const callable = httpsCallable(functions, "getFarmerMarketPewPewStatus");
      const response = await callable({ deviceId });
      return response.data;
    },
    async migrateLegacyAlphaAchievementRecords(payload) {
      const callable = httpsCallable(functions, "migrateLegacyAlphaAchievementRecords");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getFarmerMarketAchievementSnapshot() {
      const callable = httpsCallable(functions, "getFarmerMarketAchievementSnapshot");
      const response = await callable({ deviceId });
      return response.data;
    },
    async deployFarmerMarketAchievementPin(payload) {
      const callable = httpsCallable(functions, "deployFarmerMarketAchievementPin");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async captureFarmerMarketAchievementPin(payload) {
      const callable = httpsCallable(functions, "captureFarmerMarketAchievementPin");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async createGrowGoParty(payload = {}) {
      const callable = httpsCallable(functions, "createGrowGoParty");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async joinGrowGoParty(payload) {
      const callable = httpsCallable(functions, "joinGrowGoParty");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async cancelGrowGoParty() {
      const callable = httpsCallable(functions, "cancelGrowGoParty");
      const response = await callable({ deviceId });
      return response.data;
    },
    async leaveGrowGoParty() {
      const callable = httpsCallable(functions, "leaveGrowGoParty");
      const response = await callable({ deviceId });
      return response.data;
    },
    async reportGrowGoPartyLocation(payload) {
      const callable = httpsCallable(functions, "reportGrowGoPartyLocation");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async capturePinBatch(payload) {
      const callable = httpsCallable(functions, "capturePinBatch");
      const response = await callable({captures: payload.captures.map(capture => ({...capture, deviceId}))});
      return response.data;
    },
    async capturePin(payload) {
      const callable = httpsCallable(functions, "capturePin");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async birdQuests(payload) {
      const callable = httpsCallable(functions, "birdQuests");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async playerMail(payload) {
      return (await httpsCallable(functions, 'playerMail')({ ...payload, deviceId })).data;
    },
    async leonardQuest(payload) {
      return (await httpsCallable(functions, 'leonardQuest')({ ...payload, deviceId })).data;
    },
    async captureDailyPoi(payload) {
      const callable = httpsCallable(functions, "captureDailyPoi");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getNearbyBasePins(payload) {
      const callable = httpsCallable(functions, "getNearbyBasePins");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async mutateWorldBasePin(payload) {
      const callable = httpsCallable(functions, "mutateWorldBasePin");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async recoverLegacyBasePinOwnership(payload) {
      const callable = httpsCallable(functions, "recoverLegacyBasePinOwnership");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async searchNearbyPois(payload) {
      const callable = httpsCallable(functions, "searchNearbyPois");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getLeaderboard(payload) {
      const callable = httpsCallable(functions, "getLeaderboard");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async initializeMarketInventory(payload) {
      const callable = httpsCallable(functions, "initializeMarketInventory");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getMarketplaceSnapshot() {
      const callable = httpsCallable(functions, "getMarketplaceSnapshot");
      const response = await callable({ deviceId });
      return response.data;
    },
    async createMarketplaceListing(payload) {
      const callable = httpsCallable(functions, "createMarketplaceListing");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async cancelMarketplaceListing(payload) {
      const callable = httpsCallable(functions, "cancelMarketplaceListing");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async purchaseMarketplaceListing(payload) {
      const callable = httpsCallable(functions, "purchaseMarketplaceListing");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async craftEnergyBar(payload) {
      const callable = httpsCallable(functions, "craftEnergyBar");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async craftRecipe(payload) {
      const callable = httpsCallable(functions, "craftRecipe");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async useEnergyBar(payload) {
      const callable = httpsCallable(functions, "useEnergyBar");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async useFood(payload) {
      const callable = httpsCallable(functions, "useFood");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async startStarterQuest() {
      const callable = httpsCallable(functions, "startStarterQuest");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaSeedBundle() {
      const callable = httpsCallable(functions, "claimAlphaSeedBundle");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaWheatBundle() {
      const callable = httpsCallable(functions, "claimAlphaWheatBundle");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaMiracleGrowBundle() {
      const callable = httpsCallable(functions, "claimAlphaMiracleGrowBundle");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaBatteredFishBundle() {
      const callable = httpsCallable(functions, "claimAlphaBatteredFishBundle");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaBinglesScarecrowTestKit() {
      const callable = httpsCallable(functions, "claimAlphaBinglesScarecrowTestKit");
      const response = await callable({ deviceId });
      return response.data;
    },
    async deployAlphaBinglesScarecrow(payload) {
      const callable = httpsCallable(functions, "deployAlphaBinglesScarecrow");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async getActiveBinglesScarecrows(payload = {}) {
      const callable = httpsCallable(functions, "getActiveBinglesScarecrows");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async updateAlphaBinglesScarecrowSettings(payload) {
      const callable = httpsCallable(functions, "updateAlphaBinglesScarecrowSettings");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async claimAlphaTestCoinGrant() {
      const callable = httpsCallable(functions, "claimAlphaTestCoinGrant");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaPewPewTestKit() {
      const callable = httpsCallable(functions, "claimAlphaPewPewTestKit");
      const response = await callable({ deviceId });
      return response.data;
    },
    async consumeAlphaPewPewTestCharge() {
      const callable = httpsCallable(functions, "consumeAlphaPewPewTestCharge");
      const response = await callable({ deviceId });
      return response.data;
    },
    async claimAlphaPewPewExtraCharges() {
      const callable = httpsCallable(functions, "claimAlphaPewPewExtraCharges");
      const response = await callable({ deviceId });
      return response.data;
    },
    async fireAlphaPewPewBeam(payload) {
      const callable = httpsCallable(functions, "fireAlphaPewPewBeam");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async claimGrowBigHarvestCompletion() {
      const callable = httpsCallable(functions, "claimGrowBigHarvestCompletion");
      const response = await callable({ deviceId });
      return response.data;
    },
    async armHarvestRecapture(payload) {
      const callable = httpsCallable(functions, "armHarvestRecapture");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async renewActiveDeviceSession() {
      const callable = httpsCallable(functions, "renewActiveDeviceSession");
      const response = await callable({ deviceId });
      return response.data;
    },
    async bootstrapAdminOwner() {
      const callable = httpsCallable(functions, "bootstrapAdminOwner");
      const response = await callable({ deviceId });
      return response.data;
    },
    async getAdminControlCenterSnapshot() {
      const callable = httpsCallable(functions, "getAdminControlCenterSnapshot");
      const response = await callable({ deviceId });
      return response.data;
    },
    async listAdminAccounts() {
      const callable = httpsCallable(functions, "listAdminAccounts");
      const response = await callable({ deviceId });
      return response.data;
    },
    async assignAdminAccountRole(payload) {
      const callable = httpsCallable(functions, "assignAdminAccountRole");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async updateOfficialEvent(payload) {
      const callable = httpsCallable(functions, "updateOfficialEvent");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async searchAdminPlayer(payload) {
      const callable = httpsCallable(functions, "searchAdminPlayer");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async adjustAdminPlayerInventory(payload) {
      const callable = httpsCallable(functions, "adjustAdminPlayerInventory");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async moderateAdminPlayer(payload) {
      const callable = httpsCallable(functions, "moderateAdminPlayer");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async resetAdminMainQuest(payload) {
      const callable = httpsCallable(functions, "resetAdminMainQuest");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async submitSupportReport(payload) {
      const callable = httpsCallable(functions, "submitSupportReport");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async listAdminSupportCases() {
      const callable = httpsCallable(functions, "listAdminSupportCases");
      const response = await callable({ deviceId });
      return response.data;
    },
    async getAdminSupportCase(payload) {
      const callable = httpsCallable(functions, "getAdminSupportCase");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async takeAdminSupportCase(payload) {
      const callable = httpsCallable(functions, "takeAdminSupportCase");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async addAdminSupportCaseNote(payload) {
      const callable = httpsCallable(functions, "addAdminSupportCaseNote");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async editAdminSupportCaseNote(payload) {
      const callable = httpsCallable(functions, "editAdminSupportCaseNote");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async updateAdminSupportCaseStatus(payload) {
      const callable = httpsCallable(functions, "updateAdminSupportCaseStatus");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async flagSupportReportSubmissionAbuse(payload) {
      const callable = httpsCallable(functions, "flagSupportReportSubmissionAbuse");
      const response = await callable({ ...payload, deviceId });
      return response.data;
    },
    async transferActiveDevice() {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Sign in with Google before moving your account.");
      }

      await reauthenticateWithPopup(user, provider);
      await user.getIdToken(true);

      const callable = httpsCallable(functions, "transferActiveDevice");
      const response = await callable({ deviceId });
      return response.data;
    }
  };
}

async function prepareProfileAvatar(file) {
  if (!(file instanceof Blob) || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose an image file for your profile picture.");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const maxSide = 256;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your profile picture could not be prepared.");
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Your profile picture could not be prepared.")), "image/jpeg", 0.86);
    });
    if (blob.size > 512 * 1024) {
      throw new Error("Choose a smaller profile picture.");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImage(sourceUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be opened."));
    image.src = sourceUrl;
  });
}

function createAvatarRequestId() {
  return `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateDeviceId() {
  const storageKey = "growgo-device-installation-id";
  const existing = globalThis.localStorage?.getItem(storageKey);
  if (typeof existing === "string" && /^[A-Za-z0-9_-]{22,128}$/.test(existing)) {
    return existing;
  }

  const bytes = new Uint8Array(24);
  const cryptoApi = globalThis.crypto;
  const generated =
    cryptoApi && typeof cryptoApi.getRandomValues === "function"
      ? Array.from(cryptoApi.getRandomValues(bytes), (value) =>
          value.toString(16).padStart(2, "0")
        ).join("")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
          .toString(36)
          .slice(2)}`.replace(/[^A-Za-z0-9_-]/g, "");
  const deviceId =
    generated.length >= 22
      ? generated
      : `${generated}${"x".repeat(22 - generated.length)}`;
  globalThis.localStorage?.setItem(storageKey, deviceId);
  return deviceId;
}
