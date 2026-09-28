import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("official weekly events have safe UTC defaults and a rolling calendar", async () => {
  const events = await import(path.join(repoRoot, "functions/lib/domain/events/officialEvents.js"));
  const fishy = events.getDefaultOfficialEventSettings("fishy-friday");
  const monday = events.getDefaultOfficialEventSettings("manic-monday");
  assert.equal(fishy.weekdayUtc, 5);
  assert.equal(fishy.startHourUtc, 0);
  assert.equal(fishy.durationHours, 24);
  assert.equal(fishy.announcementEnabled, true);
  assert.equal(fishy.announcementTitle, "Fishy Friday");
  assert.equal(fishy.announcementMessage, "More fish are swimming across water pins today.");
  assert.equal(monday.weekdayUtc, 1);
  assert.equal(monday.startHourUtc, 0);
  assert.equal(monday.announcementEnabled, true);
  assert.equal(monday.announcementTitle, "Manic Monday");

  const legacyFishy = events.readOfficialEventSettings("fishy-friday", {
    schemaVersion: 1,
    id: "fishy-friday",
    enabled: true,
    name: "Fishy Friday",
    description: "The waters are busier every Friday.",
    weekdayUtc: 5,
    startHourUtc: 0,
    durationHours: 24
  });
  assert.equal(legacyFishy.announcementEnabled, true);
  assert.equal(legacyFishy.announcementTitle, "Fishy Friday");
  assert.equal(events.isOfficialEventActive(fishy, new Date("2026-09-11T12:00:00.000Z")), true);
  assert.equal(events.isOfficialEventActive(fishy, new Date("2026-09-12T00:00:00.000Z")), false);

  const calendar = events.listOfficialEventOccurrences({
    events: [fishy, monday],
    now: new Date("2026-09-07T12:00:00.000Z"),
    days: 30
  });
  assert.ok(calendar.some((event) => event.id === "fishy-friday"));
  assert.ok(calendar.some((event) => event.id === "manic-monday" && event.status === "active"));
  assert.ok(calendar.every((event) => event.startsAt.endsWith("Z") && event.endsAt.endsWith("Z")));
});

test("Fishy Friday doubles only the existing water-fish rate and Manic Monday doubles new food buffs", async () => {
  const events = await import(path.join(repoRoot, "functions/lib/domain/events/officialEvents.js"));
  const buffs = await import(path.join(repoRoot, "functions/lib/domain/players/playerBuffs.js"));
  const schedule = [
    events.getDefaultOfficialEventSettings("fishy-friday"),
    events.getDefaultOfficialEventSettings("manic-monday")
  ];
  assert.equal(events.getWaterFishSpawnMultiplier(schedule, new Date("2026-09-11T02:00:00.000Z")), 2);
  assert.equal(events.getWaterFishSpawnMultiplier(schedule, new Date("2026-09-12T02:00:00.000Z")), 1);
  assert.equal(events.getFoodBuffDurationMultiplier(schedule, new Date("2026-09-07T23:59:00.000Z")), 2);
  assert.equal(events.getFoodBuffDurationMultiplier(schedule, new Date("2026-09-08T00:00:00.000Z")), 1);

  const activatedAt = new Date("2026-09-07T23:59:00.000Z");
  const buff = buffs.createPlayerFoodBuff("energy_bar", activatedAt, 2);
  assert.equal(buff.expiresAt.getTime() - buff.activatedAt.getTime(), 10 * 60 * 1_000);
});

test("calendar and owner controls remain server-only and every edit is audited", () => {
  const api = read("functions/src/api/officialEvents.ts");
  const client = read("script.js");
  const html = read("index.html");
  const audit = read("functions/src/domain/admin/adminAuditLog.ts");

  assert.match(api, /requireAdminAccount\(authContext\.uid, \["owner"\]\)/);
  assert.match(api, /recordAdminAuditEvent/);
  assert.match(audit, /official_event_updated/);
  assert.match(client, /getOfficialEventCalendar/);
  assert.match(html, /data-social-action="event-calendar"/);
  assert.match(client, /updateOfficialEvent/);
  assert.match(api, /announcementEnabled/);
  assert.match(api, /announcementTitle/);
  assert.match(api, /announcementMessage/);
  assert.match(client, /data-admin-official-event-preview/);
});
