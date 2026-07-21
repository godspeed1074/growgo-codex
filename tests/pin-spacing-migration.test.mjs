import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");

test("active pin spacing stays at 50 metres and capture radius stays at 100 metres", () => {
  assert.match(scriptSource, /const PIN_SPACING_METERS = 50;/);
  assert.doesNotMatch(scriptSource, /const PIN_SPACING_METERS = 46;/);
  assert.match(scriptSource, /const CAPTURE_RADIUS_METERS = 100;/);
  assert.doesNotMatch(scriptSource, /\b91\.44\b/);
});

test("live pin storage now uses the canonical v1 namespace and legacy removal stays narrow", () => {
  assert.match(
    scriptSource,
    /const PIN_STORAGE_KEY = "growgo-pins-v3-canonical-v1-50m";/
  );
  assert.match(
    scriptSource,
    /const LEGACY_PIN_STORAGE_KEYS = Object\.freeze\(\[\s*"growgo-pins",\s*"growgo-pins-v2-50m"\s*\]\);/
  );
  assert.doesNotMatch(scriptSource, /const PIN_STORAGE_KEY = "growgo-pins-v2-50m";/);
  assert.match(scriptSource, /localStorage\.removeItem\(legacyKey\);/);
  assert.doesNotMatch(scriptSource, /localStorage\.clear\(\)/);
});

test("backup restore now requires active canonical namespace metadata before pin arrays are restored", () => {
  assert.match(scriptSource, /pinStorageKey: PIN_STORAGE_KEY,/);
  assert.match(scriptSource, /pinSpacingMetres: PIN_SPACING_METERS,/);
  assert.match(scriptSource, /pinGeneratorVersion: 1,/);
  assert.match(scriptSource, /pinIdScheme: "ggpin:v1:osm-way",/);
  assert.match(scriptSource, /backup\.pinStorageKey === PIN_STORAGE_KEY/);
  assert.match(
    scriptSource,
    /Number\(backup\.pinSpacingMetres\) === PIN_SPACING_METERS/
  );
  assert.match(
    scriptSource,
    /Number\(backup\.pinGeneratorVersion\) === 1/
  );
  assert.match(
    scriptSource,
    /backup\.pinIdScheme === "ggpin:v1:osm-way"/
  );
});

test("legacy coordinate IDs are no longer used for active visible pin generation", () => {
  assert.match(scriptSource, /const CANONICAL_V1_BASE_PIN_ID_SCHEME = "ggpin:v1:osm-way";/);
  assert.match(scriptSource, /const key = canonicalPin\.pinId;/);
  assert.doesNotMatch(
    scriptSource,
    /const key = `\$\{point\.lat\.toFixed\(6\)\},\$\{point\.lng\.toFixed\(6\)\}`;/
  );
});

test("full-way canonical generation happens before viewport filtering and preserves stable OSM way identity", () => {
  assert.match(
    scriptSource,
    /sourceId: normalizeCanonicalV1SourceId\(el\.id\),/
  );
  assert.match(
    scriptSource,
    /const canonicalPins = generateCanonicalV1PinsForWay\(\{/
  );
  assert.match(
    scriptSource,
    /sourceId: way\?\.sourceId \?\? way\?\.id,/
  );
  assert.match(
    scriptSource,
    /const visiblePins = filterCanonicalV1PinsToBounds\(\s*canonicalPins,\s*visibleBounds\s*\);/
  );
});

test("visible pin records preserve canonical metadata and hydration rejects non-canonical base pin records", () => {
  assert.match(scriptSource, /generatorVersion: canonicalPin\.generatorVersion,/);
  assert.match(scriptSource, /sourceType: canonicalPin\.sourceType,/);
  assert.match(scriptSource, /sourceId: canonicalPin\.sourceId,/);
  assert.match(scriptSource, /positionIndex: canonicalPin\.positionIndex,/);
  assert.match(scriptSource, /function buildHydratedCanonicalBasePinRecord\(pin\) \{/);
  assert.match(scriptSource, /if \(isLegacyCoordinateBasePinId\(pin\.id\)\) return null;/);
  assert.match(scriptSource, /parsedId = parseCanonicalV1BasePinId\(pin\.id\);/);
  assert.match(scriptSource, /if \(parsedId\.sourceId !== storedSourceId\) \{/);
  assert.match(
    scriptSource,
    /if \(\s*!Number\.isSafeInteger\(storedPositionIndex\) \|\|\s*parsedId\.positionIndex !== storedPositionIndex\s*\) \{/
  );
});

test("pin migration startup order still keeps namespace cleanup ahead of hydration and uses only the active key", () => {
  const domContentLoadedIndex = scriptSource.indexOf(
    'document.addEventListener("DOMContentLoaded", async () => {'
  );
  const migrationIndex = scriptSource.indexOf(
    "  migrateLegacyPinStorageNamespace();",
    domContentLoadedIndex
  );
  const loadPinsIndex = scriptSource.indexOf(
    "  loadPinsFromLocal();",
    domContentLoadedIndex
  );

  assert.notEqual(domContentLoadedIndex, -1);
  assert.notEqual(migrationIndex, -1);
  assert.notEqual(loadPinsIndex, -1);
  assert.ok(migrationIndex < loadPinsIndex);
  assert.match(
    scriptSource,
    /localStorage\.setItem\(PIN_STORAGE_KEY, JSON\.stringify\(Array\.from\(pinStore\.values\(\)\)\)\);/
  );
  assert.match(scriptSource, /const raw = localStorage\.getItem\(PIN_STORAGE_KEY\);/);
});
