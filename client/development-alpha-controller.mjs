import {
  buildDevelopmentAlphaRuntimeContract
} from "./development-alpha-contract.mjs";

export function createDevelopmentAlphaController(dependencies) {
  const deps = validateDependencies(dependencies);
  let initPromise = null;
  let runtime = null;
  let authUnsubscribe = null;
  let initialAuthResolution = null;
  let initialAuthSettled = false;
  let lastBootstrapUid = null;
  let snapshotInFlight = false;
  let snapshotRequestCount = 0;
  let deviceSessionRefreshTimer = null;
  let worldFirstAnnouncementUnsubscribe = null;
  const mapDirectorySubscriptions = new Map();

  function subscribeMapDirectory(directory, callback) {
    mapDirectorySubscriptions.get(directory)?.();
    mapDirectorySubscriptions.delete(directory);
    if (!runtime || !state.user || typeof runtime.subscribeMapDirectory !== "function") return () => {};
    const unsubscribe = runtime.subscribeMapDirectory(directory, callback);
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (typeof unsubscribe === "function") unsubscribe();
      callback({ connected: false });
    };
    mapDirectorySubscriptions.set(directory, stop);
    return () => { stop(); if (mapDirectorySubscriptions.get(directory) === stop) mapDirectorySubscriptions.delete(directory); };
  }
  function stopMapDirectorySubscriptions() {
    for (const stop of mapDirectorySubscriptions.values()) stop();
    mapDirectorySubscriptions.clear();
  }
  async function readForCurrentPlayer(operation) {
    const uid = state.user?.uid;
    const result = await operation();
    if (!uid || uid !== state.user?.uid) throw new Error("The signed-in player changed. Please reopen this screen.");
    return result;
  }
  let state = buildInitialState();

  function publish(partialState) {
    state = Object.freeze({
      ...state,
      ...partialState
    });
    deps.render(state);
    return state;
  }

  async function ensureInitialized() {
    if (initPromise) {
      return initPromise;
    }

    publish({
      initializationStatus: "initializing",
      authStatus: "restoring",
      genericError: null
    });

    initPromise = (async () => {
      const config = deps.readConfig();
      const runtimeContract = buildDevelopmentAlphaRuntimeContract(config);

      publish({
        environment: runtimeContract.environment,
        connectionMode: runtimeContract.connectionMode,
        initializationAllowed: runtimeContract.initializationAllowed,
        blockedReasons: runtimeContract.blockedReasons,
        missingFirebaseFields: runtimeContract.missingFirebaseFields
      });

      if (!runtimeContract.initializationAllowed) {
        publish({
          initializationStatus: "blocked",
          authStatus:
            runtimeContract.blockedReasons.includes("emergency-disabled")
              ? "emergency-disabled"
              : "error",
          genericError: "Development backend client configuration is unavailable."
        });
        return null;
      }

      runtime = await deps.createRuntime(runtimeContract);
      const initialAuthStateReady = new Promise((resolve) => {
        initialAuthResolution = resolve;
      });
      authUnsubscribe = runtime.onAuthStateChanged((user) =>
        handleAuthStateChanged(user)
      );

      await initialAuthStateReady;
      return runtime;
    })().catch((error) => {
      publish({
        initializationStatus: "error",
        authStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
      throw error;
    });

    return initPromise;
  }

  async function signIn() {
    const activeRuntime = await ensureInitialized();
    if (!activeRuntime) {
      return state;
    }

    publish({
      authStatus: "signing-in",
      genericError: null
    });

    try {
      await activeRuntime.signIn();
    } catch (error) {
      publish({
        authStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }

    return state;
  }

  async function signOut() {
    stopMapDirectorySubscriptions();
    stopDeviceSessionRefresh();
    stopWorldFirstAnnouncementSubscription();
    if (!runtime) {
      publish({
        authStatus: "signed-out",
        playerSnapshot: null,
        invitedStatus: "unknown",
        bootstrapStatus: "idle",
        snapshotStatus: "idle"
      });
      return state;
    }

    await runtime.signOut();
    lastBootstrapUid = null;
    snapshotInFlight = false;
    snapshotRequestCount = 0;
    publish({
      authStatus: "signed-out",
      playerSnapshot: null,
      invitedStatus: "unknown",
      bootstrapStatus: "idle",
      snapshotStatus: "idle"
    });

    return state;
  }

  async function refreshSnapshot() {
    if (!runtime || !state.user) {
      return state;
    }

    if (snapshotInFlight || snapshotRequestCount >= 2) {
      return state;
    }

    snapshotInFlight = true;
    snapshotRequestCount += 1;
    publish({
      snapshotStatus: "loading",
      genericError: null
    });

    try {
      const snapshot = await runtime.getPlayerSnapshot();
      publish({
        snapshotStatus: "ready",
        playerSnapshot: snapshot,
        genericError: null
      });
    } catch (error) {
      if (isAccountRestrictedError(error)) {
        stopDeviceSessionRefresh();
        publish({
          authStatus: "restricted",
          playerSnapshot: null,
          snapshotStatus: "error",
          bootstrapStatus: "restricted",
          genericError: deps.toClientSafeError(error)
        });
        return state;
      }
      if (deps.isUnauthorizedError(error)) {
        publish({
          authStatus: "unauthorized",
          invitedStatus: "server-denied",
          snapshotStatus: "error",
          genericError: deps.toClientSafeError(error)
        });
      } else {
        publish({
          snapshotStatus: "error",
          genericError: deps.toClientSafeError(error)
        });
      }
    } finally {
      snapshotInFlight = false;
    }

    return state;
  }

  async function completeProfile(profile) {
    if (!runtime || !state.user) return state;

    publish({ profileStatus: "saving", genericError: null });
    try {
      const playerSnapshot = await runtime.completePlayerProfile({
        requestId: deps.createRequestId("profile"),
        ...profile
      });
      publish({
        profileStatus: "complete",
        playerSnapshot,
        genericError: null
      });
    } catch (error) {
      publish({
        profileStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }
    return state;
  }

  async function updatePlayerAvatar(file) {
    if (!runtime || !state.user || typeof runtime.updatePlayerAvatar !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    const playerSnapshot = await runtime.updatePlayerAvatar(file);
    if (playerSnapshot) publish({ playerSnapshot, genericError: null });
    return playerSnapshot;
  }

  function subscribeWorldFirstAnnouncement(callback) {
    stopWorldFirstAnnouncementSubscription();
    if (!runtime || !state.user || typeof runtime.subscribeWorldFirstAnnouncement !== "function") {
      return () => {};
    }

    const unsubscribe = runtime.subscribeWorldFirstAnnouncement(callback);
    worldFirstAnnouncementUnsubscribe = typeof unsubscribe === "function" ? unsubscribe : null;
    return stopWorldFirstAnnouncementSubscription;
  }

  async function clearPlayerAvatar() {
    if (!runtime || !state.user || typeof runtime.clearPlayerAvatar !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    const playerSnapshot = await runtime.clearPlayerAvatar();
    if (playerSnapshot) publish({ playerSnapshot, genericError: null });
    return playerSnapshot;
  }

  async function scanGrowGoPlayerCode(payload) {
    if (!runtime || !state.user || typeof runtime.scanGrowGoPlayerCode !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.scanGrowGoPlayerCode(payload);
  }

  async function addGrowGoFriend(payload) {
    if (!runtime || !state.user || typeof runtime.addGrowGoFriend !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return readForCurrentPlayer(() => runtime.addGrowGoFriend(payload));
  }

  async function getGrowGoSocialSnapshot() {
    if (!runtime || !state.user || typeof runtime.getGrowGoSocialSnapshot !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return readForCurrentPlayer(() => runtime.getGrowGoSocialSnapshot());
  }

  async function getOfficialEventCalendar() {
    if (!runtime || !state.user || typeof runtime.getOfficialEventCalendar !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getOfficialEventCalendar();
  }

  async function getFriendProfile(payload) {
    if (!runtime || !state.user || typeof runtime.getFriendProfile !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    // Do not publish this response as the signed-in player's snapshot.
    return readForCurrentPlayer(() => runtime.getFriendProfile(payload));
  }

  async function getMetPlayerProfile(payload) {
    if (!runtime || !state.user || typeof runtime.getMetPlayerProfile !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return readForCurrentPlayer(() => runtime.getMetPlayerProfile(payload));
  }

  async function createFarmerMarket(payload) {
    if (!runtime || !state.user || typeof runtime.createFarmerMarket !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.createFarmerMarket({
      requestId: deps.createRequestId("farmer-market"),
      ...payload
    });
  }

  async function getFarmerMarketDirectory() {
    if (!runtime || !state.user || typeof runtime.getFarmerMarketDirectory !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return readForCurrentPlayer(() => runtime.getFarmerMarketDirectory());
  }

  async function setFarmerMarketWillAttend(payload) {
    if (!runtime || !state.user || typeof runtime.setFarmerMarketWillAttend !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.setFarmerMarketWillAttend(payload);
  }

  async function getFarmerMarketCheckInCode(payload) {
    if (!runtime || !state.user || typeof runtime.getFarmerMarketCheckInCode !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getFarmerMarketCheckInCode(payload);
  }

  async function checkInToFarmerMarket(payload) {
    if (!runtime || !state.user || typeof runtime.checkInToFarmerMarket !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.checkInToFarmerMarket(payload);
  }

  async function getFarmerMarketPewPewStatus() {
    if (!runtime || !state.user || typeof runtime.getFarmerMarketPewPewStatus !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getFarmerMarketPewPewStatus();
  }

  async function migrateLegacyAlphaAchievementRecords(payload) {
    if (!runtime || !state.user || typeof runtime.migrateLegacyAlphaAchievementRecords !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.migrateLegacyAlphaAchievementRecords(payload);
  }

  async function getFarmerMarketAchievementSnapshot() {
    if (!runtime || !state.user || typeof runtime.getFarmerMarketAchievementSnapshot !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getFarmerMarketAchievementSnapshot();
  }

  async function getSharedAvatarObjectUrl(avatarUrl) {
    if (!runtime || !state.user || typeof runtime.getSharedAvatarObjectUrl !== "function") {
      return null;
    }
    return runtime.getSharedAvatarObjectUrl(avatarUrl);
  }

  async function deployFarmerMarketAchievementPin(payload) {
    if (!runtime || !state.user || typeof runtime.deployFarmerMarketAchievementPin !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.deployFarmerMarketAchievementPin({
      requestId: deps.createRequestId("achievement-pin-deploy"),
      ...payload
    });
  }

  async function captureFarmerMarketAchievementPin(payload) {
    if (!runtime || !state.user || typeof runtime.captureFarmerMarketAchievementPin !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.captureFarmerMarketAchievementPin({
      requestId: deps.createRequestId("achievement-pin-capture"),
      ...payload
    });
  }

  async function createGrowGoParty(payload = {}) {
    if (!runtime || !state.user || typeof runtime.createGrowGoParty !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.createGrowGoParty(payload);
  }

  async function joinGrowGoParty(payload) {
    if (!runtime || !state.user || typeof runtime.joinGrowGoParty !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.joinGrowGoParty(payload);
  }

  async function cancelGrowGoParty() {
    if (!runtime || !state.user || typeof runtime.cancelGrowGoParty !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.cancelGrowGoParty();
  }

  async function leaveGrowGoParty() {
    if (!runtime || !state.user || typeof runtime.leaveGrowGoParty !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.leaveGrowGoParty();
  }

  async function reportGrowGoPartyLocation(payload) {
    if (!runtime || !state.user || typeof runtime.reportGrowGoPartyLocation !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.reportGrowGoPartyLocation(payload);
  }

  async function capturePinBatch(payload) {
    if (!runtime || state.user?.uid !== "LkR8ugTK6lXGFfUlLvKSiqMoMBh1" || typeof runtime.capturePinBatch !== "function")
      throw new Error("Batch capture pilot is unavailable.");
    return runtime.capturePinBatch(payload);
  }

  async function capturePin(capture) {
    if (!runtime || !state.user || typeof runtime.capturePin !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    try {
      const response = await runtime.capturePin({
        requestId: deps.createRequestId("capture"),
        ...capture
      });

      if (response?.player && typeof response.player === "object") {
        publish({ playerSnapshot: response.player, genericError: null });
      }

      return response;
    } catch (error) {
      publish({ genericError: deps.toClientSafeError(error) });
      throw error;
    }
  }

  async function birdQuests(payload) {
    if (!runtime || !state.user || typeof runtime.birdQuests !== "function") {
      throw new Error("The bird quest connection is not ready yet.");
    }
    // Bird failures must never enter genericError/bootstrap/sign-in state.
    const uid = state.user.uid;
    const result = await runtime.birdQuests(payload);
    if (uid !== state.user?.uid) throw new Error("The signed-in player changed. Please reopen Quests.");
    // Keep later UI refreshes from restoring the pre-reward XP snapshot. No
    // auth/render publication is needed; the bird panel applies the response.
    if (result?.player && Date.parse(result.player.updatedAt) >= (Date.parse(state.playerSnapshot?.updatedAt) || 0)) {
      state = Object.freeze({ ...state, playerSnapshot: result.player });
    }
    return result;
  }

  async function leonardQuest(payload) {
    if (!runtime?.leonardQuest || !state.user) throw new Error('Please sign in to start Leonard’s quest.');
    const uid=state.user.uid,result=await runtime.leonardQuest(payload);
    if(uid!==state.user?.uid)throw new Error('Account changed. Reopen your quest.');
    if(result?.player && Date.parse(result.player.updatedAt)>=(Date.parse(state.playerSnapshot?.updatedAt)||0))
      state=Object.freeze({...state,playerSnapshot:result.player});
    return result;
  }

  async function playerMail(payload) {
    if (!runtime?.playerMail || !state.user) throw new Error('Please sign in to open mail.');
    const uid = state.user.uid;
    const result = await runtime.playerMail(payload);
    if (uid !== state.user?.uid) throw new Error('Account changed. Reopen mail.');
    if (result?.player && Date.parse(result.player.updatedAt) >= (Date.parse(state.playerSnapshot?.updatedAt) || 0)) state = Object.freeze({ ...state, playerSnapshot: result.player });
    return result;
  }

  async function captureDailyPoi(capture) {
    if (!runtime || !state.user || typeof runtime.captureDailyPoi !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    try {
      const response = await runtime.captureDailyPoi(capture);
      if (response?.player && typeof response.player === "object") {
        publish({ playerSnapshot: response.player, genericError: null });
      }
      return response;
    } catch (error) {
      publish({ genericError: deps.toClientSafeError(error) });
      throw error;
    }
  }

  async function armHarvestRecapture(payload) {
    if (!runtime || !state.user || typeof runtime.armHarvestRecapture !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    try {
      return await runtime.armHarvestRecapture(payload);
    } catch (error) {
      publish({ genericError: deps.toClientSafeError(error) });
      throw error;
    }
  }

  async function getNearbyBasePins(location) {
    if (!runtime || !state.user || typeof runtime.getNearbyBasePins !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return readForCurrentPlayer(() => runtime.getNearbyBasePins(location));
  }

  async function mutateWorldBasePin(payload) {
    if (!runtime || !state.user || typeof runtime.mutateWorldBasePin !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    try {
      const response = await runtime.mutateWorldBasePin(payload);
      if (response?.player && typeof response.player === "object") {
        publish({ playerSnapshot: response.player, genericError: null });
      }
      return response;
    } catch (error) {
      publish({ genericError: deps.toClientSafeError(error) });
      throw error;
    }
  }

  async function recoverLegacyBasePinOwnership(payload) {
    if (!runtime || !state.user || typeof runtime.recoverLegacyBasePinOwnership !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    try {
      return await runtime.recoverLegacyBasePinOwnership(payload);
    } catch (error) {
      publish({ genericError: deps.toClientSafeError(error) });
      throw error;
    }
  }

  async function searchNearbyPois(location) {
    if (!runtime || !state.user || typeof runtime.searchNearbyPois !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.searchNearbyPois(location);
  }

  async function getLeaderboard(query) {
    if (!runtime || !state.user || typeof runtime.getLeaderboard !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return readForCurrentPlayer(() => runtime.getLeaderboard(query));
  }

  async function initializeMarketInventory(payload) {
    if (!runtime || !state.user || typeof runtime.initializeMarketInventory !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.initializeMarketInventory(payload);
  }

  async function getMarketplaceSnapshot() {
    if (!runtime || !state.user || typeof runtime.getMarketplaceSnapshot !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getMarketplaceSnapshot();
  }

  async function createMarketplaceListing(payload) {
    if (!runtime || !state.user || typeof runtime.createMarketplaceListing !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.createMarketplaceListing(payload);
  }

  async function cancelMarketplaceListing(payload) {
    if (!runtime || !state.user || typeof runtime.cancelMarketplaceListing !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.cancelMarketplaceListing(payload);
  }

  async function purchaseMarketplaceListing(payload) {
    if (!runtime || !state.user || typeof runtime.purchaseMarketplaceListing !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    const response = await runtime.purchaseMarketplaceListing(payload);
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function craftEnergyBar(payload) {
    if (!runtime || !state.user || typeof runtime.craftEnergyBar !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.craftEnergyBar(payload);
  }

  async function craftRecipe(payload) {
    if (!runtime || !state.user || typeof runtime.craftRecipe !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    const response = await runtime.craftRecipe(payload);
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function useEnergyBar(payload) {
    if (!runtime || !state.user || typeof runtime.useEnergyBar !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    const response = await runtime.useEnergyBar(payload);
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function useFood(payload) {
    if (!runtime || !state.user || typeof runtime.useFood !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    const response = await runtime.useFood(payload);
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function startStarterQuest() {
    if (!runtime || !state.user || typeof runtime.startStarterQuest !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.startStarterQuest();
  }

  async function completeInterfaceTutorial() {
    if (!runtime || !state.user || typeof runtime.completeInterfaceTutorial !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    const response = await runtime.completeInterfaceTutorial();
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function claimAlphaSeedBundle() {
    if (!runtime || !state.user || typeof runtime.claimAlphaSeedBundle !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaSeedBundle();
  }

  async function claimAlphaWheatBundle() {
    if (!runtime || !state.user || typeof runtime.claimAlphaWheatBundle !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaWheatBundle();
  }

  async function claimAlphaMiracleGrowBundle() {
    if (!runtime || !state.user || typeof runtime.claimAlphaMiracleGrowBundle !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaMiracleGrowBundle();
  }

  async function claimAlphaBatteredFishBundle() {
    if (!runtime || !state.user || typeof runtime.claimAlphaBatteredFishBundle !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaBatteredFishBundle();
  }

  async function claimAlphaBinglesScarecrowTestKit() {
    if (!runtime || !state.user || typeof runtime.claimAlphaBinglesScarecrowTestKit !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaBinglesScarecrowTestKit();
  }

  async function deployAlphaBinglesScarecrow(payload) {
    if (!runtime || !state.user || typeof runtime.deployAlphaBinglesScarecrow !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.deployAlphaBinglesScarecrow(payload);
  }

  async function getActiveBinglesScarecrows(payload = {}) {
    if (!runtime || !state.user || typeof runtime.getActiveBinglesScarecrows !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return readForCurrentPlayer(() => runtime.getActiveBinglesScarecrows(payload));
  }

  async function updateAlphaBinglesScarecrowSettings(payload) {
    if (!runtime || !state.user || typeof runtime.updateAlphaBinglesScarecrowSettings !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.updateAlphaBinglesScarecrowSettings(payload);
  }

  async function claimAlphaTestCoinGrant() {
    if (!runtime || !state.user || typeof runtime.claimAlphaTestCoinGrant !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    const response = await runtime.claimAlphaTestCoinGrant();
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function claimAlphaPewPewTestKit() {
    if (!runtime || !state.user || typeof runtime.claimAlphaPewPewTestKit !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaPewPewTestKit();
  }

  async function consumeAlphaPewPewTestCharge() {
    if (!runtime || !state.user || typeof runtime.consumeAlphaPewPewTestCharge !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.consumeAlphaPewPewTestCharge();
  }

  async function claimAlphaPewPewExtraCharges() {
    if (!runtime || !state.user || typeof runtime.claimAlphaPewPewExtraCharges !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimAlphaPewPewExtraCharges();
  }

  async function fireAlphaPewPewBeam(payload) {
    if (!runtime || !state.user || typeof runtime.fireAlphaPewPewBeam !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    const response = await runtime.fireAlphaPewPewBeam(payload);
    if (response?.player && typeof response.player === "object") {
      publish({ playerSnapshot: response.player, genericError: null });
    }
    return response;
  }

  async function claimGrowBigHarvestCompletion() {
    if (!runtime || !state.user || typeof runtime.claimGrowBigHarvestCompletion !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }

    return runtime.claimGrowBigHarvestCompletion();
  }

  async function bootstrapAdminOwner() {
    if (!runtime || !state.user || typeof runtime.bootstrapAdminOwner !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.bootstrapAdminOwner();
  }

  async function getAdminControlCenterSnapshot() {
    if (!runtime || !state.user || typeof runtime.getAdminControlCenterSnapshot !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getAdminControlCenterSnapshot();
  }

  async function listAdminAccounts() {
    if (!runtime || !state.user || typeof runtime.listAdminAccounts !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.listAdminAccounts();
  }

  async function assignAdminAccountRole(payload) {
    if (!runtime || !state.user || typeof runtime.assignAdminAccountRole !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.assignAdminAccountRole(payload);
  }

  async function updateOfficialEvent(payload) {
    if (!runtime || !state.user || typeof runtime.updateOfficialEvent !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.updateOfficialEvent(payload);
  }

  async function searchAdminPlayer(payload) {
    if (!runtime || !state.user || typeof runtime.searchAdminPlayer !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.searchAdminPlayer(payload);
  }

  async function toggleTestCaptureRange(payload) {
    if (!runtime || !state.user || typeof runtime.toggleTestCaptureRange !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    const result = await runtime.toggleTestCaptureRange(payload);
    if (state.playerSnapshot) {
      publish({
        playerSnapshot: {
          ...state.playerSnapshot,
          testUnlimitedCaptureRangeExpiresAt: result?.expiresAt ?? null
        }
      });
    }
    return result;
  }

  async function adjustAdminPlayerInventory(payload) {
    if (!runtime || !state.user || typeof runtime.adjustAdminPlayerInventory !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.adjustAdminPlayerInventory(payload);
  }

  async function moderateAdminPlayer(payload) {
    if (!runtime || !state.user || typeof runtime.moderateAdminPlayer !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.moderateAdminPlayer(payload);
  }

  async function resetAdminMainQuest(payload) {
    if (!runtime || !state.user || typeof runtime.resetAdminMainQuest !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.resetAdminMainQuest(payload);
  }

  async function submitSupportReport(payload) {
    if (!runtime || !state.user || typeof runtime.submitSupportReport !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.submitSupportReport(payload);
  }

  async function listAdminSupportCases() {
    if (!runtime || !state.user || typeof runtime.listAdminSupportCases !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.listAdminSupportCases();
  }

  async function getAdminSupportCase(payload) {
    if (!runtime || !state.user || typeof runtime.getAdminSupportCase !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.getAdminSupportCase(payload);
  }

  async function takeAdminSupportCase(payload) {
    if (!runtime || !state.user || typeof runtime.takeAdminSupportCase !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.takeAdminSupportCase(payload);
  }

  async function addAdminSupportCaseNote(payload) {
    if (!runtime || !state.user || typeof runtime.addAdminSupportCaseNote !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.addAdminSupportCaseNote(payload);
  }

  async function editAdminSupportCaseNote(payload) {
    if (!runtime || !state.user || typeof runtime.editAdminSupportCaseNote !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.editAdminSupportCaseNote(payload);
  }

  async function updateAdminSupportCaseStatus(payload) {
    if (!runtime || !state.user || typeof runtime.updateAdminSupportCaseStatus !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.updateAdminSupportCaseStatus(payload);
  }

  async function flagSupportReportSubmissionAbuse(payload) {
    if (!runtime || !state.user || typeof runtime.flagSupportReportSubmissionAbuse !== "function") {
      throw new Error("The secure GrowGo connection is not ready yet.");
    }
    return runtime.flagSupportReportSubmissionAbuse(payload);
  }

  async function transferActiveDevice() {
    if (!runtime || !state.user || typeof runtime.transferActiveDevice !== "function") {
      return state;
    }

    publish({
      deviceTransferStatus: "moving",
      genericError: null
    });

    try {
      await runtime.transferActiveDevice();
      lastBootstrapUid = state.user.uid;
      publish({ bootstrapStatus: "pending" });
      await runtime.bootstrapPlayer({
        requestId: deps.createRequestId("bootstrap")
      });
      startDeviceSessionRefresh();
      publish({
        bootstrapStatus: "complete",
        deviceTransferStatus: "complete"
      });
      await refreshSnapshot();
    } catch (error) {
      publish({
        deviceTransferStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }

    return state;
  }

  async function handleAuthStateChanged(user) {
    if (!initialAuthSettled) {
      initialAuthSettled = true;
    }

    if (!user) {
      stopMapDirectorySubscriptions();
      stopDeviceSessionRefresh();
      stopWorldFirstAnnouncementSubscription();
      lastBootstrapUid = null;
      snapshotInFlight = false;
      snapshotRequestCount = 0;
      publish({
        initializationStatus: "initialized",
        user: null,
        authStatus: "signed-out",
        invitedStatus: "unknown",
        bootstrapStatus: "idle",
        snapshotStatus: "idle",
        playerSnapshot: null,
        deviceTransferStatus: "idle"
      });
      resolveInitialAuthState();
      return;
    }

    publish({
      initializationStatus: "initialized",
      user: sanitizeUser(user),
      authStatus: "signed-in",
      invitedStatus: evaluateClientInviteMirror(user, deps.readConfig()),
      bootstrapStatus: "pending",
      snapshotStatus: "idle",
      genericError: null
    });

    if (lastBootstrapUid === user.uid) {
      return refreshSnapshot();
    }

    try {
      lastBootstrapUid = user.uid;
      await runtime.bootstrapPlayer({
        requestId: deps.createRequestId("bootstrap")
      });
      startDeviceSessionRefresh();
      publish({
        bootstrapStatus: "complete"
      });
      await refreshSnapshot();
    } catch (error) {
      if (isAccountRestrictedError(error)) {
        stopDeviceSessionRefresh();
        publish({
          authStatus: "restricted",
          playerSnapshot: null,
          bootstrapStatus: "restricted",
          snapshotStatus: "idle",
          genericError: deps.toClientSafeError(error)
        });
        resolveInitialAuthState();
        return;
      }
      if (deps.isUnauthorizedError(error)) {
        publish({
          authStatus: "unauthorized",
          invitedStatus: "server-denied",
          bootstrapStatus: "denied",
          snapshotStatus: "idle",
          genericError: deps.toClientSafeError(error)
        });
        resolveInitialAuthState();
        return;
      }

      if (
        error?.code === "failed-precondition" ||
        error?.code === "functions/failed-precondition"
      ) {
        publish({
          bootstrapStatus: "device-transfer-required",
          deviceTransferStatus: "required",
          genericError: deps.toClientSafeError(error)
        });
        resolveInitialAuthState();
        return;
      }

      publish({
        bootstrapStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }

    resolveInitialAuthState();
  }

  function dispose() {
    stopMapDirectorySubscriptions();
    stopDeviceSessionRefresh();
    stopWorldFirstAnnouncementSubscription();
    if (typeof authUnsubscribe === "function") {
      authUnsubscribe();
    }
    authUnsubscribe = null;
  }

  return Object.freeze({
    subscribeMapDirectory,
    ensureInitialized,
    signIn,
    signOut,
    refreshSnapshot,
    completeProfile,
    updatePlayerAvatar,
    clearPlayerAvatar,
    subscribeWorldFirstAnnouncement,
    scanGrowGoPlayerCode,
    addGrowGoFriend,
    getGrowGoSocialSnapshot,
    getFriendProfile,
    getMetPlayerProfile,
    getOfficialEventCalendar,
    createFarmerMarket,
    getFarmerMarketDirectory,
    setFarmerMarketWillAttend,
    getFarmerMarketCheckInCode,
    checkInToFarmerMarket,
    getFarmerMarketPewPewStatus,
    migrateLegacyAlphaAchievementRecords,
    getFarmerMarketAchievementSnapshot,
    getSharedAvatarObjectUrl,
    deployFarmerMarketAchievementPin,
    captureFarmerMarketAchievementPin,
    createGrowGoParty,
    joinGrowGoParty,
    cancelGrowGoParty,
    leaveGrowGoParty,
    reportGrowGoPartyLocation,
    capturePin,
    capturePinBatch,
    birdQuests,
    leonardQuest,
    captureDailyPoi,
    armHarvestRecapture,
    getNearbyBasePins,
    mutateWorldBasePin,
    recoverLegacyBasePinOwnership,
    searchNearbyPois,
    playerMail,
    getLeaderboard,
    initializeMarketInventory,
    getMarketplaceSnapshot,
    createMarketplaceListing,
    cancelMarketplaceListing,
    purchaseMarketplaceListing,
    craftEnergyBar,
    craftRecipe,
    useEnergyBar,
    useFood,
    startStarterQuest,
    completeInterfaceTutorial,
    claimAlphaSeedBundle,
    claimAlphaWheatBundle,
    claimAlphaMiracleGrowBundle,
    claimAlphaBatteredFishBundle,
    claimAlphaBinglesScarecrowTestKit,
    deployAlphaBinglesScarecrow,
    getActiveBinglesScarecrows,
    updateAlphaBinglesScarecrowSettings,
    claimAlphaTestCoinGrant,
    claimAlphaPewPewTestKit,
    consumeAlphaPewPewTestCharge,
    claimAlphaPewPewExtraCharges,
    fireAlphaPewPewBeam,
    claimGrowBigHarvestCompletion,
    bootstrapAdminOwner,
    getAdminControlCenterSnapshot,
    listAdminAccounts,
    assignAdminAccountRole,
    updateOfficialEvent,
    searchAdminPlayer,
    toggleTestCaptureRange,
    adjustAdminPlayerInventory,
    moderateAdminPlayer,
    resetAdminMainQuest,
    submitSupportReport,
    listAdminSupportCases,
    getAdminSupportCase,
    takeAdminSupportCase,
    addAdminSupportCaseNote,
    editAdminSupportCaseNote,
    updateAdminSupportCaseStatus,
    flagSupportReportSubmissionAbuse,
    transferActiveDevice,
    getState() {
      return state;
    },
    dispose
  });

  function resolveInitialAuthState() {
    if (typeof initialAuthResolution === "function") {
      initialAuthResolution();
      initialAuthResolution = null;
    }
  }

  function startDeviceSessionRefresh() {
    stopDeviceSessionRefresh();
    if (!runtime || typeof runtime.renewActiveDeviceSession !== "function") return;

    deviceSessionRefreshTimer = globalThis.setInterval(async () => {
      if (!state.user) {
        stopDeviceSessionRefresh();
        return;
      }

      try {
        await runtime.renewActiveDeviceSession();
      } catch (error) {
        if (isAccountRestrictedError(error)) {
          publish({
            authStatus: "restricted",
            playerSnapshot: null,
            bootstrapStatus: "restricted",
            genericError: deps.toClientSafeError(error)
          });
          stopDeviceSessionRefresh();
        } else if (isDeviceTransferRequiredError(error)) {
          publish({
            bootstrapStatus: "device-transfer-required",
            deviceTransferStatus: "required",
            genericError: deps.toClientSafeError(error)
          });
          stopDeviceSessionRefresh();
        } else if (deps.isUnauthorizedError(error)) {
          publish({
            authStatus: "unauthorized",
            invitedStatus: "server-denied",
            genericError: deps.toClientSafeError(error)
          });
          stopDeviceSessionRefresh();
        }
      }
    }, 5 * 60 * 1000);
  }

  function stopWorldFirstAnnouncementSubscription() {
    if (typeof worldFirstAnnouncementUnsubscribe === "function") {
      worldFirstAnnouncementUnsubscribe();
    }
    worldFirstAnnouncementUnsubscribe = null;
  }

  function stopDeviceSessionRefresh() {
    if (deviceSessionRefreshTimer !== null) {
      globalThis.clearInterval(deviceSessionRefreshTimer);
      deviceSessionRefreshTimer = null;
    }
  }
}

function isDeviceTransferRequiredError(error) {
  return (
    error?.code === "failed-precondition" ||
    error?.code === "functions/failed-precondition"
  );
}

function isAccountRestrictedError(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    (error?.code === "permission-denied" || error?.code === "functions/permission-denied") &&
    message.startsWith("This GrowGo account")
  );
}

function buildInitialState() {
  return Object.freeze({
    environment: "unknown",
    connectionMode: null,
    initializationAllowed: false,
    initializationStatus: "idle",
    authStatus: "signed-out",
    invitedStatus: "unknown",
    bootstrapStatus: "idle",
    snapshotStatus: "idle",
    blockedReasons: Object.freeze([]),
    missingFirebaseFields: Object.freeze([]),
    genericError: null,
    user: null,
    playerSnapshot: null,
    profileStatus: "idle",
    deviceTransferStatus: "idle"
  });
}

function validateDependencies(dependencies) {
  const requiredFunctions = [
    "readConfig",
    "createRuntime",
    "render",
    "toClientSafeError",
    "isUnauthorizedError",
    "createRequestId"
  ];

  for (const key of requiredFunctions) {
    if (typeof dependencies?.[key] !== "function") {
      throw new Error(`Missing controller dependency: ${key}`);
    }
  }

  return dependencies;
}

function sanitizeUser(user) {
  return Object.freeze({
    uid: user.uid,
    email: typeof user.email === "string" ? user.email : null,
    emailVerified: user.emailVerified === true,
    providerId: Array.isArray(user.providerData)
      ? user.providerData.find((entry) => typeof entry?.providerId === "string")
          ?.providerId ?? null
      : null
  });
}

function evaluateClientInviteMirror(user, rawConfig) {
  const inviteMirror = rawConfig?.inviteMirror;
  if (!inviteMirror || typeof inviteMirror !== "object") {
    return "unknown";
  }

  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) {
    return "client-denied";
  }

  const allowedEmails = Array.isArray(inviteMirror.allowedEmails)
    ? inviteMirror.allowedEmails
        .filter((value) => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
    : [];
  const requiredProvider =
    typeof inviteMirror.requiredProvider === "string"
      ? inviteMirror.requiredProvider
      : null;

  if (requiredProvider && !user.providerData?.some((entry) => entry?.providerId === requiredProvider)) {
    return "client-denied";
  }

  if (allowedEmails.length === 0) {
    return "unknown";
  }

  return allowedEmails.includes(email) ? "client-allowed" : "client-denied";
}
