import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const placementModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-lighthouse-package-synthetic-world-placement.mjs"
  )
);

test("real lighthouse package synthetic world placement validates the package-backed lighthouse binding", () => {
  const result =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement();

  assert.equal(result.ok, true);
  assert.equal(
    result.lighthouseWorldPlacement.packageBackedWorldInstanceBinding.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  assert.equal(
    result.lighthouseWorldPlacement.packageBackedWorldInstanceBinding.packageVersion,
    "1.0.0"
  );
  assert.equal(
    result.lighthouseWorldPlacement.packageBackedWorldInstanceBinding.placementRule,
    "PLACEMENT_LANDMARK_COASTAL_001"
  );
  assert.equal(
    result.lighthouseWorldPlacement.packageBackedWorldInstanceBinding.lodProfile,
    "close"
  );
});

test("real lighthouse package synthetic world placement keeps lighthouse renderer handoff deterministic", () => {
  const first =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement();
  const second =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.lighthouseWorldPlacement, second.lighthouseWorldPlacement);
});

test("real lighthouse package synthetic world placement validates day, sunset, and night appearance profiles", () => {
  const result =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement();

  assert.equal(result.ok, true);
  assert.deepEqual(result.lighthouseWorldPlacement.appearanceProfileValidation, {
    day: "DAY_COASTAL_LIGHTHOUSE",
    sunset: "SUNSET_COASTAL_LIGHTHOUSE",
    night: "NIGHT_COASTAL_LIGHTHOUSE",
    defaultAppearanceProfile: "DAY_COASTAL_LIGHTHOUSE",
    allProfilesSupported: true
  });
});

test("real lighthouse package synthetic world placement rejects package-reference and appearance-profile mismatches safely", () => {
  const invalidPackageReference =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement({
      ...placementModule.realLighthousePackageSyntheticWorldPlacementDefinition,
      packageReference:
        "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/LIGHTHOUSE_ISLAND_ROCKY_001_INVALID.glb"
    });

  const invalidAppearanceProfiles =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement({
      ...placementModule.realLighthousePackageSyntheticWorldPlacementDefinition,
      supportedAppearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    });

  assert.equal(invalidPackageReference.ok, false);
  assert.equal(invalidPackageReference.errorCode, "package_reference_mismatch");
  assert.equal(invalidAppearanceProfiles.ok, false);
  assert.equal(invalidAppearanceProfiles.errorCode, "appearance_profile_mismatch");
});

test("real lighthouse package synthetic world placement remains passive and creates no runtime world or renderer objects", () => {
  const result =
    placementModule.validateRealLighthousePackageSyntheticWorldPlacement();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.lighthouseWorldPlacement, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.lighthouseWorldPlacement.rendererHandoffValidation,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.lighthouseWorldPlacement,
      "runtimeRenderer"
    ),
    false
  );
});
