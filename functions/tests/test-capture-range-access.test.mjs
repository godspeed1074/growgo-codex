import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accessSource = await readFile(new URL("../src/domain/players/testCaptureRangeAccess.ts", import.meta.url), "utf8");
const toggleSource = await readFile(new URL("../src/api/toggleTestCaptureRange.ts", import.meta.url), "utf8");

test("range toggle is limited to the two reserved player identities", async () => {
  const { getTestCaptureRangeAllowedNameKey, isTestCaptureRangeAccountIdentity } = await import("../lib/domain/players/testCaptureRangeAccess.js");
  assert.equal(getTestCaptureRangeAllowedNameKey("Rubberlips"), "rubberlips");
  assert.equal(getTestCaptureRangeAllowedNameKey("  OBI-Cal  "), "obi-cal");
  assert.equal(getTestCaptureRangeAllowedNameKey("Rubberlips 2"), null);
  assert.equal(getTestCaptureRangeAllowedNameKey("Owner"), null);
  assert.equal(isTestCaptureRangeAccountIdentity({
    displayName: "Rubberlips", authenticatedUid: "uid-a", reservedUid: "uid-a"
  }), true);
  assert.equal(isTestCaptureRangeAccountIdentity({
    displayName: "Rubberlips", authenticatedUid: "uid-a", reservedUid: "uid-b"
  }), false);
});

test("toggle callable requires auth/session, limits environment, and fixes duration server-side", () => {
  assert.match(accessSource, /"rubberlips"/);
  assert.match(accessSource, /"obi-cal"/);
  assert.match(toggleSource, /requireAuthenticated\(request\)/);
  assert.match(toggleSource, /requireActiveDeviceSessionIfEnabled/);
  assert.match(toggleSource, /requireInvitedUserAccess\(request\)/);
  assert.match(toggleSource, /runtimeConfig\.projectId !== TEST_CAPTURE_RANGE_LIVE_PROJECT_ID/);
  assert.match(toggleSource, /TEST_UNLIMITED_CAPTURE_RANGE_DURATION_MILLISECONDS/);
  assert.match(toggleSource, /testCaptureRangeHistory/);
});
