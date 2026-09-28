import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const source = fs.readFileSync(path.join(repoRoot, "functions/src/api/supportReports.ts"), "utf8");
const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");

test("Support reports are server-authoritative and protected like normal gameplay", () => {
  assert.match(source, /requireAuthenticated\(request\)/);
  assert.match(source, /requireAppCheckIfEnabled\(request\)/);
  assert.match(source, /requireInvitedUserAccess\(request\)/);
  assert.match(source, /requireActiveDeviceSessionIfEnabled/);
  assert.match(source, /requireAdminAccount\(authContext\.uid\)/);
});

test("active matching reports merge while duplicate reporter submissions are blocked", () => {
  assert.match(source, /supportCaseKeys/);
  assert.match(source, /already reported this while the case is still open/);
  assert.match(source, /reporterCount/);
  assert.match(source, /additional-report-received/);
});

test("profile-picture reports suppress the reported picture without preventing a replacement", () => {
  assert.match(source, /profilePictureModeration/);
  assert.match(source, /suppressedAvatarUrl/);
  assert.match(source, /readDismissedProfilePictureRestore/);
  assert.match(html, /id="supportReportBtn"/);
});

test("staff case actions retain attributable history and revised notes", () => {
  assert.match(source, /case-taken/);
  assert.match(source, /admin-note/);
  assert.match(source, /admin-note-revised/);
  assert.match(source, /editedByName/);
  assert.match(source, /Add an internal reason before closing this case/);
});
