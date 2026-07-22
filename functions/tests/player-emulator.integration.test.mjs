import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const projectId = "growgo-development";
const region = "australia-southeast1";
const authUrl =
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key";
const callableBase = `http://127.0.0.1:5003/${projectId}/${region}`;
const authEmulatorProbeUrl = "http://127.0.0.1:9099/";
const functionsEmulatorProbeUrl = "http://127.0.0.1:5003/";
const firestoreEmulatorProbeUrl = "http://127.0.0.1:8088/";

async function createAnonymousUser() {
  const response = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  assert.equal(response.ok, true);
  return response.json();
}

async function callFunction(name, token, data) {
  const response = await fetch(`${callableBase}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function listCollection(collectionId) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8088";
  process.env.GCLOUD_PROJECT = projectId;
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  const admin = require("../node_modules/firebase-admin/lib/index.js");
  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
  const snap = await admin.firestore().collection(collectionId).get();
  return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

async function isReachable(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(1000)
    });
    return response.status >= 100;
  } catch {
    return false;
  }
}

async function ensureLocalEmulatorsAvailable(t) {
  const [authReachable, functionsReachable, firestoreReachable] =
    await Promise.all([
      isReachable(authEmulatorProbeUrl),
      isReachable(functionsEmulatorProbeUrl),
      isReachable(firestoreEmulatorProbeUrl)
    ]);

  if (!authReachable || !functionsReachable || !firestoreReachable) {
    t.skip(
      "Local Auth, Functions, or Firestore emulator unavailable for localhost-only integration test."
    );
    return false;
  }

  return true;
}

test("player bootstrap and snapshot stay isolated per authenticated uid", async (t) => {
  if (!(await ensureLocalEmulatorsAvailable(t))) {
    return;
  }

  const playersBefore = await listCollection("players");
  const playerPrivateBefore = await listCollection("playerPrivate");
  const capturesBefore = await listCollection("captures");
  const idempotencyBefore = await listCollection("idempotency");
  const requestsBefore = await listCollection("requests");
  const firstUser = await createAnonymousUser();
  const secondUser = await createAnonymousUser();

  const beforeBootstrap = await callFunction("getPlayerSnapshot", firstUser.idToken, {});
  assert.equal(beforeBootstrap.status, 400);
  assert.equal(
    beforeBootstrap.body.error.status,
    "FAILED_PRECONDITION"
  );

  const firstBootstrap = await callFunction("bootstrapPlayer", firstUser.idToken, {
    requestId: "integration-bootstrap-001"
  });
  assert.equal(firstBootstrap.status, 200);
  assert.equal(firstBootstrap.body.result.ok, true);
  assert.equal(firstBootstrap.body.result.created, true);

  const playersAfterFirstBootstrap = await listCollection("players");
  const firstPlayerRecord = playersAfterFirstBootstrap.find(
    (entry) => entry.id === firstUser.localId
  );
  assert.ok(firstPlayerRecord);
  assert.equal(firstPlayerRecord.data.schemaVersion, 1);
  assert.equal(firstPlayerRecord.data.level, 1);
  assert.equal(firstPlayerRecord.data.xp, 0);
  assert.equal(firstPlayerRecord.data.coins, 0);

  const secondBootstrapSameUser = await callFunction(
    "bootstrapPlayer",
    firstUser.idToken,
    { requestId: "integration-bootstrap-002" }
  );
  assert.equal(secondBootstrapSameUser.status, 200);
  assert.equal(secondBootstrapSameUser.body.result.created, false);
  assert.equal(
    secondBootstrapSameUser.body.result.player.createdAt,
    firstBootstrap.body.result.player.createdAt
  );
  assert.equal(secondBootstrapSameUser.body.result.player.level, 1);
  assert.equal(secondBootstrapSameUser.body.result.player.xp, 0);
  assert.equal(secondBootstrapSameUser.body.result.player.coins, 0);
  assert.notEqual(
    secondBootstrapSameUser.body.result.player.lastLoginAt,
    firstBootstrap.body.result.player.lastLoginAt
  );

  const snapshotAfterBootstrap = await callFunction(
    "getPlayerSnapshot",
    firstUser.idToken,
    {}
  );
  assert.equal(snapshotAfterBootstrap.status, 200);
  assert.deepEqual(
    snapshotAfterBootstrap.body.result.player,
    secondBootstrapSameUser.body.result.player
  );

  const uidInjectionSnapshot = await callFunction(
    "getPlayerSnapshot",
    firstUser.idToken,
    { uid: secondUser.localId }
  );
  assert.equal(uidInjectionSnapshot.status, 400);
  assert.equal(uidInjectionSnapshot.body.error.status, "INVALID_ARGUMENT");

  const secondBootstrap = await callFunction("bootstrapPlayer", secondUser.idToken, {
    requestId: "integration-bootstrap-003"
  });
  assert.equal(secondBootstrap.status, 200);
  assert.equal(secondBootstrap.body.result.created, true);

  const playersAfterSecondBootstrap = await listCollection("players");
  assert.ok(
    playersAfterSecondBootstrap.some((entry) => entry.id === firstUser.localId)
  );
  assert.ok(
    playersAfterSecondBootstrap.some((entry) => entry.id === secondUser.localId)
  );
  assert.equal(
    playersAfterSecondBootstrap.filter((entry) => entry.id === firstUser.localId).length,
    1
  );
  assert.equal(
    playersAfterSecondBootstrap.filter((entry) => entry.id === secondUser.localId).length,
    1
  );

  assert.equal((await listCollection("playerPrivate")).length, playerPrivateBefore.length);
  assert.equal((await listCollection("captures")).length, capturesBefore.length);
  assert.equal((await listCollection("idempotency")).length, idempotencyBefore.length);
  assert.equal((await listCollection("requests")).length, requestsBefore.length);
});
