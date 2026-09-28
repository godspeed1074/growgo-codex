import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCircuitModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/routes/albertParkGrandPrixCircuit.js")
  );
}

test("Albert Park route defines exactly 49 special captures and excludes the pit lane", async () => {
  const circuit = await loadCircuitModule();

  assert.equal(circuit.ALBERT_PARK_GRAND_PRIX_CIRCUIT_SPECIAL_PIN_COUNT, 49);
  assert.equal(
    circuit.isAlbertParkGrandPrixCircuitSpecialPin(
      "ggpin:v1:osm-way:987030977:1"
    ),
    true
  );
  assert.equal(
    circuit.isAlbertParkGrandPrixCircuitSpecialPin(
      "ggpin:v1:osm-way:28119448:0"
    ),
    false
  );
});

test("Albert Park completion is awarded only once after all special captures", async () => {
  const circuit = await loadCircuitModule();
  const now = new Date("2026-09-01T00:00:00.000Z");
  const specialPinIds = [
    "ggpin:v1:osm-way:987030977:1",
    "ggpin:v1:osm-way:987030977:3",
    "ggpin:v1:osm-way:784076839:1",
    "ggpin:v1:osm-way:784076839:3",
    "ggpin:v1:osm-way:784076839:5",
    "ggpin:v1:osm-way:784076839:7",
    "ggpin:v1:osm-way:784076839:9",
    "ggpin:v1:osm-way:784076839:11",
    "ggpin:v1:osm-way:784076839:13",
    "ggpin:v1:osm-way:1070446542:0",
    "ggpin:v1:osm-way:987030978:1",
    "ggpin:v1:osm-way:987030978:3",
    "ggpin:v1:osm-way:784083210:1",
    "ggpin:v1:osm-way:784083210:3",
    "ggpin:v1:osm-way:987030982:1",
    "ggpin:v1:osm-way:1013633268:0",
    "ggpin:v1:osm-way:1021617874:1",
    "ggpin:v1:osm-way:15856988:2",
    "ggpin:v1:osm-way:15856988:4",
    "ggpin:v1:osm-way:15856988:6",
    "ggpin:v1:osm-way:15856988:8",
    "ggpin:v1:osm-way:15856988:10",
    "ggpin:v1:osm-way:15856988:12",
    "ggpin:v1:osm-way:15856988:14",
    "ggpin:v1:osm-way:15856988:16",
    "ggpin:v1:osm-way:15856988:18",
    "ggpin:v1:osm-way:15856988:20",
    "ggpin:v1:osm-way:15856988:22",
    "ggpin:v1:osm-way:15856988:24",
    "ggpin:v1:osm-way:979723480:0",
    "ggpin:v1:osm-way:979723480:2",
    "ggpin:v1:osm-way:784071296:0",
    "ggpin:v1:osm-way:784071296:2",
    "ggpin:v1:osm-way:979723478:0",
    "ggpin:v1:osm-way:979723478:2",
    "ggpin:v1:osm-way:1126808201:0",
    "ggpin:v1:osm-way:987030972:0",
    "ggpin:v1:osm-way:987030985:2",
    "ggpin:v1:osm-way:987030985:4",
    "ggpin:v1:osm-way:987030974:1",
    "ggpin:v1:osm-way:987030974:3",
    "ggpin:v1:osm-way:784076847:0",
    "ggpin:v1:osm-way:784076847:2",
    "ggpin:v1:osm-way:784076847:4",
    "ggpin:v1:osm-way:784076847:6",
    "ggpin:v1:osm-way:784076847:8",
    "ggpin:v1:osm-way:784076847:10",
    "ggpin:v1:osm-way:784076847:12",
    "ggpin:v1:osm-way:784076847:14"
  ];

  const completed = circuit.recordAlbertParkGrandPrixCircuitCaptures({
    progress: { capturedPinIds: [], completedAt: null },
    pinIds: [...specialPinIds, specialPinIds[0]],
    now
  });
  assert.equal(completed.capturedCount, 49);
  assert.equal(completed.completedNow, true);
  assert.equal(completed.completedAt.getTime(), now.getTime());

  const repeated = circuit.recordAlbertParkGrandPrixCircuitCaptures({
    progress: completed,
    pinIds: [specialPinIds[0]],
    now: new Date(now.getTime() + 1_000)
  });
  assert.equal(repeated.completedNow, false);
  assert.equal(repeated.capturedCount, 49);
});
