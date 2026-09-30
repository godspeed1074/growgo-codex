import { createDevelopmentAlphaController } from "./development-alpha-controller.mjs?v=achievement-pins-3&world-first-live-1&read-optimization-1&friends-profile-20260909&players-met-20260909&bird-pilot-20260911&batch-pilot-20260913&test-capture-range-1";
import { createAutoCaptureBatcher } from "./auto-capture-batcher.mjs?v=20260913";

const developmentAlphaStartupDiagnosticsNamespace =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : (globalThis.GrowGoDeveloperDiagnostics = {});

developmentAlphaStartupDiagnosticsNamespace.developmentAlphaModuleExecutionStarted =
  true;
developmentAlphaStartupDiagnosticsNamespace.developmentAlphaModuleExecutionTimestamp =
  Date.now();

const CLIENT_CONFIG_GLOBAL = "__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__";
const DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE =
  "DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE";
const LOADING_DID_YOU_KNOW_TIPS = Object.freeze([
  "Hold a base pin to discover more options, including how to make it yours.",
  "Need a crafting ingredient? Hold it to open the Market and buy more.",
  "Complete every card in a set to earn a collection reward. Complete every rare version for an extra reward.",
  "Seeds can be planted in base pins you own. Check back as your crop grows through each stage.",
  "Ready-to-harvest crops can be captured once each day for their resources.",
  "Your local store may occasionally have rare and unique goods to buy.",
  "Higher-level crafted goods have longer durations and enhanced effects.",
  "Food can give temporary boosts. Only one food boost can be active at a time.",
  "Explore with nearby players in a Party to earn bonus XP together.",
  "Tap the square in the top corner to open the Main Menu. Tap outside it to return to the map.",
  "Double-tap an empty part of the map to return to your location.",
  "Swipe your player photo in the Main Menu to reveal your unique player code.",
  "Your achievements can become special event pins at Farmers Markets. Higher-point achievements create larger pins."
]);
const activeLoadingDidYouKnowTip =
  LOADING_DID_YOU_KNOW_TIPS[
    Math.floor(Math.random() * LOADING_DID_YOU_KNOW_TIPS.length)
  ];
let loadingDidYouKnowMapCardShown = false;
let loadingDidYouKnowDismissed = false;

function isLocalDevelopmentHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  );
}

async function loadDevelopmentAlphaFirebaseRuntime(runtimeContract) {
  try {
    const runtimeModule = await import("./development-alpha-runtime.mjs?v=achievement-pins-3&world-first-live-1&read-optimization-1&friends-profile-20260909&players-met-20260909&bird-pilot-20260911&test-capture-range-1");
    const createRuntime = runtimeModule?.createDevelopmentAlphaFirebaseRuntime;

    if (typeof createRuntime !== "function") {
      const missingExportError = new Error(
        DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE
      );
      missingExportError.code = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
      missingExportError.reasonCode = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
      throw missingExportError;
    }

    return createRuntime(runtimeContract);
  } catch (error) {
    const runtimeUnavailableError = new Error(
      DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE
    );
    runtimeUnavailableError.code = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
    runtimeUnavailableError.reasonCode = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
    runtimeUnavailableError.cause = error;
    throw runtimeUnavailableError;
  }
}

const panel = buildPanel();
const elements = bindPanelElements(panel);
const localUiPreviewEnabled =
  isLocalDevelopmentHost(globalThis?.location?.hostname ?? "") &&
  new URLSearchParams(globalThis?.location?.search ?? "").get("uiPreview") === "1";
let testCaptureRangeMapToggleBusy = false;

const controller = createDevelopmentAlphaController({
  readConfig() {
    return globalThis[CLIENT_CONFIG_GLOBAL] ?? null;
  },
  async createRuntime(runtimeContract) {
    return loadDevelopmentAlphaFirebaseRuntime(runtimeContract);
  },
  render(state) {
    renderPanel(elements, state);
    renderTestCaptureRangeMapToggle(state);
  },
  toClientSafeError(error) {
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "The development backend is unavailable right now.";
  },
  isUnauthorizedError(error) {
    return (
      error?.code === "permission-denied" ||
      error?.code === "functions/permission-denied"
    );
  },
  createRequestId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
});

