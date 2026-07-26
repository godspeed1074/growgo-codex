import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const fixtureModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-interpretation-fixture-set.mjs"
  )
);

test("coastal fixture classification matches expectations", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const fixture = validation.fixtureResults.find(
    (result) => result.fixtureId === "COASTAL_TOWN_FIXTURE_001"
  );

  assert.equal(fixture.actualClassification, "COASTAL");
  assert.equal(fixture.selectedProfile, "AUSTRALIAN_COASTAL_WORLD");
  assert.ok(fixture.evidenceReasons.includes("near coastline"));
  assert.equal(fixture.validationPassed, true);
});

test("rural fixture classification matches expectations", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const fixture = validation.fixtureResults.find(
    (result) => result.fixtureId === "RURAL_REGION_FIXTURE_001"
  );

  assert.ok(["RURAL", "REMOTE"].includes(fixture.actualClassification));
  assert.equal(fixture.selectedProfile, "AUSTRALIAN_OUTBACK_WORLD");
  assert.ok(fixture.evidenceReasons.length > 0);
  assert.equal(fixture.validationPassed, true);
});

test("alpine fixture classification matches expectations", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const fixture = validation.fixtureResults.find(
    (result) => result.fixtureId === "ALPINE_REGION_FIXTURE_001"
  );

  assert.equal(fixture.actualClassification, "MOUNTAIN");
  assert.equal(fixture.selectedProfile, "ALPINE_WORLD");
  assert.ok(fixture.evidenceReasons.includes("high elevation detected"));
  assert.equal(fixture.validationPassed, true);
});

test("tourism fixture classification matches expectations", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const fixture = validation.fixtureResults.find(
    (result) => result.fixtureId === "TOURISM_AREA_FIXTURE_001"
  );

  assert.equal(fixture.actualClassification, "TOURISM");
  assert.equal(fixture.selectedProfile, "TOURISM_ARCHIPELAGO_WORLD");
  assert.ok(
    fixture.evidenceReasons.includes("attraction density detected")
  );
  assert.equal(fixture.validationPassed, true);
});

test("urban fixture classification matches expectations", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const fixture = validation.fixtureResults.find(
    (result) => result.fixtureId === "URBAN_AREA_FIXTURE_001"
  );

  assert.equal(fixture.actualClassification, "URBAN");
  assert.equal(fixture.selectedProfile, "METROPOLITAN_EXPANSION_WORLD");
  assert.ok(
    fixture.evidenceReasons.includes("high settlement density")
  );
  assert.equal(fixture.validationPassed, true);
});

test("same fixture set produces deterministic same output", () => {
  const first = fixtureModule.createRealWorldInterpretationFixtureValidation();
  const second = fixtureModule.createRealWorldInterpretationFixtureValidation();

  assert.deepEqual(first, second);
  assert.equal(first.summary.deterministicOutputValid, true);
});

test("fixture validation includes evidence explanations and traceability", () => {
  const validation = fixtureModule.createRealWorldInterpretationFixtureValidation();

  assert.equal(validation.schemaId, "FIXTURE_INTERPRETATION_VALIDATION_001");
  assert.equal(validation.summary.fixtureCount, 5);
  assert.equal(validation.summary.allFixturesPassed, true);
  assert.ok(
    validation.fixtureResults.every(
      (fixture) =>
        fixture.evidencePresent === true &&
        fixture.gameplayTraceabilityMatches === true &&
        fixture.atlasPresentationMatches === true
    )
  );
});
