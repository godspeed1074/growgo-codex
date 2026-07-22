import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { getApps } from "firebase-admin/app";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/config/developmentBackendActivation.js"
    )
  );
}

function buildEnv(overrides = {}) {
  return {
    GROWGO_BACKEND_ENVIRONMENT: "development",
    GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
    GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "false",
    GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED: "false",
    GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "false",
    ...overrides
  };
}

test("missing environment denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({ GROWGO_BACKEND_ENVIRONMENT: undefined }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "environment_missing");
});

test("unknown environment denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({ GROWGO_BACKEND_ENVIRONMENT: "staging" }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "environment_unknown");
});

test("missing project identity denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({ GROWGO_BACKEND_PROJECT_ID: undefined }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "project_missing");
});

test("mismatched project identity denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({ GROWGO_BACKEND_PROJECT_ID: "growgo-beta" }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "project_mismatch");
});

test("development identity match parses as valid and activation-permitted at the contract level", async () => {
  const module = await loadModule();
  const contract = module.buildDevelopmentBackendActivationContract({
    env: buildEnv()
  });

  assert.equal(contract.environment.environmentName, "development");
  assert.equal(contract.environment.projectIdentityValid, true);
  assert.equal(contract.environment.runtimeActivationPermitted, true);
});

test("beta denies even with all flags true", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_BACKEND_ENVIRONMENT: "beta",
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "environment_not_development");
});

test("production denies even with all flags true", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_BACKEND_ENVIRONMENT: "production",
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "environment_not_development");
});

test("missing global backend flag denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: undefined,
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "backend_flag_disabled");
});

test("invalid global backend flag denies", async () => {
  const module = await loadModule();
  const contract = module.buildDevelopmentBackendActivationContract({
    env: buildEnv({ GROWGO_DEVELOPMENT_BACKEND_ENABLED: "TRUE" })
  });
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "TRUE",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(contract.flags.developmentBackendEnabled.parseState, "invalid");
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "backend_flag_disabled");
});

test("missing capability flag denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: undefined
    }),
    capability: "player_snapshot"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "capability_flag_disabled");
});

test("invalid capability flag denies", async () => {
  const module = await loadModule();
  const contract = module.buildDevelopmentBackendActivationContract({
    env: buildEnv({
      GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "1"
    })
  });
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "1"
    }),
    capability: "player_snapshot"
  });

  assert.equal(
    contract.flags.developmentPlayerSnapshotEnabled.parseState,
    "invalid"
  );
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "capability_flag_disabled");
});

test("global true plus capability false denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED: "false"
    }),
    capability: "pin_capture"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "capability_flag_disabled");
});

test("global false plus capability true denies", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
      GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED: "true"
    }),
    capability: "pin_capture"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "backend_flag_disabled");
});

test("global true plus capability true in development may return contract-level allow", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "allowed");
});

test("emulator development allow path remains pure and allowed only when flags also pass", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088",
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
    }),
    capability: "player_snapshot"
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "allowed");
  assert.equal(result.environment.emulatorMode, true);
  assert.equal(result.environment.emulatorIdentityValid, true);
});

test("emulator non-loopback host rejects", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      FIRESTORE_EMULATOR_HOST: "10.0.0.1:8088",
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "emulator_host_invalid");
});

test("emulator mode does not bypass flags", async () => {
  const module = await loadModule();
  const result = module.evaluateDevelopmentBackendCapabilityAccess({
    env: buildEnv({
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088",
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
      GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true"
    }),
    capability: "authentication"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "backend_flag_disabled");
});

test("pure contract evaluation causes no Firebase initialization or network activity", async () => {
  const module = await loadModule();
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  const firebaseAppCountBefore = getApps().length;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected network activity");
  };

  try {
    const env = buildEnv({
      GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
      GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED: "true"
    });
    const envSnapshot = structuredClone(env);
    const result = module.evaluateDevelopmentBackendCapabilityAccess({
      env,
      capability: "authoritative_pin_acquisition"
    });

    assert.equal(result.allowed, true);
    assert.equal(fetchCalled, false);
    assert.equal(getApps().length, firebaseAppCountBefore);
    assert.deepEqual(env, envSnapshot);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reason code set is stable and complete", async () => {
  const module = await loadModule();

  assert.deepEqual(module.developmentBackendDecisionReasonCodes, [
    "environment_missing",
    "environment_unknown",
    "project_missing",
    "project_mismatch",
    "emulator_host_invalid",
    "environment_not_development",
    "backend_flag_disabled",
    "capability_flag_disabled",
    "allowed"
  ]);
});
