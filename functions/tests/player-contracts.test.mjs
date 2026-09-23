import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("bootstrapPlayer accepts only its request id plus an opaque device-session id", () => {
  const source = read("functions/src/api/bootstrapPlayer.ts");
  assert.match(source, /assertAllowedKeys\(payload, \["requestId", "deviceId"\], "bootstrapPlayer payload"\)/);
  assert.doesNotMatch(source, /displayName/);
  assert.doesNotMatch(source, /avatarSeed/);
  assert.doesNotMatch(source, /clientBootstrappedAt/);
});

test("getPlayerSnapshot accepts only the opaque device-session id", () => {
  const source = read("functions/src/api/getPlayerSnapshot.ts");
  assert.match(source, /assertAllowedKeys\(payload, \["deviceId"\], "getPlayerSnapshot payload"\)/);
  assert.doesNotMatch(source, /requireRequestId/);
});

test("player defaults and safe snapshot fields stay pinned to the phase contract", async () => {
  const playerStore = await import(path.join(repoRoot, "functions/lib/domain/players/playerStore.js"));
  const { Timestamp } = await import(path.join(repoRoot, "functions/node_modules/firebase-admin/lib/firestore/index.js"));

  const now = Timestamp.fromDate(new Date("2026-07-21T00:00:00.000Z"));
  const player = playerStore.buildDefaultPlayerDocument(now);
  const snapshot = playerStore.serializePlayerSnapshot(player);

  assert.deepEqual(player, {
    schemaVersion: 1,
    publicCode: null,
    displayName: null,
    avatarUrl: null,
    region: null,
    country: null,
    state: null,
    gender: null,
    profileComplete: false,
    level: 1,
    xp: 0,
    craftingLevel: 1,
    craftingXp: 0,
    coins: 0,
    createdAt: new Date("2026-07-21T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    lastLoginAt: new Date("2026-07-21T00:00:00.000Z")
  });

  assert.deepEqual(snapshot, {
    schemaVersion: 1,
    publicCode: null,
    displayName: null,
    avatarUrl: null,
    region: null,
    country: null,
    state: null,
    gender: null,
    profileComplete: false,
    level: 1,
    xp: 0,
    craftingLevel: 1,
    craftingXp: 0,
    coins: 0,
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
    lastLoginAt: "2026-07-21T00:00:00.000Z"
  });

  assert.equal("playerId" in snapshot, false);
  assert.equal("profileStatus" in snapshot, false);
  assert.equal("progressionVisibility" in snapshot, false);
});

test("an unrecognised legacy active buff is safely discarded while the player profile loads", async () => {
  const playerStore = await import(path.join(repoRoot, "functions/lib/domain/players/playerStore.js"));
  const { Timestamp } = await import(path.join(repoRoot, "functions/node_modules/firebase-admin/lib/firestore/index.js"));

  const now = Timestamp.fromDate(new Date("2026-08-30T00:00:00.000Z"));
  const storedPlayer = {
    ...playerStore.buildDefaultPlayerDocument(now),
    activeBuff: {
      type: "food",
      sourceItemId: "battered_fish",
      // Earlier alpha builds wrote a different shape for this buff.
      activatedAt: now,
      expiresAt: now
    }
  };

  const player = playerStore.readStoredPlayerDocument(storedPlayer);

  assert.equal(player.activeBuff, null);
  assert.equal(player.level, 1);
  assert.equal(player.coins, 0);
});

test("a legacy alpha player keeps their earned level and can earn visible XP on the current curve", async () => {
  const playerStore = await import(path.join(repoRoot, "functions/lib/domain/players/playerStore.js"));
  const { Timestamp } = await import(path.join(repoRoot, "functions/node_modules/firebase-admin/lib/firestore/index.js"));

  const now = Timestamp.fromDate(new Date("2026-09-01T00:00:00.000Z"));
  const storedPlayer = {
    ...playerStore.buildDefaultPlayerDocument(now),
    level: 21,
    xp: 0
  };

  const player = playerStore.readStoredPlayerDocument(storedPlayer);

  assert.equal(player.level, 21);
  assert.equal(player.xp, 28_002);
  assert.equal(player.xp + 5 - 28_002, 5);
});

test("new-player onboarding is safely exposed while legacy profiles remain untouched", async () => {
  const playerStore = await import(path.join(repoRoot, "functions/lib/domain/players/playerStore.js"));
  const { Timestamp } = await import(path.join(repoRoot, "functions/node_modules/firebase-admin/lib/firestore/index.js"));

  const now = Timestamp.fromDate(new Date("2026-09-04T00:00:00.000Z"));
  const storedPlayer = {
    ...playerStore.buildDefaultPlayerDocument(now),
    displayName: "New Player",
    region: "oceania",
    country: "Australia",
    state: "Victoria",
    gender: "female",
    profileComplete: true,
    onboarding: {
      interfaceTutorial: "pending"
    }
  };

  const player = playerStore.readStoredPlayerDocument(storedPlayer);
  const snapshot = playerStore.serializePlayerSnapshot(player);

  assert.deepEqual(snapshot.onboarding, { interfaceTutorial: "pending" });
  assert.equal("interfaceTutorialCompletedAt" in snapshot.onboarding, false);
});

test("profile completion is authenticated, allowlisted, validated, and reserves names transactionally", () => {
  const source = read("functions/src/api/completePlayerProfile.ts");
  assert.match(source, /requireAuthenticated\(request\)/);
  assert.match(source, /requireInvitedUserAccess\(request\)/);
  assert.match(source, /collection\("playerNames"\)/);
  assert.match(source, /runTransaction/);
  assert.match(source, /profileComplete: true/);
  assert.match(source, /interfaceTutorial: "pending"/);
  assert.match(source, /already-exists/);
  assert.match(source, /assertPlayerNameIsSafe/);
});

test("profile avatars always use the configured storage bucket in live Functions", () => {
  const adminSource = read("functions/src/firebaseAdmin.ts");
  const avatarSource = read("functions/src/api/updatePlayerAvatar.ts");

  assert.match(adminSource, /getAdminStorage\(\)\.bucket\(runtimeConfig\.storageBucket\)/);
  assert.match(avatarSource, /getAdminStorageBucket\(\)/);
  assert.doesNotMatch(avatarSource, /getAdminStorage\(\)\.bucket\(\)/);
});

test("an avatar update immediately refreshes the deployer's achievement pins", () => {
  const clientSource = read("script.js");

  assert.match(clientSource, /await syncFarmerMarketAchievementPins\(true\);/);
  assert.match(clientSource, /void syncFarmerMarketAchievementPins\(true\);/);
});

test("achievement-pin portraits use a freshly versioned Firebase runtime and stay map-anchored", () => {
  const pageSource = read("index.html");
  const appSource = read("client/development-alpha-app.mjs");
  const clientSource = read("script.js");

  assert.match(pageSource, /development-alpha-app\.mjs\?v=achievement-pins-3/);
  assert.match(appSource, /development-alpha-runtime\.mjs\?v=achievement-pins-3/);
  assert.match(clientSource, /function getAchievementPinMapLocation\(/);
  assert.match(clientSource, /iconAnchor: \[size \/ 2, size \/ 2\]/);
});

test("deploying an achievement pin returns to the current Achievements screen", () => {
  const clientSource = read("script.js");

  assert.match(clientSource, /function returnToAchievements\(\)/);
  assert.match(clientSource, /returnToAchievements\(\);\s*showToast\("Achievement Pin deployed"/);
});

test("the alpha market receives the approved one-time wheat restock", () => {
  const marketSource = read("functions/src/api/marketplace.ts");
  const catalogSource = read("functions/src/domain/market/marketCatalog.ts");

  assert.match(catalogSource, /\{ id: "wheat", referencePrice: 20, npcQuantity: 150 \}/);
  assert.match(marketSource, /MARKET_WHEAT_RESTOCK_QUANTITY = 100/);
  assert.match(marketSource, /quantityAdded: MARKET_WHEAT_RESTOCK_QUANTITY/);
});

test("new accounts atomically hand off from controls to Bingles' first quest", () => {
  const completeInterfaceTutorial = read("functions/src/api/completeInterfaceTutorial.ts");
  const starterQuest = read("functions/src/api/startStarterQuest.ts");

  assert.match(completeInterfaceTutorial, /requireAuthenticated\(request\)/);
  assert.match(completeInterfaceTutorial, /requireInvitedUserAccess\(request\)/);
  assert.match(completeInterfaceTutorial, /interfaceTutorial: "completed"/);
  assert.match(completeInterfaceTutorial, /transaction\.create\(questStateRef, starterQuestState\)/);
  assert.match(completeInterfaceTutorial, /createStarterQuestState\(completedAt\)/);
  assert.match(starterQuest, /player\.onboarding\?\.interfaceTutorial === "pending"/);
});

test("party setup stores a compact invite and fresh presence for server-side XP checks", () => {
  const partySource = read("functions/src/api/growGoParties.ts");
  const partyBonusSource = read("functions/src/domain/parties/partyBonus.ts");

  assert.match(partySource, /randomBytes\(6\)/);
  assert.match(partySource, /reportGrowGoPartyLocation/);
  assert.match(partyBonusSource, /PARTY_PROXIMITY_METRES = 100/);
  assert.match(partyBonusSource, /PARTY_PRESENCE_MAX_AGE_MILLISECONDS/);
});

test("an active party member can leave without cancelling the remaining party", () => {
  const partySource = read("functions/src/api/growGoParties.ts");
  const runtimeSource = read("client/development-alpha-runtime.mjs");
  const clientSource = read("script.js");

  assert.match(partySource, /async function leavePartyForPlayer/);
  assert.match(partySource, /leadership passes to the earliest remaining member/);
  assert.match(partySource, /export const leaveGrowGoParty/);
  assert.match(runtimeSource, /httpsCallable\(functions, "leaveGrowGoParty"\)/);
  assert.match(clientSource, /activeParty \? "Leave Party" : "Party Up"/);
});

test("player QR codes carry only the compact public-code suffix while legacy full codes still scan", () => {
  const clientSource = read("script.js");

  assert.match(clientSource, /text: playerId\.slice\(2\)/);
  assert.match(clientSource, /normalizedQrPayload\)\s*\?\s*`GG\$\{normalizedQrPayload\}`/);
  assert.match(clientSource, /`GG\$\{normalizedQrPayload\}`/);
});

test("auto capture stays quiet for already-captured pins and advances past a transient pin failure", () => {
  const clientSource = read("script.js");

  assert.match(clientSource, /captureBasePinThroughServer\(target, serverGameplay, \{ auto: true \}\)/);
  assert.match(clientSource, /if \(!auto\) \{\s*showToast\("Already captured"/);
  assert.match(clientSource, /isAlreadyCapturedError\(error\)/);
  assert.match(clientSource, /deferAutoCapturePin\(pin\)/);
  assert.match(clientSource, /window\.setTimeout\(scheduleAutoCaptureNearbyPin, AUTO_CAPTURE_ATTEMPT_INTERVAL_MS\)/);
  assert.match(clientSource, /serverReportsCaptureToday \|\| !hasCurrentLocalCapture/);
});
