import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const toolsSource = await readFile(new URL("../src/api/adminPlayerTools.ts", import.meta.url), "utf8");
const sessionSource = await readFile(new URL("../src/domain/players/activeDeviceSession.ts", import.meta.url), "utf8");
const moderationSource = await readFile(new URL("../src/domain/players/playerModeration.ts", import.meta.url), "utf8");

test("Mission Control player lookup stays exact and opens safe server-owned player data", () => {
  assert.match(toolsSource, /normalizePlayerPublicCode\(query\)/);
  assert.match(toolsSource, /collection\("playerNames"\)\.doc\(avatarNameKey\(query\)\)/);
  assert.match(toolsSource, /buildAdminPlayerProfile\(uid, actor\.role === "owner"\)/);
  assert.match(toolsSource, /moneySpentStatus: "not-connected"/);
  assert.match(toolsSource, /moneySpentStatus: "restricted"/);
});

test("inventory adjustments are bounded, silent to the player, and append to staff history", () => {
  assert.match(toolsSource, /MAX_ADJUSTMENT_QUANTITY = 10_000/);
  assert.match(toolsSource, /Math\.max\(0, previousQuantity - quantity\)/);
  assert.match(toolsSource, /PLAYER_ADMIN_HISTORY_SUBCOLLECTION/);
  assert.match(toolsSource, /kind: "inventory-adjustment"/);
  assert.match(toolsSource, /actorUid: actor\.uid/);
  assert.match(toolsSource, /actorName: actor\.name/);
});

test("warnings, suspensions, and bans record permanent moderation history", () => {
  assert.match(toolsSource, /"warning" \| "suspend" \| "ban" \| "clear-restriction"/);
  assert.match(toolsSource, /PLAYER_MODERATION_HISTORY_SUBCOLLECTION/);
  assert.match(toolsSource, /reason = requireString\(payload\.reason, "reason", 3, 1_000\)/);
  assert.match(toolsSource, /transaction\.delete\(sessionRef\)/);
  assert.match(toolsSource, /status: "pending-mail-provider"/);
});

test("a suspended or banned account is checked before every normal device-session path", () => {
  assert.match(sessionSource, /await requirePlayerAccountIsActive\(params\.uid\);/);
  assert.match(moderationSource, /status === "banned"/);
  assert.match(moderationSource, /status !== "suspended"/);
  assert.match(moderationSource, /suspendedUntil/);
});
