import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadSourceModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/authoritativePinSource.js")
  );
}

test("unavailable authoritative provider resolves null without network or mutable global state", async () => {
  const module = await loadSourceModule();
  const provider = module.createUnavailableAuthoritativePinSourceProvider();

  const result = await provider.getSourceGeometry({
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789"
  });

  assert.equal(result, null);
});

test("authoritative source contract stays dependency-injected and limited to canonical source identity", () => {
  const sourceText = fs.readFileSync(
    path.join(
      repoRoot,
      "functions/src/domain/pins/authoritativePinSource.ts"
    ),
    "utf8"
  );

  assert.match(sourceText, /export type CanonicalPinSourceReference = \{/);
  assert.match(sourceText, /export type AuthoritativePinSourceGeometry =/);
  assert.match(sourceText, /export interface AuthoritativePinSourceProvider \{/);
  assert.match(sourceText, /getSourceGeometry\(/);
  assert.doesNotMatch(sourceText, /\buid\b/);
  assert.doesNotMatch(sourceText, /\brequestId\b/);
  assert.doesNotMatch(sourceText, /\bsubmittedLatitude\b/);
  assert.doesNotMatch(sourceText, /\bsubmittedLongitude\b/);
  assert.doesNotMatch(sourceText, /\bfetch\s*\(/);
  assert.doesNotMatch(sourceText, /\baxios\b/);
  assert.doesNotMatch(sourceText, /\bnode-fetch\b/);
});
