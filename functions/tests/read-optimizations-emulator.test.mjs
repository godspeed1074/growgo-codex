import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { gunzipSync } from "node:zlib";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: shared reads preserve rankings, avatars, directory privacy and map scope", async (t) => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Requires localhost emulator; never accesses a live project"); return; }
  // Reset only this synthetic emulator database, never a Firebase cloud project.
  const cleared = await fetch(`http://${host.normalizedHostPort}/emulator/v1/projects/demo-growgo-read-optimization/databases/(default)/documents`, { method: "DELETE" });
  assert.equal(cleared.ok, true);
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort,
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true", GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true",
    GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false", GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
    GCLOUD_PROJECT: "demo-growgo-read-optimization"
  });
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-read-optimization" }, `read-optimization-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { getLeaderboardHandler, readScopedLeaderboardCandidates } = require("../lib/api/getLeaderboard.js");
  const { getActiveBinglesScarecrowsHandler, deployAlphaBinglesScarecrowHandler, updateAlphaBinglesScarecrowSettingsHandler } = require("../lib/api/alphaBinglesScarecrowDeployment.js");
  const { getFarmerMarketDirectoryHandler } = require("../lib/api/farmerMarkets.js");
  const { markMapDirectoryChanged } = require("../lib/domain/world/mapDirectoryReads.js");
  const { getGrowGoSeasonAt } = require("../lib/domain/leaderboards/leaderboardPeriods.js");
  const { SHARED_READ_CACHE_COLLECTION } = require("../lib/infrastructure/sharedReadCache.js");
  const a = `read-a-${process.pid}`, b = `read-b-${process.pid}`;
  const country = `Test country ${process.pid}`;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const season = getGrowGoSeasonAt(now);
  const stamp = Timestamp.fromDate(now);
  const profile = (name, xp) => ({ ...buildDefaultPlayerDocument(stamp),
    displayName: name, profileComplete: true, country, region: "oceania", state: "Victoria", gender: "male",
    avatarUrl: `https://example.test/${name}.png`, xp, coins: 8123, level: 15 });
  // Use level 1 for score tests so legacy level-floor adjustment is not invoked.
  const pa = { ...profile("Test A", 50), level: 1 };
  const pb = { ...profile("Test B", 100), level: 1 };
  await Promise.all([db.collection("players").doc(a).set(pa), db.collection("players").doc(b).set(pb),
    ...[[a, 5], [b, 10]].map(([uid, points]) => db.collection("playerLeaderboardScores").doc(uid).set({
      daily: { key: day, points }, seasonal: { key: season.key, points: points * 2 }, achievementPoints: points * 3, updatedAt: stamp }))]);
  const request = (uid, data = {}) => ({ auth: { uid, token: {} }, data });
  const boardQuery = { metric: "points", scope: "local", period: "all-time" };

  await t.test("all-time skips score joins and shared standings retain per-caller rank/photo", async () => {
    const candidates = await readScopedLeaderboardCandidates(db, pa, "local", false);
    assert.equal(candidates.length, 2);
    assert.ok(candidates.every((row) => row.scores.daily.points === 0));
    const first = await getLeaderboardHandler(request(a, boardQuery));
    assert.equal(first.currentPlayer.rank, 2);
    assert.equal(first.entries[0].avatarUrl, pb.avatarUrl);
    const cached = (await db.collection(SHARED_READ_CACHE_COLLECTION).get()).docs;
    const snapshot = cached.find((doc) => String(doc.data().key).includes(country));
    assert.ok(snapshot);
    const text = gunzipSync(snapshot.data().data).toString();
    assert.doesNotMatch(text, /"coins"|8123|"activeBuff"|"inventory"|"gender"|"createdAt"/);
    const second = await getLeaderboardHandler(request(b, boardQuery));
    assert.equal(second.currentPlayer.name, "Test B");
    assert.equal(second.currentPlayer.rank, 1);
    assert.equal(second.entries.find((row) => row.name === "Test A").me, false);
    assert.equal((await snapshot.ref.get()).updateTime.toMillis(), snapshot.updateTime.toMillis());
    await db.collection("players").doc(a).update({ xp: 200, updatedAt: Timestamp.now() });
    const freshCaller = await getLeaderboardHandler(request(a, boardQuery));
    assert.equal(freshCaller.currentPlayer.score, 200);
    assert.equal(freshCaller.currentPlayer.rank, 1);
    assert.equal((await db.collection("players").doc(a).get()).data().coins, 8123);
  });

  await t.test("daily/seasonal/achievements share raw rows, not the wrong metric or viewer", async () => {
    for (const [metric, period, expected] of [["points", "daily", 5], ["points", "seasonal", 10], ["achievements", "all-time", 15]]) {
      const result = await getLeaderboardHandler(request(a, { ...boardQuery, metric, period }));
      assert.equal(result.currentPlayer.score, expected);
      assert.equal(result.currentPlayer.rank, 2);
    }
  });

  await t.test("record caches preserve archived dates and scope, with live fallback only before archives exist", async () => {
    const live = await getLeaderboardHandler(request(a, { ...boardQuery, metric: "records", period: "daily" }));
    assert.equal(live.entries[0].name, "Test B");
    const record = { schemaVersion: 1, kind: "seasonal", periodKey: "fixture-season", periodLabel: "Test season",
      playerUid: a, name: "Test A", avatarUrl: pa.avatarUrl, country, region: "oceania", score: 40, achievedAt: stamp };
    await db.collection("leaderboardRecordPerformances").doc("test-season").set(record);
    const query = { ...boardQuery, metric: "records", period: "seasonal" };
    const first = await getLeaderboardHandler(request(a, query));
    const second = await getLeaderboardHandler(request(b, query));
    assert.equal(first.entries[0].score, 40);
    assert.equal(first.entries[0].me, true);
    assert.equal(second.entries[0].me, false);
    assert.equal(first.refreshedAt, second.refreshedAt);
    assert.equal(first.entries[0].achievedAt, stamp.toDate().toISOString());
    assert.equal(first.entries[0].achievedAt, second.entries[0].achievedAt);
    await db.collection("leaderboardRecordPerformances").doc("other-country-all-time").set({
      ...record, kind: "all-time", country: "Elsewhere", score: 1000
    });
    const empty = await getLeaderboardHandler(request(a, { ...boardQuery, metric: "records" }));
    assert.equal(empty.entries.length, 0);
  });

  await t.test("scoped leaderboard pagination includes players after the old 1,000-player cutoff", async () => {
    const targetCountry = `Pagination ${process.pid}`;
    for (let start = 0; start < 1001; start += 400) {
      const batch = db.batch();
      for (let i = start; i < Math.min(start + 400, 1001); i++) {
        batch.set(db.collection("players").doc(`pagination-${String(i).padStart(4, "0")}`),
          { ...pa, country: targetCountry, xp: i });
      }
      await batch.commit();
    }
    const candidates = await readScopedLeaderboardCandidates(db, { ...pa, country: targetCountry }, "local", false);
    assert.equal(candidates.length, 1001);
    assert.ok(candidates.some((row) => row.uid === "pagination-1000" && row.player.xp === 1000));
  });

  await t.test("Bingles query includes only its map area, supports the dateline and older clients", async () => {
    const base = { schemaVersion: 1, status: "active", itemId: "bingles_scarecrow", ownerName: "Test", ownerId: a,
      latitude: -38, longitude: 145, skinId: "classic", birdLandingAlertsEnabled: true, createdAt: stamp };
    await Promise.all([
      db.collection("worldScarecrows").doc(`${a}-near`).set(base),
      db.collection("worldScarecrows").doc(`${a}-far`).set({ ...base, latitude: 10, longitude: 20 }),
      db.collection("worldScarecrows").doc(`${a}-east`).set({ ...base, latitude: 0, longitude: 179.9 }),
      db.collection("worldScarecrows").doc(`${a}-west`).set({ ...base, latitude: 0, longitude: -179.9 })
    ]);
    const nearby = await getActiveBinglesScarecrowsHandler(request(b, { viewport: { north: -37.9, south: -38.1, west: 144.9, east: 145.1 } }));
    assert.ok(nearby.scarecrows.some((row) => row.id === `${a}-near`));
    assert.ok(!nearby.scarecrows.some((row) => row.id === `${a}-far`));
    const dateline = await getActiveBinglesScarecrowsHandler(request(b, { viewport: { north: 1, south: -1, west: 179, east: -179 } }));
    assert.ok(dateline.scarecrows.some((row) => row.id === `${a}-east`));
    assert.ok(dateline.scarecrows.some((row) => row.id === `${a}-west`));
    const legacy = await getActiveBinglesScarecrowsHandler(request(b));
    assert.ok(legacy.scarecrows.some((row) => row.id === `${a}-far`));
  });

  await t.test("Bingles changes signal all viewers but ownership checks and skin controls remain enforced", async () => {
    await db.collection("playerMarketInventories").doc(a).set({ schemaVersion: 1, items: { bingles_scarecrow: 1 } });
    const deployed = await deployAlphaBinglesScarecrowHandler(request(a, { latitude: -60.123, longitude: 30.456 }));
    assert.equal(deployed.scarecrow.ownerId, a);
    const before = await db.collection("mapDirectoryVersions").doc("bingles").get();
    assert.ok(before.exists);
    const settings = { skinId: "classic", birdLandingAlertsEnabled: true, sharedAlertFriend: null };
    await updateAlphaBinglesScarecrowSettingsHandler(request(a, settings));
    const after = await before.ref.get();
    assert.ok(after.updateTime.toMillis() >= before.updateTime.toMillis());
    await assert.rejects(updateAlphaBinglesScarecrowSettingsHandler(request(b, settings)));
    assert.equal((await db.collection("worldScarecrows").doc(a).get()).data().birdLandingAlertsEnabled, true);
  });

  await t.test("market cache is shared, check-ins private, revision changes refresh public data", async () => {
    const marketId = `FM${String(process.pid).padStart(14, "0")}`;
    const startsAt = Timestamp.fromMillis(now.getTime() - 1000);
    const endsAt = Timestamp.fromMillis(now.getTime() + 3_600_000);
    const marketRef = db.collection("farmerMarkets").doc(marketId);
    await db.runTransaction(async (tx) => {
      tx.set(marketRef, { schemaVersion: 1, name: "Test Market", description: "Fixture", hostUid: a,
        hostName: "Test A", hostAvatarUrl: pa.avatarUrl, latitude: -38, longitude: 145, tier: 1,
        startsAt, endsAt, attendeeCount: 1, willAttendCount: 2, hostWillAttend: true });
      markMapDirectoryChanged(tx, db, "markets");
    });
    await db.collection("farmerMarketEventPewPewPasses").doc(b).set({ passes: { [marketId]: { marketName: "Test Market", endsAt, chargesAvailable: 5 } } });
    const hostView = await getFarmerMarketDirectoryHandler(request(a));
    const guestView = await getFarmerMarketDirectoryHandler(request(b));
    const find = (view) => view.markets.find((row) => row.id === marketId);
    assert.equal(find(hostView).isHost, true); assert.equal(find(hostView).checkedIn, false);
    assert.equal(find(guestView).isHost, false); assert.equal(find(guestView).checkedIn, true);
    assert.equal("hostUid" in find(guestView), false);
    assert.equal(hostView.generatedAt, guestView.generatedAt);
    await db.runTransaction(async (tx) => { tx.update(marketRef, { attendeeCount: 2 }); markMapDirectoryChanged(tx, db, "markets"); });
    assert.equal(find(await getFarmerMarketDirectoryHandler(request(b))).attendeeCount, 2);
    assert.equal((await db.collection("farmerMarketEventPewPewPasses").doc(b).get()).data().passes[marketId].chargesAvailable, 5);
  });

  await t.test("client rules allow only signed-in reads of the two signal documents", async () => {
    const root = `http://${host.normalizedHostPort}/v1/projects/demo-growgo-read-optimization/databases/(default)/documents`;
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const seconds = Math.floor(Date.now() / 1000);
    const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({ iss: "https://securetoken.google.com/demo-growgo-read-optimization", aud: "demo-growgo-read-optimization", sub: a, user_id: a, iat: seconds, exp: seconds + 3600, firebase: { sign_in_provider: "custom" } })}.`;
    const headers = { Authorization: `Bearer ${token}` };
    for (const directory of ["bingles", "markets"]) {
      const url = `${root}/mapDirectoryVersions/${directory}`;
      assert.equal((await fetch(url, { headers })).status, 200);
      assert.equal((await fetch(url)).status, 403);
      assert.equal((await fetch(url, { headers: { ...headers, "Content-Type": "application/json" }, method: "PATCH", body: JSON.stringify({ fields: {} }) })).status, 403);
      assert.equal((await fetch(url, { headers, method: "DELETE" })).status, 403);
    }
    assert.equal((await fetch(`${root}/mapDirectoryVersions`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/mapDirectoryVersions/unapproved-directory`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/players/${a}`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/players/${b}`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/playerPrivate/${b}`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/playerMarketInventories/${a}`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/${SHARED_READ_CACHE_COLLECTION}`, { headers })).status, 403);
    assert.equal((await fetch(`${root}/${SHARED_READ_CACHE_COLLECTION}/private-cache`, { headers })).status, 403);
  });
});
