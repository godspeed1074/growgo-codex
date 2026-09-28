import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readNearbyDailyPoiCaptures } = require("../lib/infrastructure/pins/nearbyDailyPoiCaptures.js");
const day = "2026-09-07";

function database() {
  const accounts = new Map();
  const calls = { queries: 0, returnedRecords: 0, modeledDocumentReads: 0, batches: [] };
  const fixture = {
    calls, accounts, failure: null,
    collection(name) {
      assert.equal(name, "playerDailyPoiCaptures");
      return { doc(uid) { return { collection(child) {
        assert.equal(child, "pins");
        return { where(field, operator, ids) {
          assert.equal(field, "pinId");
          assert.equal(operator, "in");
          assert.ok(ids.length > 0 && ids.length <= 30);
          calls.queries++;
          calls.batches.push({ uid, ids });
          return { get: async () => {
            if (fixture.failure) throw fixture.failure;
            const rows = (accounts.get(uid) ?? []).filter(row => ids.includes(row.pinId));
            calls.returnedRecords += rows.length;
            calls.modeledDocumentReads += Math.max(1, rows.length);
            return { docs: rows.map(row => ({ data: () => row })) };
          } };
        } };
      } }; } };
    }
  };
  return fixture;
}
const read = (db, pinIds, uid = "player-a", captureDay = day) => readNearbyDailyPoiCaptures({ db, pinIds, uid, captureDay });

test("no nearby daily POIs means no history query", async () => {
  const db = database();
  assert.deepEqual(await read(db, []), new Set());
  assert.deepEqual(await read(db, [""]), new Set());
  assert.equal(db.calls.queries, 0);
});

test("reads two nearby records instead of a 500-record global daily slice", async () => {
  const db = database();
  db.accounts.set("player-a", [
    ...Array.from({ length: 1200 }, (_, i) => ({ pinId: `away-${i}`, captureDay: day })),
    { pinId: "near-church", captureDay: day },
    { pinId: "near-park", captureDay: day }
  ]);
  assert.deepEqual(await read(db, ["near-church", "near-park"]), new Set(["near-church", "near-park"]));
  assert.equal(db.calls.queries, 1);
  assert.equal(db.calls.returnedRecords, 2);
  assert.equal(db.calls.modeledDocumentReads, 2);
});

test("UTC day matching resets yesterday's captures without hiding future or missing pins", async () => {
  const db = database();
  db.accounts.set("player-a", [
    { pinId: "yesterday", captureDay: "2026-09-06" },
    { pinId: "today", captureDay: day },
    { pinId: "tomorrow", captureDay: "2026-09-08" },
    { pinId: "invalid", captureDay: 20260907 }
  ]);
  const ids = ["yesterday", "today", "tomorrow", "invalid", "missing"];
  assert.deepEqual(await read(db, ids), new Set(["today"]));
  assert.deepEqual(await read(db, ids, "player-a", "2026-09-08"), new Set(["tomorrow"]));
});

test("two players requesting the same pins never share capture status", async () => {
  const db = database();
  db.accounts.set("player-a", [{ pinId: "church", captureDay: day }]);
  db.accounts.set("player-b", [{ pinId: "park", captureDay: day }]);
  const [a, b] = await Promise.all([read(db, ["church", "park"]), read(db, ["church", "park"], "player-b")]);
  assert.deepEqual(a, new Set(["church"]));
  assert.deepEqual(b, new Set(["park"]));
  assert.deepEqual(db.calls.batches.map(batch => batch.uid), ["player-a", "player-b"]);
});

test("new captures and record deletion are fresh on the next read", async () => {
  const db = database();
  assert.deepEqual(await read(db, ["park"]), new Set());
  db.accounts.set("player-a", [{ pinId: "park", captureDay: day }]);
  assert.deepEqual(await read(db, ["park"]), new Set(["park"]));
  db.accounts.delete("player-a");
  assert.deepEqual(await read(db, ["park"]), new Set());
  assert.equal(db.calls.queries, 3);
});

test("deduplicated batches stay within 30 IDs and never truncate after 500 captures", async () => {
  const db = database();
  const ids = Array.from({ length: 651 }, (_, i) => `poi-${i}`);
  db.accounts.set("player-a", ids.map(pinId => ({ pinId, captureDay: day })));
  const result = await read(db, [...ids, ...ids]);
  assert.equal(result.size, 651);
  assert.ok(result.has("poi-650"));
  assert.equal(db.calls.queries, 22);
  assert.equal(db.calls.batches.flatMap(batch => batch.ids).length, 651);
});

test("empty per-batch results do not invent captures", async () => {
  const db = database();
  assert.deepEqual(await read(db, Array.from({ length: 61 }, (_, i) => `missing-${i}`)), new Set());
  assert.equal(db.calls.queries, 3);
  assert.equal(db.calls.modeledDocumentReads, 3);
});

test("query failure propagates instead of falsely marking every pin available", async () => {
  const db = database();
  db.failure = new Error("Synthetic database failure");
  await assert.rejects(read(db, ["church"]), /Synthetic database failure/);
  db.failure = null;
  db.accounts.set("player-a", [{ pinId: "church", captureDay: day }]);
  assert.deepEqual(await read(db, ["church"]), new Set(["church"]));
});