const testCaptureRangeMapToggle = document.querySelector("#testCaptureRangeMapToggle");
testCaptureRangeMapToggle?.addEventListener("click", async () => {
  if (testCaptureRangeMapToggleBusy) return;
  const state = controller.getState();
  const expiry = Date.parse(state.playerSnapshot?.testUnlimitedCaptureRangeExpiresAt || "");
  const enabled = Number.isFinite(expiry) && expiry > Date.now();
  testCaptureRangeMapToggleBusy = true;
  renderTestCaptureRangeMapToggle(state);
  try {
    const result = await controller.toggleTestCaptureRange({ enabled: !enabled });
    if (typeof globalThis.showToast === "function") {
      globalThis.showToast("Test capture range", result.enabled ? "Enabled for 30 minutes." : "Disabled.");
    }
  } catch (error) {
    if (typeof globalThis.showToast === "function") {
      globalThis.showToast("Test capture range", error?.message || "Could not update the test range.");
    }
  } finally {
    testCaptureRangeMapToggleBusy = false;
    renderTestCaptureRangeMapToggle(controller.getState());
  }
});

const batchPilotWaiters = new Map();
let batchPilotDisabled = false;
const batchPilotQueue = createAutoCaptureBatcher({
  send: payload => controller.capturePinBatch(payload),
  onResult(result, evidence) {
    const waiter = batchPilotWaiters.get(evidence.requestId);
    batchPilotWaiters.delete(evidence.requestId);
    if (!waiter) return;
    if (controller.getState().user?.uid !== "LkR8ugTK6lXGFfUlLvKSiqMoMBh1") {
      waiter.reject(new Error("Player session changed.")); return;
    }
    if (result.error) {
      if (result.error.code === "permission-denied") batchPilotDisabled = true;
      waiter.reject(Object.assign(new Error(result.error.message), result.error));
    } else {
      notifyBirdQuestReceipt("capture", result.response?.requestId, result.response);
      waiter.resolve(result.response);
    }
  },
  onError(error, evidence) {
    batchPilotDisabled = true;
    const waiter = batchPilotWaiters.get(evidence.requestId);
    batchPilotWaiters.delete(evidence.requestId); waiter?.reject(error);
  }
});
globalThis.__GROWGO_SERVER_GAMEPLAY__ = Object.freeze({
  isBatchAutoCaptureEnabled() {
    return !batchPilotDisabled && globalThis.__GROWGO_AUTO_CAPTURE_BATCH_PILOT__ === true &&
      controller.getState().user?.uid === "LkR8ugTK6lXGFfUlLvKSiqMoMBh1";
  },
  captureAutoPin(payload) {
    const requestId = crypto.randomUUID();
    stageBirdQuestReceipt("capture", requestId);
    return new Promise((resolve, reject) => {
      batchPilotWaiters.set(requestId, {resolve, reject});
      if (!batchPilotQueue.enqueue({...payload, requestId})) {
        batchPilotWaiters.delete(requestId); reject(new Error("Capture already queued."));
      }
    });
  },
  isActive() {
    const state = controller.getState();
    return (
      (state.connectionMode === "live" || state.connectionMode === "emulator") &&
      state.authStatus === "signed-in" &&
      state.playerSnapshot?.profileComplete === true
    );
  },
  async capturePin(payload) {
    if (globalThis.__GROWGO_BIRD_QUEST_UI__?.uid) payload = { ...payload, requestId: payload?.requestId || crypto.randomUUID() };
    stageBirdQuestReceipt("capture", payload?.requestId);
    const result = await controller.capturePin(payload);
    notifyBirdQuestReceipt("capture", result?.requestId, result);
    return result;
  },
  async captureDailyPoi(payload) {
    stageBirdQuestReceipt("poi", payload?.pinId);
    const result = await controller.captureDailyPoi(payload);
    notifyBirdQuestReceipt("poi", result?.pinId, result);
    return result;
  },
  birdQuests(payload) {
    return controller.birdQuests(payload);
  },
  playerMail(payload) { return controller.playerMail(payload); },
  leonardQuest(payload) { return controller.leonardQuest(payload); },
  updatePlayerAvatar(file) {
    return controller.updatePlayerAvatar(file);
  },
  clearPlayerAvatar() {
    return controller.clearPlayerAvatar();
  },
  subscribeWorldFirstAnnouncement(callback) {
    return controller.subscribeWorldFirstAnnouncement(callback);
  },
  scanGrowGoPlayerCode(payload) {
    return controller.scanGrowGoPlayerCode(payload);
  },
  addGrowGoFriend(payload) {
    return controller.addGrowGoFriend(payload);
  },
  getGrowGoSocialSnapshot() {
    return controller.getGrowGoSocialSnapshot();
  },
  getFriendProfile(payload) {
    return controller.getFriendProfile(payload);
  },
  getMetPlayerProfile(payload) {
    return controller.getMetPlayerProfile(payload);
  },
  getOfficialEventCalendar() {
    return controller.getOfficialEventCalendar();
  },
  createFarmerMarket(payload) {
    return controller.createFarmerMarket(payload);
  },
  getFarmerMarketDirectory() {
    return controller.getFarmerMarketDirectory();
  },
  setFarmerMarketWillAttend(payload) {
    return controller.setFarmerMarketWillAttend(payload);
  },
  getFarmerMarketCheckInCode(payload) {
    return controller.getFarmerMarketCheckInCode(payload);
  },
  checkInToFarmerMarket(payload) {
    return controller.checkInToFarmerMarket(payload);
  },
  getFarmerMarketPewPewStatus() {
    return controller.getFarmerMarketPewPewStatus();
  },
  migrateLegacyAlphaAchievementRecords(payload) {
    return controller.migrateLegacyAlphaAchievementRecords(payload);
  },
  getFarmerMarketAchievementSnapshot() {
    return controller.getFarmerMarketAchievementSnapshot();
  },
  getSharedAvatarObjectUrl(avatarUrl) {
    return controller.getSharedAvatarObjectUrl(avatarUrl);
  },
  deployFarmerMarketAchievementPin(payload) {
    return controller.deployFarmerMarketAchievementPin(payload);
  },
  captureFarmerMarketAchievementPin(payload) {
    return controller.captureFarmerMarketAchievementPin(payload);
  },
  createGrowGoParty(payload) {
    return controller.createGrowGoParty(payload);
  },
  joinGrowGoParty(payload) {
    return controller.joinGrowGoParty(payload);
  },
  cancelGrowGoParty() {
    return controller.cancelGrowGoParty();
  },
  leaveGrowGoParty() {
    return controller.leaveGrowGoParty();
  },
  reportGrowGoPartyLocation(payload) {
    return controller.reportGrowGoPartyLocation(payload);
  },
  armHarvestRecapture(payload) {
    return controller.armHarvestRecapture(payload);
  },
  getNearbyBasePins(payload) {
    return controller.getNearbyBasePins(payload);
  },
  mutateWorldBasePin(payload) {
    return controller.mutateWorldBasePin(payload);
  },
  recoverLegacyBasePinOwnership(payload) {
    return controller.recoverLegacyBasePinOwnership(payload);
  },
  getPlayerId() {
    return controller.getState().user?.uid ?? null;
  },
  searchNearbyPois(payload) {
    return controller.searchNearbyPois(payload);
  },
  getLeaderboard(payload) {
    return controller.getLeaderboard(payload);
  },
  initializeMarketInventory(payload) {
    return controller.initializeMarketInventory(payload);
  },
  getMarketplaceSnapshot() {
    return controller.getMarketplaceSnapshot();
  },
  createMarketplaceListing(payload) {
    return controller.createMarketplaceListing(payload);
  },
  cancelMarketplaceListing(payload) {
    return controller.cancelMarketplaceListing(payload);
  },
  purchaseMarketplaceListing(payload) {
    return controller.purchaseMarketplaceListing(payload);
  },
  craftEnergyBar(payload) {
    return controller.craftEnergyBar(payload);
  },
  async craftRecipe(payload) {
    stageBirdQuestReceipt("craft", payload?.requestId);
    const result = await controller.craftRecipe(payload);
    notifyBirdQuestReceipt("craft", payload?.requestId, result);
    return result;
  },
  useEnergyBar(payload) {
    return controller.useEnergyBar(payload);
  },
  useFood(payload) {
    return controller.useFood(payload);
  },
  startStarterQuest() {
    return controller.startStarterQuest();
  },
  completeInterfaceTutorial() {
    return controller.completeInterfaceTutorial();
  },
  claimAlphaSeedBundle() {
    return controller.claimAlphaSeedBundle();
  },
  claimAlphaWheatBundle() {
    return controller.claimAlphaWheatBundle();
  },
  claimAlphaMiracleGrowBundle() {
    return controller.claimAlphaMiracleGrowBundle();
  },
  claimAlphaBatteredFishBundle() {
    return controller.claimAlphaBatteredFishBundle();
  },
  claimAlphaBinglesScarecrowTestKit() {
    return controller.claimAlphaBinglesScarecrowTestKit();
  },
  deployAlphaBinglesScarecrow(payload) {
    return controller.deployAlphaBinglesScarecrow(payload);
  },
  subscribeMapDirectory(directory, callback) {
    return controller.subscribeMapDirectory(directory, callback);
  },
  getActiveBinglesScarecrows(payload = {}) {
    return controller.getActiveBinglesScarecrows(payload);
  },
  updateAlphaBinglesScarecrowSettings(payload) {
    return controller.updateAlphaBinglesScarecrowSettings(payload);
  },
  claimAlphaTestCoinGrant() {
    return controller.claimAlphaTestCoinGrant();
  },
  claimAlphaPewPewTestKit() {
    return controller.claimAlphaPewPewTestKit();
  },
  consumeAlphaPewPewTestCharge() {
    return controller.consumeAlphaPewPewTestCharge();
  },
  claimAlphaPewPewExtraCharges() {
    return controller.claimAlphaPewPewExtraCharges();
  },
  async fireAlphaPewPewBeam(payload) {
    stageBirdQuestReceipt("beam", payload?.requestId);
    const result = await controller.fireAlphaPewPewBeam(payload);
    notifyBirdQuestReceipt("beam", payload?.requestId, result);
    return result;
  },
  claimGrowBigHarvestCompletion() {
    return controller.claimGrowBigHarvestCompletion();
  },
  bootstrapAdminOwner() {
    return controller.bootstrapAdminOwner();
  },
  getAdminControlCenterSnapshot() {
    return controller.getAdminControlCenterSnapshot();
  },
  listAdminAccounts() {
    return controller.listAdminAccounts();
  },
  assignAdminAccountRole(payload) {
    return controller.assignAdminAccountRole(payload);
  },
  updateOfficialEvent(payload) {
    return controller.updateOfficialEvent(payload);
  },
  searchAdminPlayer(payload) {
    return controller.searchAdminPlayer(payload);
  },
  toggleTestCaptureRange(payload) {
    return controller.toggleTestCaptureRange(payload);
  },
  adjustAdminPlayerInventory(payload) {
    return controller.adjustAdminPlayerInventory(payload);
  },
  moderateAdminPlayer(payload) {
    return controller.moderateAdminPlayer(payload);
  },
  resetAdminMainQuest(payload) {
    return controller.resetAdminMainQuest(payload);
  },
  submitSupportReport(payload) {
    return controller.submitSupportReport(payload);
  },
  listAdminSupportCases() {
    return controller.listAdminSupportCases();
  },
  getAdminSupportCase(payload) {
    return controller.getAdminSupportCase(payload);
  },
  takeAdminSupportCase(payload) {
    return controller.takeAdminSupportCase(payload);
  },
  addAdminSupportCaseNote(payload) {
    return controller.addAdminSupportCaseNote(payload);
  },
  editAdminSupportCaseNote(payload) {
    return controller.editAdminSupportCaseNote(payload);
  },
  updateAdminSupportCaseStatus(payload) {
    return controller.updateAdminSupportCaseStatus(payload);
  },
  flagSupportReportSubmissionAbuse(payload) {
    return controller.flagSupportReportSubmissionAbuse(payload);
  },
  getPlayerSnapshot() {
    return controller.getState().playerSnapshot;
  }
});

