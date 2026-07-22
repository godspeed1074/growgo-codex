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

function findCaptureRequests(entries, { uid, requestId }) {
  return entries.filter(
    (entry) => entry.data.uid === uid && entry.data.requestId === requestId
  );
}

function findIdempotencyReservations(entries, { uid, requestId }) {
  return entries.filter(
    (entry) =>
      entry.data.uid === uid &&
      entry.data.operation === "capturePin" &&
      entry.data.idempotencyKey === requestId
  );
}

test("capturePin records deferred requests with persistent reservation, replay, and conflict protection", async (t) => {
  if (!(await ensureLocalEmulatorsAvailable(t))) {
    return;
  }

  const captureRequestsBefore = await listCollection("captureRequests");
  const playersBefore = await listCollection("players");
  const capturesBefore = await listCollection("captures");
  const idempotencyBefore = await listCollection("idempotency");
  const requestsBefore = await listCollection("requests");
  const playerPrivateBefore = await listCollection("playerPrivate");

  const firstUser = await createAnonymousUser();
  const secondUser = await createAnonymousUser();

  const basePayload = {
    requestId: "capture-test-001",
    pinId: "test-pin-001",
    latitude: -38.45,
    longitude: 145.24,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  };

  const beforeBootstrap = await callFunction(
    "capturePin",
    firstUser.idToken,
    basePayload
  );
  assert.equal(beforeBootstrap.status, 400);
  assert.equal(beforeBootstrap.body.error.status, "FAILED_PRECONDITION");

  const captureRequestsAfterMissingPlayer = await listCollection("captureRequests");
  assert.equal(captureRequestsAfterMissingPlayer.length, captureRequestsBefore.length);

  const bootstrapFirstUser = await callFunction("bootstrapPlayer", firstUser.idToken, {
    requestId: "capture-bootstrap-001"
  });
  assert.equal(bootstrapFirstUser.status, 200);

  const firstCapture = await callFunction("capturePin", firstUser.idToken, basePayload);
  assert.equal(firstCapture.status, 200);
  assert.equal(firstCapture.body.result.ok, false);
  assert.equal(firstCapture.body.result.accepted, false);
  assert.equal(firstCapture.body.result.replayed, false);
  assert.equal(firstCapture.body.result.status, "eligibility-deferred");
  assert.equal(
    firstCapture.body.result.code,
    "authoritative-pin-verification-unavailable"
  );
  assert.equal(firstCapture.body.result.rewardGranted, false);

  const captureRequestsAfterFirst = await listCollection("captureRequests");
  const idempotencyAfterFirst = await listCollection("idempotency");
  const firstLedger = captureRequestsAfterFirst.find(
    (entry) =>
      entry.data.uid === firstUser.localId &&
      entry.data.requestId === basePayload.requestId
  );
  assert.ok(firstLedger);
  assert.equal(firstLedger.data.accepted, false);
  assert.equal(firstLedger.data.rewardGranted, false);
  assert.equal(firstLedger.data.status, "eligibility-deferred");
  assert.equal(
    firstLedger.data.eligibilityCode,
    "authoritative-pin-verification-unavailable"
  );
  const firstReservation = findIdempotencyReservations(idempotencyAfterFirst, {
    uid: firstUser.localId,
    requestId: basePayload.requestId
  });
  assert.equal(firstReservation.length, 1);
  assert.equal(firstReservation[0].data.requestFingerprint.length, 64);
  assert.equal(firstReservation[0].data.reservationState, "capture-deferred");
  assert.equal(firstReservation[0].data.captureRequestKey, firstLedger.id);
  assert.equal(firstReservation[0].data.retentionDays, 30);
  assert.equal(firstReservation[0].data.response.ok, false);
  assert.equal(firstReservation[0].data.response.accepted, false);
  assert.equal(firstReservation[0].data.response.rewardGranted, false);
  assert.equal(firstReservation[0].data.response.requestId, basePayload.requestId);
  assert.equal(firstReservation[0].data.response.pinId, basePayload.pinId);

  const playerAfterFirstCapture = (
    await listCollection("players")
  ).find((entry) => entry.id === firstUser.localId);
  assert.ok(playerAfterFirstCapture);
  assert.equal(playerAfterFirstCapture.data.level, 1);
  assert.equal(playerAfterFirstCapture.data.xp, 0);
  assert.equal(playerAfterFirstCapture.data.coins, 0);

  const replayCapture = await callFunction("capturePin", firstUser.idToken, basePayload);
  assert.equal(replayCapture.status, 200);
  assert.equal(replayCapture.body.result.replayed, true);
  assert.equal(replayCapture.body.result.accepted, false);
  assert.equal(replayCapture.body.result.rewardGranted, false);

  const captureRequestsAfterReplay = await listCollection("captureRequests");
  const idempotencyAfterReplay = await listCollection("idempotency");
  assert.equal(
    findCaptureRequests(captureRequestsAfterReplay, {
      uid: firstUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfterReplay, {
      uid: firstUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );

  const conflictPinId = await callFunction("capturePin", firstUser.idToken, {
    ...basePayload,
    pinId: "test-pin-002"
  });
  assert.equal(conflictPinId.status, 409);
  assert.equal(conflictPinId.body.error.status, "ALREADY_EXISTS");

  const conflictCoords = await callFunction("capturePin", firstUser.idToken, {
    ...basePayload,
    longitude: 145.25
  });
  assert.equal(conflictCoords.status, 409);
  assert.equal(conflictCoords.body.error.status, "ALREADY_EXISTS");

  const secondRequest = await callFunction("capturePin", firstUser.idToken, {
    ...basePayload,
    requestId: "capture-test-002"
  });
  assert.equal(secondRequest.status, 200);
  assert.equal(secondRequest.body.result.replayed, false);

  const bootstrapSecondUser = await callFunction("bootstrapPlayer", secondUser.idToken, {
    requestId: "capture-bootstrap-002"
  });
  assert.equal(bootstrapSecondUser.status, 200);

  const secondUserSameRequestId = await callFunction("capturePin", secondUser.idToken, basePayload);
  assert.equal(secondUserSameRequestId.status, 200);
  assert.equal(secondUserSameRequestId.body.result.replayed, false);

  const uidInjection = await callFunction("capturePin", firstUser.idToken, {
    ...basePayload,
    uid: secondUser.localId
  });
  assert.equal(uidInjection.status, 400);
  assert.equal(uidInjection.body.error.status, "INVALID_ARGUMENT");

  const rewardInjection = await callFunction("capturePin", firstUser.idToken, {
    ...basePayload,
    requestId: "capture-test-injection-001",
    points: 999999
  });
  assert.equal(rewardInjection.status, 400);
  assert.equal(rewardInjection.body.error.status, "INVALID_ARGUMENT");

  const captureRequestsAfter = await listCollection("captureRequests");
  const idempotencyAfter = await listCollection("idempotency");
  assert.equal(
    findCaptureRequests(captureRequestsAfter, {
      uid: firstUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );
  assert.equal(
    findCaptureRequests(captureRequestsAfter, {
      uid: firstUser.localId,
      requestId: "capture-test-002"
    }).length,
    1
  );
  assert.equal(
    findCaptureRequests(captureRequestsAfter, {
      uid: secondUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfter, {
      uid: firstUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfter, {
      uid: firstUser.localId,
      requestId: "capture-test-002"
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfter, {
      uid: secondUser.localId,
      requestId: basePayload.requestId
    }).length,
    1
  );

  const playersAfter = await listCollection("players");
  assert.ok(playersAfter.some((entry) => entry.id === firstUser.localId));
  assert.ok(playersAfter.some((entry) => entry.id === secondUser.localId));

  assert.equal((await listCollection("captures")).length, capturesBefore.length);
  assert.equal(idempotencyAfter.length, idempotencyBefore.length + 3);
  assert.equal((await listCollection("requests")).length, requestsBefore.length);
  assert.equal((await listCollection("playerPrivate")).length, playerPrivateBefore.length);
});

test("capturePin concurrent identical requests produce one first result, one replay result, and one reservation", async (t) => {
  if (!(await ensureLocalEmulatorsAvailable(t))) {
    return;
  }

  const captureRequestsBefore = await listCollection("captureRequests");
  const capturesBefore = await listCollection("captures");
  const idempotencyBefore = await listCollection("idempotency");
  const requestsBefore = await listCollection("requests");
  const playerPrivateBefore = await listCollection("playerPrivate");

  const user = await createAnonymousUser();
  const bootstrap = await callFunction("bootstrapPlayer", user.idToken, {
    requestId: "capture-concurrency-bootstrap-001"
  });
  assert.equal(bootstrap.status, 200);

  const payload = {
    requestId: "capture-concurrency-same-001",
    pinId: "test-pin-concurrency-001",
    latitude: -38.45,
    longitude: 145.24,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  };

  const [firstResponse, secondResponse] = await Promise.all([
    callFunction("capturePin", user.idToken, payload),
    callFunction("capturePin", user.idToken, payload)
  ]);

  const responses = [firstResponse, secondResponse];
  assert.deepEqual(
    responses.map((entry) => entry.status).sort((left, right) => left - right),
    [200, 200]
  );
  assert.equal(
    responses.filter((entry) => entry.body.result.replayed === false).length,
    1
  );
  assert.equal(
    responses.filter((entry) => entry.body.result.replayed === true).length,
    1
  );

  const captureRequestsAfter = await listCollection("captureRequests");
  const idempotencyAfter = await listCollection("idempotency");
  assert.equal(
    findCaptureRequests(captureRequestsAfter, {
      uid: user.localId,
      requestId: payload.requestId
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfter, {
      uid: user.localId,
      requestId: payload.requestId
    }).length,
    1
  );
  assert.equal(captureRequestsAfter.length, captureRequestsBefore.length + 1);
  assert.equal(idempotencyAfter.length, idempotencyBefore.length + 1);
  assert.equal((await listCollection("captures")).length, capturesBefore.length);
  assert.equal((await listCollection("requests")).length, requestsBefore.length);
  assert.equal((await listCollection("playerPrivate")).length, playerPrivateBefore.length);
});

test("capturePin concurrent conflicting requests reserve once and reject the conflicting replay safely", async (t) => {
  if (!(await ensureLocalEmulatorsAvailable(t))) {
    return;
  }

  const captureRequestsBefore = await listCollection("captureRequests");
  const capturesBefore = await listCollection("captures");
  const idempotencyBefore = await listCollection("idempotency");
  const requestsBefore = await listCollection("requests");
  const playerPrivateBefore = await listCollection("playerPrivate");

  const user = await createAnonymousUser();
  const bootstrap = await callFunction("bootstrapPlayer", user.idToken, {
    requestId: "capture-concurrency-bootstrap-002"
  });
  assert.equal(bootstrap.status, 200);

  const sharedRequestId = "capture-concurrency-conflict-001";
  const [firstResponse, secondResponse] = await Promise.all([
    callFunction("capturePin", user.idToken, {
      requestId: sharedRequestId,
      pinId: "test-pin-conflict-001",
      latitude: -38.45,
      longitude: 145.24,
      accuracyMetres: 10,
      clientCapturedAt: "2026-07-21T00:00:00.000Z"
    }),
    callFunction("capturePin", user.idToken, {
      requestId: sharedRequestId,
      pinId: "test-pin-conflict-002",
      latitude: -38.45,
      longitude: 145.24,
      accuracyMetres: 10,
      clientCapturedAt: "2026-07-21T00:00:00.000Z"
    })
  ]);

  const responses = [firstResponse, secondResponse];
  assert.equal(
    responses.filter((entry) => entry.status === 200).length,
    1
  );
  assert.equal(
    responses.filter((entry) => entry.status === 409).length,
    1
  );
  assert.equal(
    responses.find((entry) => entry.status === 409)?.body.error.status,
    "ALREADY_EXISTS"
  );
  assert.equal(
    responses.find((entry) => entry.status === 200)?.body.result.replayed,
    false
  );

  const captureRequestsAfter = await listCollection("captureRequests");
  const idempotencyAfter = await listCollection("idempotency");
  assert.equal(
    findCaptureRequests(captureRequestsAfter, {
      uid: user.localId,
      requestId: sharedRequestId
    }).length,
    1
  );
  assert.equal(
    findIdempotencyReservations(idempotencyAfter, {
      uid: user.localId,
      requestId: sharedRequestId
    }).length,
    1
  );
  assert.equal(captureRequestsAfter.length, captureRequestsBefore.length + 1);
  assert.equal(idempotencyAfter.length, idempotencyBefore.length + 1);
  assert.equal((await listCollection("captures")).length, capturesBefore.length);
  assert.equal((await listCollection("requests")).length, requestsBefore.length);
  assert.equal((await listCollection("playerPrivate")).length, playerPrivateBefore.length);
});
