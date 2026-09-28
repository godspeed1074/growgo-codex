import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("friend profiles are read-only and restricted to authenticated friends", async t => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Local emulator required; never reads real accounts."); return; }
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort, GCLOUD_PROJECT: "demo-growgo-friends",
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true", GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true", GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true", GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
  });
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-friends" }, `friends-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { getFriendProfileHandler: getProfile } = require("../lib/api/getFriendProfile.js");
  const { getMetPlayerProfileHandler: getMetProfile } = require("../lib/api/getMetPlayerProfile.js");
  const { addGrowGoFriendHandler: addFriend } = require("../lib/api/playerSocial.js");
  const owner = `viewer-${process.pid}`, friend = `friend-${process.pid}`, stranger = `stranger-${process.pid}`;
  const code = "GGABC234";
  const friendRef = db.collection("players").doc(friend);
  const edgeRef = db.collection("playerSocial").doc(owner).collection("friends").doc(friend);
  const scoreRef = db.collection("playerLeaderboardScores").doc(friend);
  const inventoryRef = db.collection("playerMarketInventories").doc(friend);
  const stamp = Timestamp.now();
  await friendRef.set({ ...buildDefaultPlayerDocument(stamp), publicCode: code, profileComplete: true,
    displayName: "Test Friend", avatarUrl: "https://example.test/friend.png", level: 3, xp: 4321,
    craftingLevel: 2, craftingXp: 65, coins: 789, email: "private@example.test",
    region: "oceania", country: "Australia", state: "Victoria", gender: "male", inventory: { wheat: 10 } });
  await db.collection("players").doc(owner).set({ ...buildDefaultPlayerDocument(stamp), xp: 999999,
    publicCode: "GGOWN234", displayName: "Test viewer", profileComplete: true,
    region: "oceania", country: "Australia", state: "Victoria", gender: "male" });
  await db.collection("playerPublicCodes").doc(code).set({ uid: friend });
  await edgeRef.set({ publicCode: code, peerUid: friend, displayName: "Old Friend Name" });
  await scoreRef.set({ schemaVersion: 1, daily: { key: new Date().toISOString().slice(0, 10), points: 72 }, achievementPoints: 100 });
  await inventoryRef.set({ items: { wheat: 4 } });
  const request = (uid = owner, data = {}) => ({ auth: { uid, token: {} }, data: { publicCode: code, ...data } });
  const before = await Promise.all([friendRef, scoreRef, inventoryRef, edgeRef].map(async ref => (await ref.get()).updateTime.toMillis()));
  await t.test("returns target's latest public identity and allowlisted server stats only", async () => {
    const { ok, profile } = await getProfile(request());
    assert.ok(ok);
    assert.equal(profile.name, "Test Friend");
    assert.equal(profile.stats.today.points, 72);
    assert.equal(profile.stats.lifetime.xp, 4321);
    assert.equal(profile.stats.lifetime.achievementPoints, 100);
    assert.equal(profile.stats.best, null);
    assert.deepEqual(Object.keys(profile).sort(), ["publicCode", "name", "avatarUrl", "level", "craftingLevel", "stats", "todayKey"].sort());
    assert.doesNotMatch(JSON.stringify(profile), /private@|789|wheat|999999|Victoria|lastLoginAt|uid/);
    assert.deepEqual(await Promise.all([friendRef, scoreRef, inventoryRef, edgeRef].map(async ref => (await ref.get()).updateTime.toMillis())), before);
  });
  await t.test("anonymous, non-friend and malformed/extra request fields are denied", async () => {
    await assert.rejects(getProfile({ data: { publicCode: code } }), { code: "unauthenticated" });
    await assert.rejects(getProfile(request(stranger)), { code: "permission-denied" });
    await assert.rejects(getProfile(request(owner, { publicCode: "../../players" })), { code: "invalid-argument" });
    await assert.rejects(getProfile(request(owner, { targetUid: stranger })), { code: "invalid-argument" });
  });
  await t.test("daily points reset on UTC day change; missing stats stay unavailable", async () => {
    await scoreRef.update({ "daily.key": "2000-01-01" });
    assert.equal((await getProfile(request())).profile.stats.today.points, 0);
    await scoreRef.delete();
    const profile = (await getProfile(request())).profile;
    assert.equal(profile.stats.today.points, null);
    assert.equal(profile.stats.lifetime.achievementPoints, null);
  });
  await t.test("mismatched public code and removed friendship cannot expose profiles", async () => {
    await friendRef.update({ publicCode: "GGXYZ234" });
    await assert.rejects(getProfile(request()), { code: "not-found" });
    await friendRef.update({ publicCode: code });
    await edgeRef.delete();
    await assert.rejects(getProfile(request()), { code: "permission-denied" });
  });
  await t.test("Players Met requires a confirmed Meet, not just a known code or a requested relationship", async () => {
    // Separate synthetic viewer: the real 12/minute snapshot safeguard stays
    // enabled; preceding Friends checks must not exhaust this case's budget.
    const metViewer = `met-viewer-${process.pid}`;
    await db.collection("players").doc(metViewer).set({ ...(await db.collection("players").doc(owner).get()).data(), publicCode: "GGMET234" });
    const metRequest = () => request(metViewer);
    const metFriendRef = db.collection("playerSocial").doc(metViewer).collection("friends").doc(friend);
    await assert.rejects(getMetProfile(metRequest()), { code: "permission-denied" });
    await assert.rejects(getMetProfile({ data: { publicCode: code } }), { code: "unauthenticated" });
    await assert.rejects(getMetProfile(request(metViewer, { relationship: "met" })), { code: "invalid-argument" });
    const metRef = db.collection("playerSocial").doc(metViewer).collection("met").doc(friend);
    await metRef.set({ publicCode: code, peerUid: friend, firstMetAt: stamp });
    const beforeRead = await friendRef.get();
    const metProfile = (await getMetProfile(metRequest())).profile;
    assert.equal(metProfile.name, "Test Friend");
    assert.equal(metProfile.stats.lifetime.xp, 4321);
    assert.deepEqual(Object.keys(metProfile).sort(), ["publicCode", "name", "avatarUrl", "level", "craftingLevel", "stats", "todayKey"].sort());
    assert.doesNotMatch(JSON.stringify(metProfile), /private@|789|wheat|999999|Victoria|lastLoginAt|uid/);
    assert.equal((await metFriendRef.get()).exists, false, "viewing a met player never adds a friendship");
    assert.equal((await friendRef.get()).updateTime.toMillis(), beforeRead.updateTime.toMillis());
    await assert.rejects(getProfile(metRequest()), { code: "permission-denied" }, "Friends endpoint still requires a friendship");
    await assert.rejects(getMetProfile(request(stranger)), { code: "permission-denied" });
    await metRef.update({ publicCode: "GGXXX234" });
    await assert.rejects(getMetProfile(metRequest()), { code: "permission-denied" });
    await metRef.update({ publicCode: code });
    await friendRef.update({ publicCode: "GGXYZ234" });
    await assert.rejects(getMetProfile(metRequest()), { code: "not-found" });
    await friendRef.update({ publicCode: code });
    const added = await addFriend(metRequest());
    assert.equal(added.created, true);
    assert.equal((await addFriend(metRequest())).created, false, "repeated Add Friend is idempotent");
    assert.equal((await getProfile(metRequest())).profile.name, "Test Friend");
    await metRef.delete();
    await assert.rejects(getMetProfile(metRequest()), { code: "permission-denied" });
  });
});
