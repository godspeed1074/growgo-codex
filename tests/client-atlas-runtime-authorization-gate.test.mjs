import test from "node:test";
import assert from "node:assert/strict";
import { ATLAS_RUNTIME_AUTHORIZATION_CONTRACT_VERSION as contractVersion, ATLAS_RUNTIME_AUTHORIZATION_VERSION as authorizationVersion, evaluateAtlasRuntimeAuthorization } from "../client/atlas-runtime-authorization-gate.mjs";

function grant(environment) { return { environment, contractVersion, authorizationVersion, state: "enabled", enabled: true }; }

test("explicit development authorization is allowed only in development", () => {
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "development", authorization: grant("development") }).authorized, true);
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "beta", authorization: grant("development") }).reasonCode, "ENVIRONMENT_MISMATCH");
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "development" }).reasonCode, "MISSING_AUTHORIZATION");
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "development", authorization: "bad" }).reasonCode, "INVALID_AUTHORIZATION");
});

test("beta grants are isolated and require explicit valid input", () => {
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "beta", authorization: grant("beta") }).authorized, true);
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: grant("beta") }).reasonCode, "ENVIRONMENT_MISMATCH");
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "beta", authorization: grant("development") }).reasonCode, "ENVIRONMENT_MISMATCH");
});

test("production is default-deny and malformed or stale-shaped grants stay denied", () => {
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production" }).authorized, false);
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: grant("development") }).authorized, false);
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: grant("beta") }).authorized, false);
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: { ...grant("production"), contractVersion: "OLD" } }).reasonCode, "CONTRACT_VERSION_MISMATCH");
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: { ...grant("production"), state: "disabled", enabled: false } }).reasonCode, "DISABLED");
  // This fixture proves the contract only; no repository runtime uses it.
  assert.equal(evaluateAtlasRuntimeAuthorization({ environment: "production", authorization: grant("production") }).authorized, true);
});

test("unknown environments fail closed and decisions are immutable", () => {
  const result = evaluateAtlasRuntimeAuthorization({ environment: "preview", authorization: grant("preview") });
  assert.equal(result.reasonCode, "UNSUPPORTED_ENVIRONMENT");
  assert.equal(Object.isFrozen(result), true);
});
