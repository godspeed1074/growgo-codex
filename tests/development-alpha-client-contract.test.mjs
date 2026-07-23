import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const modulePath = path.resolve(
  import.meta.dirname,
  "..",
  "client",
  "development-alpha-contract.mjs"
);

const contractModule = await import(modulePath);
const repoRoot = path.resolve(import.meta.dirname, "..");

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
    emulatorAuth: {
      email: "test@growgo.local",
      password: "local-emulator-password"
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

test("missing firebase credentials stay fail-closed even when the project id matches development", () => {
  const result = contractModule.validateDevelopmentAlphaClientConfig({
    environment: "development",
    connectionMode: "live",
    firebase: {
      apiKey: "",
      authDomain: "",
      projectId: "growgo-development",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    }
  });

  assert.equal(result.ok, false);
  assert.ok(result.blockedReasons.includes("firebase-config-incomplete"));
  assert.deepEqual(result.missingFirebaseFields, [
    "apiKey",
    "authDomain",
    "storageBucket",
    "messagingSenderId",
    "appId"
  ]);
});

test("emulator mode can use the development password fallback for the exact local test user", () => {
  const signInPlan = contractModule.resolveDevelopmentAlphaSignInPlan(
    contractModule.buildDevelopmentAlphaRuntimeContract(buildConfig())
  );

  assert.deepEqual(signInPlan, {
    mode: "emulator-password",
    email: "test@growgo.local",
    password: "local-emulator-password"
  });
});

test("emulator mode stays fail-closed when the local password is missing", () => {
  const signInPlan = contractModule.resolveDevelopmentAlphaSignInPlan(
    contractModule.buildDevelopmentAlphaRuntimeContract(
      buildConfig({
        emulatorAuth: {
          email: "test@growgo.local",
          password: ""
        }
      })
    )
  );

  assert.deepEqual(signInPlan, {
    mode: "blocked",
    reason: "emulator-password-auth-missing"
  });
});

test("live mode still uses Google popup even when emulator credentials are present", () => {
  const signInPlan = contractModule.resolveDevelopmentAlphaSignInPlan(
    contractModule.buildDevelopmentAlphaRuntimeContract(
      buildConfig({
        connectionMode: "live",
        emulator: {},
        emulatorAuth: {
          email: "test@growgo.local",
          password: "local-emulator-password"
        }
      })
    )
  );

  assert.deepEqual(signInPlan, {
    mode: "google-popup"
  });
});

test("runtime uses browser-local auth persistence for cross-session restoration", () => {
  const runtimeSource = fs.readFileSync(
    path.join(repoRoot, "client", "development-alpha-runtime.mjs"),
    "utf8"
  );

  assert.match(runtimeSource, /browserLocalPersistence/);
  assert.doesNotMatch(runtimeSource, /browserSessionPersistence/);
  assert.match(runtimeSource, /setPersistence\(auth,\s*browserLocalPersistence\)/);
});

test("index loads the alpha client config before the alpha app and the scaffold publishes the expected global", () => {
  const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const configTag = '<script src="development-alpha-client-config.js"></script>';
  const appTag = '<script type="module" src="client/development-alpha-app.mjs"></script>';

  assert.notEqual(indexSource.includes(configTag), false);
  assert.notEqual(indexSource.includes(appTag), false);
  assert.ok(indexSource.indexOf(configTag) < indexSource.indexOf(appTag));

  const configSource = fs.readFileSync(
    path.join(repoRoot, "development-alpha-client-config.js"),
    "utf8"
  );
  const context = {
    globalThis: {}
  };
  vm.runInNewContext(configSource, context);

  const normalizedConfig = JSON.parse(
    JSON.stringify(context.globalThis.__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__)
  );

  assert.deepEqual(
    {
      ...normalizedConfig,
      emulatorAuth: {
        ...normalizedConfig.emulatorAuth,
        password:
          typeof normalizedConfig.emulatorAuth?.password === "string" &&
          normalizedConfig.emulatorAuth.password.length > 0
            ? "__NON_EMPTY__"
            : normalizedConfig.emulatorAuth?.password
      }
    },
    {
    environment: "development",
    connectionMode: "emulator",
    firebase: {
      apiKey: "AIzaSyDxq6LaaS9VoFc9m_izLepGU6ByFE3fnVE",
      authDomain: "growgo-development.firebaseapp.com",
      projectId: "growgo-development",
      storageBucket: "growgo-development.firebasestorage.app",
      messagingSenderId: "281913453165",
      appId: "1:281913453165:web:7b937b175ac01396382d64",
      measurementId: ""
    },
    emulator: {
      auth: {
        host: "127.0.0.1",
        port: 9099
      },
      functions: {
        host: "127.0.0.1",
        port: 5003
      },
      firestore: {
        host: "127.0.0.1",
        port: 8088
      }
    },
    emulatorAuth: {
      email: "test@growgo.local",
      password: "__NON_EMPTY__"
    },
    inviteMirror: {
      requiredProvider: "password",
      allowedEmails: ["test@growgo.local"]
    }
    }
  );
});
