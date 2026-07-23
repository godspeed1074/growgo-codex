export const GROWGO_DEVELOPMENT_PROJECT_ID = "growgo-development";

export const developmentAlphaEnvironmentNames = Object.freeze([
  "development",
  "beta",
  "production",
  "unknown"
]);

export const developmentAlphaConnectionModes = Object.freeze([
  "live",
  "emulator"
]);

export function normalizeDevelopmentAlphaEnvironment(value) {
  if (typeof value !== "string") {
    return "unknown";
  }

  return developmentAlphaEnvironmentNames.includes(value) ? value : "unknown";
}

export function validateDevelopmentAlphaClientConfig(rawConfig) {
  const blockedReasons = [];
  const config =
    rawConfig && typeof rawConfig === "object" ? rawConfig : Object.create(null);
  const environment = normalizeDevelopmentAlphaEnvironment(config.environment);
  const connectionMode = normalizeConnectionMode(config.connectionMode);
  const firebase = asRecord(config.firebase);
  const emulator = asRecord(config.emulator);
  const projectId = readTrimmedString(firebase.projectId);

  if (environment !== "development") {
    blockedReasons.push("environment-not-development");
  }

  if (connectionMode === null) {
    blockedReasons.push("connection-mode-invalid");
  }

  if (projectId !== GROWGO_DEVELOPMENT_PROJECT_ID) {
    blockedReasons.push("project-id-mismatch");
  }

  const missingFirebaseFields = requiredFirebaseFieldNames().filter(
    (fieldName) => readTrimmedString(firebase[fieldName]) === null
  );
  if (missingFirebaseFields.length > 0) {
    blockedReasons.push("firebase-config-incomplete");
  }

  const emulatorValidation =
    connectionMode === "emulator"
      ? validateLoopbackEmulatorConfig(emulator)
      : { ok: true, normalized: null, blockedReasons: [] };

  if (connectionMode === "live" && Object.keys(emulator).length > 0) {
    blockedReasons.push("live-mode-mixed-with-emulator");
  }

  blockedReasons.push(...emulatorValidation.blockedReasons);

  return Object.freeze({
    ok: blockedReasons.length === 0,
    environment,
    connectionMode,
    expectedProjectId: GROWGO_DEVELOPMENT_PROJECT_ID,
    firebase: Object.freeze({
      apiKey: readTrimmedString(firebase.apiKey),
      authDomain: readTrimmedString(firebase.authDomain),
      projectId,
      storageBucket: readTrimmedString(firebase.storageBucket),
      messagingSenderId: readTrimmedString(firebase.messagingSenderId),
      appId: readTrimmedString(firebase.appId),
      measurementId: readTrimmedString(firebase.measurementId)
    }),
    emulator:
      emulatorValidation.normalized == null
        ? null
        : Object.freeze(emulatorValidation.normalized),
    blockedReasons: Object.freeze(blockedReasons),
    missingFirebaseFields: Object.freeze(missingFirebaseFields)
  });
}

export function buildDevelopmentAlphaRuntimeContract(rawConfig) {
  const validation = validateDevelopmentAlphaClientConfig(rawConfig);

  return Object.freeze({
    initializationAllowed: validation.ok,
    environment: validation.environment,
    connectionMode: validation.connectionMode,
    expectedProjectId: validation.expectedProjectId,
    projectId: validation.firebase.projectId,
    firebase: validation.firebase,
    blockedReasons: validation.blockedReasons,
    missingFirebaseFields: validation.missingFirebaseFields,
    emulator: validation.emulator
  });
}

function normalizeConnectionMode(value) {
  if (typeof value !== "string") {
    return null;
  }

  return developmentAlphaConnectionModes.includes(value) ? value : null;
}

function validateLoopbackEmulatorConfig(rawEmulator) {
  const blockedReasons = [];
  const auth = normalizeEndpoint(rawEmulator.auth);
  const functions = normalizeEndpoint(rawEmulator.functions);
  const firestore = normalizeEndpoint(rawEmulator.firestore);

  if (auth == null || auth.host !== "127.0.0.1" || auth.port !== 9099) {
    blockedReasons.push("auth-emulator-invalid");
  }

  if (
    functions == null ||
    functions.host !== "127.0.0.1" ||
    functions.port !== 5003
  ) {
    blockedReasons.push("functions-emulator-invalid");
  }

  if (
    firestore == null ||
    firestore.host !== "127.0.0.1" ||
    firestore.port !== 8088
  ) {
    blockedReasons.push("firestore-emulator-invalid");
  }

  return {
    ok: blockedReasons.length === 0,
    normalized:
      blockedReasons.length === 0
        ? {
            auth,
            functions,
            firestore
          }
        : null,
    blockedReasons
  };
}

function normalizeEndpoint(rawValue) {
  const endpoint = asRecord(rawValue);
  const host = readTrimmedString(endpoint.host);
  const port = Number(endpoint.port);

  if (host == null || !Number.isInteger(port) || port <= 0) {
    return null;
  }

  return Object.freeze({ host, port });
}

function requiredFirebaseFieldNames() {
  return [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId"
  ];
}

function readTrimmedString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value) {
  return value && typeof value === "object" ? value : Object.create(null);
}
