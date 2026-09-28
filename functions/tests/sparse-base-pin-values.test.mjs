import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readSparseBasePinCaptureValues } = require("../lib/infrastructure/pins/sparseBasePinCaptureValues.js");
const { buildBasePinCaptureValueState, getBasePinPointValue } = require("../lib/domain/pins/basePinValue.js");

function database(records = new Map()) {
  const calls = { queries: 0, billedDocuments: 0, ids: [] };
  return {
    records, calls,
    collection: () => ({
      where: (field, operator, ids) => {
        assert.equal(field, "pinId");
        assert.equal(operator, "in");
        assert.ok(ids.length > 0 && ids.length <= 30);
        calls.queries++;
        calls.ids.push(...ids);
        return { get: async () => {
          const results = ids.filter((id) => records.has(id));
          calls.billedDocuments += Math.max(1, results.length);
          return { docs: results.map((id) => ({ data: () => records.get(id) })) };
        } };
      }
    })
  };
}

test("350 never-captured pin values require 12 empty queries instead of 350 individual reads", async () => {
  const db = database();
  const ids = Array.from({ length: 350 }, (_, i) => `ggpin:v1:osm-way:123456789:${i}`);
  assert.equal((await readSparseBasePinCaptureValues(db, ids)).size, 0);
  assert.equal(db.calls.queries, 12);
  assert.equal(db.calls.billedDocuments, 12);
});

test("existing capture values retain weekly growth and reset immediately after a capture", async () => {
  const db = database();
  const captured = "ggpin:v1:osm-way:123456789:1";
  const unseen = "ggpin:v1:osm-way:123456789:2";
  const now = new Date("2026-09-08T00:00:00Z");
  db.records.set(captured, buildBasePinCaptureValueState({ pinId: captured, capturedAt: new Date("2026-09-01T00:00:00Z") }));
  let values = await readSparseBasePinCaptureValues(db, [captured, unseen, captured]);
  assert.equal(values.size, 1);
  assert.equal(getBasePinPointValue({ lastCapturedAt: values.get(captured).lastCapturedAt, now }), 6);
  assert.equal(getBasePinPointValue({ lastCapturedAt: values.get(unseen)?.lastCapturedAt, now }), 5);
  assert.equal(db.calls.ids.length, 2);
  db.records.set(captured, buildBasePinCaptureValueState({ pinId: captured, capturedAt: now }));
  values = await readSparseBasePinCaptureValues(db, [captured]);
  assert.equal(getBasePinPointValue({ lastCapturedAt: values.get(captured).lastCapturedAt, now }), 5);
});

test("empty requests do not query; malformed records do not invent point values", async () => {
  const db = database(new Map([["broken", { pinId: "broken", lastCapturedAt: "invalid" }]]));
  assert.equal((await readSparseBasePinCaptureValues(db, [])).size, 0);
  assert.equal(db.calls.queries, 0);
  assert.equal((await readSparseBasePinCaptureValues(db, ["broken"])).size, 0);
});
