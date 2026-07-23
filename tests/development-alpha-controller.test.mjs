import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const controllerModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "development-alpha-controller.mjs"
  )
);

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
    inviteMirror: {
      requiredProvider: "google.com",
      allowedEmails: ["player@example.com"]
    },
    ...overrides
  };
}

function createHarness(options = {}) {
  const renderStates = [];
  let initializeCount = 0;
  let bootstrapCount = 0;
  let snapshotCount = 0;
  let captureCount = 0;
  let rendererActivationCount = 0;
  let authCallback = null;

  const controller = controllerModule.createDevelopmentAlphaController({
    readConfig() {
      return Object.prototype.hasOwnProperty.call(options, "config")
        ? options.config
        : buildConfig();
    },
    async createRuntime() {
      initializeCount += 1;
      return {
        onAuthStateChanged(callback) {
          authCallback = callback;
          return () => {};
        },
        async signIn() {
          if (options.signInError) {
            throw options.signInError;
          }
        },
        async signOut() {},
        async bootstrapPlayer() {
          bootstrapCount += 1;
          if (options.bootstrapError) {
            throw options.bootstrapError;
          }
          return { ok: true };
        },
        async getPlayerSnapshot() {
          snapshotCount += 1;
          if (options.snapshotError) {
            throw options.snapshotError;
          }
          return {
            level: 1,
            xp: 0,
            coins: 0
          };
        },
        async capturePin() {
          captureCount += 1;
        }
      };
    },
    render(state) {
      renderStates.push(state);
    },
    toClientSafeError(error) {
      return error?.message ?? "safe-error";
    },
    isUnauthorizedError(error) {
      return error?.code === "permission-denied";
    },
    createRequestId() {
      return "req-001";
    },
    activateRenderer() {
      rendererActivationCount += 1;
    }
  });

  return {
    controller,
    renderStates,
    getInitializeCount: () => initializeCount,
    getBootstrapCount: () => bootstrapCount,
    getSnapshotCount: () => snapshotCount,
    getCaptureCount: () => captureCount,
    getRendererActivationCount: () => rendererActivationCount,
    emitAuth(user) {
      return authCallback?.(user);
    }
  };
}

test("initialization happens at most once", async () => {
  const harness = createHarness();
  await Promise.all([
    harness.controller.ensureInitialized(),
    harness.controller.ensureInitialized()
  ]);

  assert.equal(harness.getInitializeCount(), 1);
});

test("signed-in flow bootstraps once and bounds snapshot refreshes", async () => {
  const harness = createHarness();
  await harness.controller.ensureInitialized();
  await harness.emitAuth({
    uid: "uid-001",
    email: "player@example.com",
    emailVerified: true,
    providerData: [{ providerId: "google.com" }]
  });

  await harness.controller.refreshSnapshot();
  await harness.controller.refreshSnapshot();
  await harness.controller.refreshSnapshot();

  assert.equal(harness.getBootstrapCount(), 1);
  assert.equal(harness.getSnapshotCount(), 2);
  assert.equal(harness.getCaptureCount(), 0);
  assert.equal(harness.getRendererActivationCount(), 0);
});

test("unauthorized backend denial moves auth state to unauthorized", async () => {
  const harness = createHarness({
    bootstrapError: { code: "permission-denied", message: "denied" }
  });
  await harness.controller.ensureInitialized();
  await harness.emitAuth({
    uid: "uid-002",
    email: "blocked@example.com",
    emailVerified: true,
    providerData: [{ providerId: "google.com" }]
  });

  const state = harness.controller.getState();
  assert.equal(state.authStatus, "unauthorized");
  assert.equal(state.bootstrapStatus, "denied");
  assert.equal(harness.getCaptureCount(), 0);
  assert.equal(harness.getRendererActivationCount(), 0);
});

test("missing config stays blocked and never initializes runtime", async () => {
  const harness = createHarness({ config: null });
  await harness.controller.ensureInitialized();

  const state = harness.controller.getState();
  assert.equal(state.initializationStatus, "blocked");
  assert.equal(harness.getInitializeCount(), 0);
});
