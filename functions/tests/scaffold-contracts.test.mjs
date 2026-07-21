import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("firebase local alias is pinned to growgo-development", () => {
  const firebaserc = JSON.parse(read(".firebaserc"));
  assert.equal(firebaserc.projects.dev, "growgo-development");
});

test("firebase emulator ports avoid GrowGo local ports 8000 and 8001", () => {
  const firebaseConfig = JSON.parse(read("firebase.json"));
  assert.equal(firebaseConfig.emulators.auth.port, 9099);
  assert.equal(firebaseConfig.emulators.functions.port, 5003);
  assert.equal(firebaseConfig.emulators.firestore.port, 8088);
  assert.notEqual(firebaseConfig.emulators.functions.port, 8000);
  assert.notEqual(firebaseConfig.emulators.functions.port, 8001);
});

test("firestore and storage rules default to deny paths", () => {
  const firestoreRules = read("firestore.rules");
  const storageRules = read("storage.rules");
  assert.match(firestoreRules, /allow read, write: if false;/);
  assert.match(storageRules, /allow read, write: if false;/);
});

test("callable scaffold files exist with auth and server-authority markers", () => {
  const bootstrapPlayer = read("functions/src/api/bootstrapPlayer.ts");
  const getPlayerSnapshot = read("functions/src/api/getPlayerSnapshot.ts");
  const capturePin = read("functions/src/api/capturePin.ts");
  const captureTypes = read("functions/src/domain/captures/captureTypes.ts");

  assert.match(bootstrapPlayer, /requireAuthenticated/);
  assert.match(getPlayerSnapshot, /requireAuthenticated/);
  assert.match(capturePin, /requireAuthenticated/);
  assert.match(capturePin, /rewardBoundary: captureRewardBoundary/);
  assert.match(captureTypes, /rewardCalculationAuthority: "server-only"/);
  assert.match(capturePin, /prohibitedClientAuthorityInputs/);
});
