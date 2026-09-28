import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("legacy base-pin recovery is retired after alpha ownership moved server-side", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "functions/src/api/recoverLegacyBasePinOwnership.ts"),
    "utf8"
  );

  assert.match(source, /const LEGACY_BASE_PIN_RECOVERY_ENABLED = false;/);
  assert.match(source, /if \(!LEGACY_BASE_PIN_RECOVERY_ENABLED\) \{[\s\S]*recoveredPins: \[\]/);
});
