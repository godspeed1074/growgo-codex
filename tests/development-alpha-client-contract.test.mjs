import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const modulePath = path.resolve(
  import.meta.dirname,
  "..",
  "client",
  "development-alpha-contract.mjs"
);

const contractModule = await import(modulePath);

function buildConfig(overrides = {}) {
  return {
    environment: "development",
    connectionMode: "emulator",
    firebase: {
      apiKey: "dev-api-key",
      authDomain: "growgo-development.firebaseapp.com",
      projectId: "growgo-development",
      storageBucket: "growgo-development.firebasestorage.app",
      messagingSenderId: "281913453165",
      appId: "1:281913453165:web:test"
    },
    emulator: {
      auth: { host: "127.0.0.1", port: 9099 },
      functions: { host: "127.0.0.1", port: 5003 },
      firestore: { host: "127.0.0.1", port: 8088 }
    },
    ...overrides
  };
}

test("environment denial stays fail-closed outside development", () => {
  const result = contractModule.validateDevelopmentAlphaClientConfig(
    buildConfig({ environment: "production" })
  );

  assert.equal(result.ok, false);
  assert.ok(result.blockedReasons.includes("environment-not-development"));
});

test("project mismatch is denied", () => {
  const result = contractModule.validateDevelopmentAlphaClientConfig(
    buildConfig({
      firebase: {
        ...buildConfig().firebase,
        projectId: "growgo-beta"
      }
    })
  );

  assert.equal(result.ok, false);
  assert.ok(result.blockedReasons.includes("project-id-mismatch"));
});

test("emulator mode requires loopback-only exact endpoints", () => {
  const result = contractModule.validateDevelopmentAlphaClientConfig(
    buildConfig({
      emulator: {
        auth: { host: "192.168.0.10", port: 9099 },
        functions: { host: "127.0.0.1", port: 5003 },
        firestore: { host: "127.0.0.1", port: 8088 }
      }
    })
  );

  assert.equal(result.ok, false);
  assert.ok(result.blockedReasons.includes("auth-emulator-invalid"));
});

test("live mode denies mixed live and emulator configuration", () => {
  const result = contractModule.validateDevelopmentAlphaClientConfig(
    buildConfig({
      connectionMode: "live"
    })
  );

  assert.equal(result.ok, false);
  assert.ok(result.blockedReasons.includes("live-mode-mixed-with-emulator"));
});
