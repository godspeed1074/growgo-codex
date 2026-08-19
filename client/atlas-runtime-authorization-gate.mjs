export const ATLAS_RUNTIME_AUTHORIZATION_CONTRACT_VERSION = "ATLAS_RUNTIME_AUTHORIZATION_V1";
export const ATLAS_RUNTIME_AUTHORIZATION_VERSION = "V1";
export const ATLAS_RUNTIME_ENVIRONMENTS = Object.freeze(["development", "beta", "production"]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
}

function denied(environment, reasonCode) {
  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_AUTHORIZATION_DECISION_001",
    contractVersion: ATLAS_RUNTIME_AUTHORIZATION_CONTRACT_VERSION,
    environment: environment ?? null,
    authorized: false,
    state: "disabled",
    reasonCode,
    authorizationVersion: null
  });
}

export function evaluateAtlasRuntimeAuthorization({ environment, authorization } = {}) {
  const normalizedEnvironment = typeof environment === "string" ? environment.trim().toLowerCase() : null;
  if (!ATLAS_RUNTIME_ENVIRONMENTS.includes(normalizedEnvironment)) return denied(normalizedEnvironment, "UNSUPPORTED_ENVIRONMENT");
  if (authorization == null) return denied(normalizedEnvironment, "MISSING_AUTHORIZATION");
  if (!authorization || typeof authorization !== "object" || Array.isArray(authorization)) return denied(normalizedEnvironment, "INVALID_AUTHORIZATION");
  if (authorization.contractVersion !== ATLAS_RUNTIME_AUTHORIZATION_CONTRACT_VERSION) return denied(normalizedEnvironment, "CONTRACT_VERSION_MISMATCH");
  if (authorization.authorizationVersion !== ATLAS_RUNTIME_AUTHORIZATION_VERSION) return denied(normalizedEnvironment, "INVALID_AUTHORIZATION");
  if (authorization.environment !== normalizedEnvironment) return denied(normalizedEnvironment, "ENVIRONMENT_MISMATCH");
  if (authorization.state !== "enabled" || authorization.enabled !== true) return denied(normalizedEnvironment, "DISABLED");
  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_AUTHORIZATION_DECISION_001",
    contractVersion: ATLAS_RUNTIME_AUTHORIZATION_CONTRACT_VERSION,
    environment: normalizedEnvironment,
    authorized: true,
    state: "authorized",
    reasonCode: "AUTHORIZED",
    authorizationVersion: ATLAS_RUNTIME_AUTHORIZATION_VERSION
  });
}