elements.signInButton.addEventListener("click", () => {
  controller.signIn().catch(() => {});
});
elements.signOutButton.addEventListener("click", () => {
  controller.signOut().catch(() => {});
});
elements.refreshButton.addEventListener("click", () => {
  controller.refreshSnapshot().catch(() => {});
});
elements.transferDeviceButton.addEventListener("click", () => {
  controller.transferActiveDevice().catch(() => {});
});
elements.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(elements.profileForm);
  controller.completeProfile({
    avatarName: form.get("avatarName"),
    region: form.get("region"),
    country: form.get("country"),
    state: form.get("state"),
    gender: form.get("gender")
  }).catch(() => {});
});
elements.regionSelect.addEventListener("change", () => {
  populateCountries(elements.regionSelect.value, elements.countrySelect, elements.stateSelect);
});
elements.countrySelect.addEventListener("change", () => {
  populateStates(elements.regionSelect.value, elements.countrySelect.value, elements.stateSelect);
});
elements.loadingTipCard?.querySelector("[data-loading-tip-close]")?.addEventListener("click", () => {
  loadingDidYouKnowDismissed = true;
  elements.loadingTipCard.hidden = true;
});

if (localUiPreviewEnabled) {
  panel.hidden = true;
  developmentAlphaStartupDiagnosticsNamespace.localUiPreviewEnabled = true;
} else {
  controller.ensureInitialized().catch(() => {});
}

