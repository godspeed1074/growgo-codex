import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadBasePinValueModule() {
  return import(path.join(repoRoot, "functions/lib/domain/pins/basePinValue.js"));
}

test("base pins start at five points and grow only after full uncaptured weeks", async () => {
  const { getBasePinPointValue } = await loadBasePinValueModule();
  const capturedAt = new Date("2026-08-01T00:00:00.000Z");

  assert.equal(
    getBasePinPointValue({ lastCapturedAt: null, now: new Date("2026-08-30T00:00:00.000Z") }),
    5
  );
  assert.equal(
    getBasePinPointValue({
      lastCapturedAt: capturedAt,
      now: new Date("2026-08-07T23:59:59.999Z")
    }),
    5
  );
  assert.equal(
    getBasePinPointValue({
      lastCapturedAt: capturedAt,
      now: new Date("2026-08-08T00:00:00.000Z")
    }),
    6
  );
  assert.equal(
    getBasePinPointValue({
      lastCapturedAt: capturedAt,
      now: new Date("2026-08-15T00:00:00.000Z")
    }),
    7
  );
});
