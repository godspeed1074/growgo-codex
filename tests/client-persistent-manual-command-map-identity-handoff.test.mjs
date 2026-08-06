import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const appPath = path.join(repoRoot, "client/development-alpha-app.mjs");

function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("1. persistent authoritative map resolver uses the captured one-frame bridge path", () => {
  const source = fs.readFileSync(appPath, "utf8");

  assert.match(source, /function readPersistentBridgeMapReference\(bridge\)/);
  assert.match(source, /function resolvePersistentAuthoritativeMapReference\(preferredMap = null\)/);
  assert.match(source, /capturedOneFrameBridgeProviderFromScriptDiagnostics\?\.\(\) \?\? null/);
  assert.match(source, /getCustom25DOneFrameBridgeFromScriptDiagnostics\(\) \?\? null/);
  assert.doesNotMatch(
    source,
    /function resolvePersistentAuthoritativeMapReference[\s\S]*rawLeafletMapProviderFromScriptDiagnostics\?\.\(\)/,
  );
});

test("2. persistent readiness identity resolution and raw map resolution both use the same authoritative map helper", () => {
  const source = fs.readFileSync(appPath, "utf8");

  assert.match(source, /const authoritativeMap = resolvePersistentAuthoritativeMapReference\(map\);/);
  assert.match(source, /mapIdentityId: resolvePersistentMapIdentityId\(authoritativeMap\)/);
  assert.match(
    source,
    /rawMapProvider:\s*\{\s*resolveRawMap\(\)\s*\{\s*const map = resolvePersistentAuthoritativeMapReference\(\);/m
  );
});

test("3. preferred map and authoritative bridge map mismatch fails closed as stale map reference", () => {
  const source = fs.readFileSync(appPath, "utf8");

  assert.match(
    source,
    /preferredMap &&\s*authoritativeBridgeMap &&\s*preferredMap !== authoritativeBridgeMap[\s\S]*reasonCode: "STALE_MAP_REFERENCE"/m
  );
});

test("4. approved listener registration reuses the same authoritative map helper and no second direct map lookup path is introduced", () => {
  const source = fs.readFileSync(appPath, "utf8");

  assert.match(
    source,
    /approvedListenerRegistrar\(eventName, callback\)\s*\{\s*const map = resolvePersistentAuthoritativeMapReference\(\);/m
  );

  for (const forbidden of [
    "rawLeafletMapProviderFromScriptDiagnostics?.()",
    "getGrowGoMapFromScriptDiagnostics(",
    "window.GrowGoDeveloperDiagnostics.getGrowGoMap"
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(
        `approvedListenerRegistrar\\(eventName, callback\\)[\\s\\S]*${escapeForRegex(forbidden)}`
      )
    );
  }
});

test("5. no startup attach, Canvas creation, listener registration, frame scheduling, or renderer invocation is added by the handoff fix", () => {
  const source = fs.readFileSync(appPath, "utf8");

  assert.match(source, /createControlledPersistentAtlasContractIntegration\(/);
  assert.doesNotMatch(source, /authorizeControlledPersistentAtlas\(\{/);
  assert.doesNotMatch(source, /attachControlledPersistentAtlas\(\{/);
  assert.doesNotMatch(source, /requestControlledPersistentAtlasRedraw\(\{/);
});
