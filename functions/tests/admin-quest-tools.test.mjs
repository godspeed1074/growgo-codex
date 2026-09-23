import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/api/adminQuestTools.ts", import.meta.url), "utf8");

test("main quest test resets are owner-only, narrow, and audited", () => {
  assert.match(source, /requireAuthenticated\(request\)/);
  assert.match(source, /requireAppCheckIfEnabled\(request\)/);
  assert.match(source, /requireActiveDeviceSessionIfEnabled/);
  assert.match(source, /requireAdminAccount\(authContext\.uid, \["owner"\]\)/);
  assert.match(source, /"starter-tutorial"/);
  assert.match(source, /"leonard-introduction"/);
  assert.match(source, /action: "quest_reset"/);
});

test("starter resets create only a fresh starter run while dove rewards remain protected", () => {
  assert.match(source, /transaction\.set\(starterQuestRef, createStarterQuestState\(now\)\)/);
  assert.match(source, /if \(existingDove\.exists\)/);
  assert.match(source, /cannot be reset after the dove is earned/);
  assert.match(source, /transaction\.delete\(leonardQuestRef\)/);
});