function getLoadingDidYouKnowCardMarkup() {
  return `
    <article class="growgo-loading-tip-card" role="dialog" aria-label="Did You Know tip">
      <span class="growgo-loading-tip-outline" aria-hidden="true"></span>
      <span class="growgo-loading-tip-string" aria-hidden="true"></span>
      <span class="growgo-loading-tip-knot" aria-hidden="true"></span>
      <span class="growgo-loading-tip-pin" aria-hidden="true"><span>5</span></span>
      <span class="growgo-loading-tip-leaves" aria-hidden="true"><i></i><i></i><i></i></span>
      <button class="growgo-loading-tip-close" data-loading-tip-close type="button" aria-label="Close tip">×</button>
      <span class="growgo-loading-tip-spark growgo-loading-tip-spark-one" aria-hidden="true">✦</span>
      <span class="growgo-loading-tip-spark growgo-loading-tip-spark-two" aria-hidden="true">✦</span>
      <h2>Did You Know?</h2>
      <p>${activeLoadingDidYouKnowTip}</p>
      <span class="growgo-loading-tip-dismiss">Tap outside this card to return to your map</span>
    </article>
  `;
}

function showLoadingDidYouKnowCardOnMap(cardToKeep = null) {
  if (loadingDidYouKnowMapCardShown || loadingDidYouKnowDismissed) return;
  loadingDidYouKnowMapCardShown = true;

  const overlay = document.createElement("div");
  overlay.id = "growGoLoadingTipOverlay";
  overlay.className = "growgo-loading-tip-overlay";
  if (cardToKeep) {
    overlay.appendChild(cardToKeep);
  } else {
    overlay.innerHTML = getLoadingDidYouKnowCardMarkup();
  }

  const dismiss = () => {
    loadingDidYouKnowDismissed = true;
    overlay.remove();
  };
  const card = overlay.querySelector(".growgo-loading-tip-card");
  overlay.querySelector("[data-loading-tip-close]")?.addEventListener("click", dismiss);
  overlay.addEventListener("pointerdown", (event) => {
    if (!card?.contains(event.target)) dismiss();
  });

  document.body.appendChild(overlay);
}

