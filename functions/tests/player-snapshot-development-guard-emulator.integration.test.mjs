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
      signal: AbortSignal.timeout(3000)
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

test("getPlayerSnapshot stays fail-closed in the emulator when development flags are missing", async (t) => {
  if (!(await ensureLocalEmulatorsAvailable(t))) {
    return;
  }

  const playersBefore = await listCollection("players");
  const playerPrivateBefore = await listCollection("playerPrivate");

  const user = await createAnonymousUser();
  const response = await callFunction("getPlayerSnapshot", user.idToken, {});

  assert.equal(response.status, 400);
  assert.equal(response.body.error.status, "FAILED_PRECONDITION");
  assert.equal(
    response.body.error.message,
    "This development backend capability is not available in the current environment."
  );
  assert.equal((await listCollection("players")).length, playersBefore.length);
  assert.equal(
    (await listCollection("playerPrivate")).length,
    playerPrivateBefore.length
  );
});
