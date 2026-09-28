import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("Friends and Players Met use current public portraits, not photos frozen at scan time", async t => {
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
  const app = initializeApp({ projectId: "demo-growgo-friends" }, `portraits-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { getGrowGoSocialSnapshotHandler: snapshot } = require("../lib/api/playerSocial.js");
  const uid = `portrait-viewer-${process.pid}`, stamp = Timestamp.now();
  const base = { ...buildDefaultPlayerDocument(stamp), profileComplete: true, displayName: "Viewer",
    publicCode: "GGOWN234", region: "oceania", country: "Australia", state: "Victoria", gender: "male" };
  await db.collection("players").doc(uid).set(base);
  const peers = [
    { suffix: "NEW", name: "Latest Name", avatarUrl: "https://example.test/latest.jpg", old: null },
    { suffix: "REP", name: "New Photo", avatarUrl: "https://example.test/replacement.jpg", old: "https://example.test/old.jpg" },
    { suffix: "DEL", name: "Removed Photo", avatarUrl: null, old: "https://example.test/removed.jpg" },
    { suffix: "NON", name: "No Photo", avatarUrl: null, old: null },
    { suffix: "BAD", name: "Reassigned", avatarUrl: "https://example.test/wrong.jpg", old: "https://example.test/old.jpg" }
  ];
  const refs = [];
  for (const peer of peers) {
    const peerUid = `portrait-${peer.suffix}-${process.pid}`, code = `GG${peer.suffix}234`;
    const playerRef = db.collection("players").doc(peerUid);
    await playerRef.set({ ...base, publicCode: peer.suffix === "BAD" ? "GGOTH234" : code,
      displayName: peer.name, avatarUrl: peer.avatarUrl, coins: 789, email: "private@example.test", inventory: { wheat: 90 } });
    refs.push(playerRef);
    for (const kind of ["friends", "met"]) {
      const ref = db.collection("playerSocial").doc(uid).collection(kind).doc(peerUid);
      await ref.set({ schemaVersion: 1, peerUid, publicCode: code, displayName: "Old Name", avatarUrl: peer.old, firstMetAt: stamp });
      refs.push(ref);
    }
  }
  const before = await Promise.all(refs.map(async ref => (await ref.get()).updateTime.toMillis()));
  const request = { auth: { uid, token: {} }, data: {} };
  const { social } = await snapshot(request);
  for (const list of [social.met, social.friends]) {
    assert.equal(list.length, 5);
    for (const peer of peers) {
      const entry = list.find(player => player.id === `GG${peer.suffix}234`);
      assert.equal(entry.avatarUrl, peer.suffix === "BAD" ? null : peer.avatarUrl);
      if (peer.suffix !== "BAD") assert.equal(entry.name, peer.name);
      assert.deepEqual(Object.keys(entry).sort(), ["id", "name", "avatarUrl", "metAt"].sort());
    }
  }
  assert.doesNotMatch(JSON.stringify(social), /private@|789|wheat|portrait-|Victoria/);
  assert.deepEqual(await Promise.all(refs.map(async ref => (await ref.get()).updateTime.toMillis())), before, "list reads never write to profiles or social entries");
  // Even a warm identity cache cannot supply a relationship from another viewer.
  const stranger = `portrait-stranger-${process.pid}`;
  await db.collection("players").doc(stranger).set({ ...base, publicCode: "GGSTR234" });
  assert.deepEqual((await snapshot({ auth: { uid: stranger, token: {} }, data: {} })).social, { met: [], friends: [] });
  const metRef = db.collection("playerSocial").doc(uid).collection("met").doc(`portrait-NEW-${process.pid}`);
  await metRef.delete();
  assert.equal((await snapshot(request)).social.met.some(peer => peer.id === "GGNEW234"), false);
  await assert.rejects(snapshot({ data: {} }), { code: "unauthenticated" });
});