function buildPanel() {
  const panel = document.createElement("section");
  panel.id = "growGoAccountGate";
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.inset = "0";
  panel.style.zIndex = "12000";
  panel.style.width = "100%";
  panel.style.overflowY = "auto";
  panel.style.background = "linear-gradient(160deg,#e8fbff 0%,#c9f4e5 52%,#fff2bd 100%)";
  panel.style.color = "#f4f8ff";
  panel.style.border = "none";
  panel.style.borderRadius = "0";
  panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  panel.style.padding = "max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))";
  panel.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  panel.innerHTML = `
    <div id="growGoAccountCard" style="width:min(460px,100%);margin:auto;background:rgba(7,48,80,.96);border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(0,35,60,.28);">
    <div id="growGoAccountBrand" style="text-align:center;margin-bottom:20px;">
      <div style="font-size:42px">🌱</div>
      <h1 style="margin:4px 0 6px;font-size:30px">GrowGo</h1>
      <p style="margin:0;opacity:.82">Grow your world, one adventure at a time.</p>
    </div>
    <div id="growGoSignInView">
      <button id="developmentAlphaSignInButton" type="button" style="${buttonStyle("#ffffff")};width:100%;color:#18354a;padding:14px;font-size:15px">Continue with Google</button>
      <p style="font-size:12px;line-height:1.45;opacity:.72;text-align:center;margin:14px 0 0">By continuing, you agree to GrowGo's Terms and acknowledge the Privacy Policy. Location access is requested during gameplay because GrowGo is a geolocation game. We do not share location data with outside sources.</p>
    </div>
    <div id="growGoDeviceTransferView" hidden style="text-align:center">
      <h2 style="margin:0 0 8px">Move your account</h2>
      <p style="margin:0 0 16px;opacity:.82;line-height:1.45">This GrowGo account is currently active on another device. Sign in with Google again to move it here.</p>
      <button id="growGoDeviceTransferButton" type="button" style="${buttonStyle("#56d92c")};width:100%;padding:14px;font-size:15px">Move Account to This Device</button>
    </div>
    <form id="growGoProfileForm" hidden>
      <h2 style="margin:0 0 6px">Create your player profile</h2>
      <p style="margin:0 0 18px;opacity:.8">Your player name is permanent. Location choices are used for leaderboards.</p>
      ${profileField("Player name", '<input name="avatarName" minlength="3" maxlength="20" autocomplete="nickname" required />')}
      ${profileField("Region", '<select name="region" id="growGoRegion" required><option value="">Select region</option><option value="north-america">North America</option><option value="europe">Europe</option><option value="oceania">Oceania</option></select>')}
      ${profileField("Country", '<select name="country" id="growGoCountry" required disabled><option value="">Select country</option></select>')}
      ${profileField("State / province", '<select name="state" id="growGoState" required disabled><option value="">Select state</option></select>')}
      <fieldset style="border:0;padding:0;margin:0 0 18px"><legend style="font-weight:700;margin-bottom:8px">Gender</legend><label style="margin-right:18px"><input type="radio" name="gender" value="male" required /> Male</label><label><input type="radio" name="gender" value="female" required /> Female</label></fieldset>
      <button id="growGoProfileSubmit" type="submit" style="${buttonStyle("#56d92c")};width:100%;padding:14px;font-size:15px">Create profile</button>
    </form>
    <div id="growGoAccountLoading" class="growgo-connection-loader" hidden>
      ${getLoadingDidYouKnowCardMarkup()}
      <p class="growgo-connection-status">Connecting securely</p>
    </div>
    <div id="growGoAccountError" role="alert" style="font-size:13px;color:#ffd4d4;margin-top:12px"></div>
    <div id="growGoAccountStatusDetails">
      <div id="developmentAlphaDebug" hidden>
        <div>
          <div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.72;">Development backend</div>
          <strong style="font-size:15px;">Private alpha status</strong>
        </div>
        <div id="developmentAlphaStatusBadge" style="font-size:11px;padding:4px 6px;border-radius:999px;background:#243447;">Blocked</div>
      </div>
      <div id="developmentAlphaSummary" style="font-size:13px;line-height:1.4;margin-bottom:8px;"></div>
      <div id="developmentAlphaSnapshot" style="font-size:12px;line-height:1.5;opacity:0.9;margin-bottom:10px;"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="developmentAlphaRefreshButton" type="button" style="${buttonStyle("#1f7a5c")}">Refresh</button>
        <button id="developmentAlphaSignOutButton" type="button" style="${buttonStyle("#5c6470")}">Sign out</button>
      </div>
    </div>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function bindPanelElements(panel) {
  return {
    card: panel.querySelector("#growGoAccountCard"),
    brand: panel.querySelector("#growGoAccountBrand"),
    badge: panel.querySelector("#developmentAlphaStatusBadge"),
    summary: panel.querySelector("#developmentAlphaSummary"),
    snapshot: panel.querySelector("#developmentAlphaSnapshot"),
    signInButton: panel.querySelector("#developmentAlphaSignInButton"),
    refreshButton: panel.querySelector("#developmentAlphaRefreshButton"),
    signOutButton: panel.querySelector("#developmentAlphaSignOutButton"),
    signInView: panel.querySelector("#growGoSignInView"),
    deviceTransferView: panel.querySelector("#growGoDeviceTransferView"),
    transferDeviceButton: panel.querySelector("#growGoDeviceTransferButton"),
    loadingView: panel.querySelector("#growGoAccountLoading"),
    loadingTipCard: panel.querySelector(".growgo-loading-tip-card"),
    statusDetails: panel.querySelector("#growGoAccountStatusDetails"),
    profileForm: panel.querySelector("#growGoProfileForm"),
    profileSubmit: panel.querySelector("#growGoProfileSubmit"),
    regionSelect: panel.querySelector("#growGoRegion"),
    countrySelect: panel.querySelector("#growGoCountry"),
    stateSelect: panel.querySelector("#growGoState"),
    error: panel.querySelector("#growGoAccountError")
  };
}

let birdPilotLoading = false;
function stageBirdQuestReceipt(kind, id) {
  if (!id) return;
  try { globalThis.__GROWGO_BIRD_QUEST_UI__?.recordReceipt({ kind, id }, false); }
  catch (error) { console.warn("Bird quest receipt could not be queued.", error); }
}
function notifyBirdQuestReceipt(kind, id, response) {
  if (!id || response?.ok !== true) return;
  try { globalThis.__GROWGO_BIRD_QUEST_UI__?.recordReceipt({ kind, id }); }
  catch (error) { console.warn("Bird quest progress will retry separately.", error); }
}
function startBirdQuestPilot(state) {
  if (!state.user?.uid || !state.playerSnapshot?.profileComplete || state.authStatus !== "signed-in") {
    globalThis.__GROWGO_BIRD_QUEST_UI__?.stop?.();
    return;
  }
  if (birdPilotLoading || globalThis.__GROWGO_BIRD_QUEST_UI__?.uid === state.user.uid) return;
  birdPilotLoading = true;
  import("./bird-quest-ui.mjs?v=bird-mobile-audio-unlock-20260912").then(module => {
    if (controller.getState().user?.uid !== state.user.uid) return;
    globalThis.__GROWGO_BIRD_QUEST_UI__?.stop?.();
    globalThis.__GROWGO_BIRD_QUEST_UI__ = module.installBirdQuestUI({
      uid: state.user.uid, bridge: globalThis.__GROWGO_SERVER_GAMEPLAY__, host: globalThis.__GROWGO_BIRD_QUEST_HOST__
    });
  }).catch(error => console.warn("Bird quest screen unavailable; gameplay continues.", error))
    .finally(() => { birdPilotLoading = false; });
}

function renderTestCaptureRangeMapToggle(state) {
  const button = document.querySelector("#testCaptureRangeMapToggle");
  if (!button) return;
  const player = state.playerSnapshot;
  const normalizedName = typeof player?.displayName === "string"
    ? player.displayName.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US")
    : "";
  const eligibleName = normalizedName === "rubberlips" || normalizedName === "obi-cal";
  const eligible = state.authStatus === "signed-in" && player?.profileComplete === true && eligibleName;
  button.hidden = !eligible;
  button.classList.toggle("hidden", !eligible);
  const expiry = Date.parse(player?.testUnlimitedCaptureRangeExpiresAt || "");
  const enabled = Number.isFinite(expiry) && expiry > Date.now();
  button.classList.toggle("is-active", enabled);
  button.setAttribute("aria-pressed", String(enabled));
  button.setAttribute("aria-label", `Unlimited test capture range ${enabled ? "on" : "off"}`);
  button.textContent = enabled ? "Test range · ON" : "Test range · OFF";
  button.disabled = testCaptureRangeMapToggleBusy;
  button.setAttribute("aria-busy", String(testCaptureRangeMapToggleBusy));
}

function renderPanel(elements, state) {
  try { globalThis.__GROWGO_PERSONAL_MAILBOX_AUTH_REFRESH__?.(); } catch { /* Optional private marker only. */ }
  // Optional pilot loading is detached from auth/bootstrap and the map loader.
  queueMicrotask(() => startBirdQuestPilot(state));
  const signedIn = state.authStatus === "signed-in";
  const profileComplete = state.playerSnapshot?.profileComplete === true;
  const needsProfile = signedIn && state.playerSnapshot && !profileComplete;
  const isConnecting =
    state.initializationStatus === "initializing" ||
    state.authStatus === "restoring" ||
    state.authStatus === "signing-in" ||
    (signedIn &&
      !state.playerSnapshot &&
      state.deviceTransferStatus !== "required" &&
      state.snapshotStatus !== "error" &&
      state.bootstrapStatus !== "error");
  if (profileComplete) {
    // Hand the original card to the map before its loading-screen parent is
    // hidden, so the browser never has an intervening frame without the card.
    showLoadingDidYouKnowCardOnMap(elements.loadingTipCard);
  }
  elements.signInView.hidden = state.initializationStatus !== "initialized" || signedIn;
  elements.loadingView.hidden = !isConnecting;
  elements.brand.hidden = isConnecting;
  elements.statusDetails.hidden = isConnecting;
  elements.error.hidden = isConnecting || !state.genericError;
  elements.card.classList.toggle("growgo-connection-active", isConnecting);
  elements.profileForm.hidden = !needsProfile;
  elements.deviceTransferView.hidden = state.deviceTransferStatus !== "required";
  elements.transferDeviceButton.disabled = state.deviceTransferStatus === "moving";
  elements.profileSubmit.disabled = state.profileStatus === "saving";
  elements.error.textContent = state.genericError ?? "";
  elements.badge.closest("#developmentAlphaDebug").hidden = true;
  elements.badge.closest("section").hidden = profileComplete;

  if (profileComplete) {
    if (typeof globalThis.applyGrowGoServerPlayerIdentity === "function") {
      globalThis.applyGrowGoServerPlayerIdentity(state.playerSnapshot);
    }
    if (typeof globalThis.applyGrowGoServerPlayerAvatar === "function") {
      globalThis.applyGrowGoServerPlayerAvatar(state.playerSnapshot);
    }
    document.body.classList.remove("menu-open");
    const avatarButton = document.querySelector("#avatarButton");
    const topAvatarFallback = document.querySelector("#topAvatarFallback");
    if (avatarButton) {
      avatarButton.hidden = false;
      avatarButton.setAttribute("aria-label", "Open main menu");
      avatarButton.title = "Open main menu";
    }
    if (topAvatarFallback?.classList.contains("hidden") === false) {
      topAvatarFallback.textContent = "☰";
    }
    const menuName = document.querySelector(".menu-player-name");
    if (menuName) menuName.textContent = state.playerSnapshot.displayName;
    const coinCount = document.querySelector("#coinCount");
    if (coinCount) coinCount.textContent = String(state.playerSnapshot.coins);

    if (!globalThis.__GROWGO_SERVER_GAMEPLAY_READY__) {
      globalThis.__GROWGO_SERVER_GAMEPLAY_READY__ = true;
      globalThis.dispatchEvent(new Event("growgo:server-gameplay-ready"));
    }
  } else {
    globalThis.__GROWGO_SERVER_GAMEPLAY_READY__ = false;
  }

  elements.badge.textContent = summarizeBadge(state);
  elements.summary.innerHTML = [
    line("Environment", state.environment),
    line("Connection", state.connectionMode ?? "blocked"),
    line("Auth", state.authStatus),
    line("Invite", state.invitedStatus)
  ].join("");

  if (state.playerSnapshot) {
    elements.snapshot.innerHTML = [
      line("UID", state.user?.uid ?? "n/a"),
      line("Email", state.user?.email ?? "n/a"),
      line("Level", String(state.playerSnapshot.level)),
      line("XP", String(state.playerSnapshot.xp)),
      line("Coins", String(state.playerSnapshot.coins))
    ].join("");
  } else if (state.genericError) {
    elements.snapshot.textContent = state.genericError;
  } else if (state.blockedReasons.length > 0) {
    elements.snapshot.textContent = `Blocked: ${state.blockedReasons.join(", ")}`;
  } else {
    elements.snapshot.textContent =
      "No backend snapshot loaded. Sign in to the invited development alpha.";
  }

  elements.signInButton.disabled =
    state.initializationStatus !== "initialized" ||
    state.authStatus === "signed-in" ||
    state.authStatus === "signing-in";
  elements.signOutButton.disabled = state.authStatus !== "signed-in";
  elements.refreshButton.disabled =
    state.authStatus !== "signed-in" ||
    state.snapshotStatus === "loading" ||
    state.bootstrapStatus === "pending";
}

function profileField(label, control) {
  return `<label style="display:grid;gap:6px;margin-bottom:14px;font-weight:700">${label}${control}</label>`;
}

const locationOptions = Object.freeze({
  "north-america": Object.freeze({
    ...Object.fromEntries(["Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Costa Rica", "Cuba", "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago"].map((country) => [country, ["Not applicable"]])),
    "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"],
    "Mexico": ["Aguascalientes", "Baja California", "Chiapas", "Chihuahua", "Jalisco", "Mexico City", "Nuevo Leon", "Oaxaca", "Puebla", "Queretaro", "Sonora", "Veracruz", "Yucatan"],
    "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"]
  }),
  "europe": Object.freeze(Object.fromEntries(["Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom", "Vatican City"].map((country) => [country, ["Not applicable"]]))),
  "oceania": Object.freeze({
    ...Object.fromEntries(["Kiribati", "Marshall Islands", "Micronesia", "Nauru", "Palau", "Samoa", "Solomon Islands", "Tonga", "Tuvalu", "Vanuatu"].map((country) => [country, ["Not applicable"]])),
    "Australia": ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
    "Fiji": ["Central", "Eastern", "Northern", "Western"],
    "New Zealand": ["Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatu-Whanganui", "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman", "Waikato", "Wellington", "West Coast"],
    "Papua New Guinea": ["Central", "Eastern Highlands", "East New Britain", "Morobe", "National Capital District", "Western", "Western Highlands"]
  })
});

function populateCountries(region, countrySelect, stateSelect) {
  const countries = Object.keys(locationOptions[region] ?? {});
  setSelectOptions(countrySelect, "Select country", countries);
  countrySelect.disabled = countries.length === 0;
  setSelectOptions(stateSelect, "Select state", []);
  stateSelect.disabled = true;
}

function populateStates(region, country, stateSelect) {
  const states = locationOptions[region]?.[country] ?? [];
  setSelectOptions(stateSelect, "Select state", states);
  stateSelect.disabled = states.length === 0;
}

function setSelectOptions(select, placeholder, values) {
  select.replaceChildren(new Option(placeholder, ""), ...values.map((value) => new Option(value, value)));
}

function summarizeBadge(state) {
  if (state.authStatus === "signed-in" && state.playerSnapshot) {
    return "Connected";
  }

  if (state.authStatus === "unauthorized") {
    return "Denied";
  }

  if (state.initializationStatus === "initialized") {
    return "Ready";
  }

  if (state.initializationStatus === "initializing") {
    return "Starting";
  }

  return "Blocked";
}

function line(label, value) {
  return `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;
}

function buttonStyle(background) {
  return [
    "appearance:none",
    "border:none",
    "border-radius:6px",
    "padding:8px 10px",
    "font:inherit",
    "font-size:12px",
    "font-weight:600",
    "cursor:pointer",
    "color:#fff",
    `background:${background}`
  ].join(";");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
