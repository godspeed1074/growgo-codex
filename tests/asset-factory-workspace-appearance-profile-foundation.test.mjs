import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const foundationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-generation-workspace-appearance-profile-foundation.mjs"
  )
);

test("workspace and appearance profile foundation validates lighthouse workspace planning", () => {
  const result =
    foundationModule.validateAssetGenerationWorkspaceAppearanceProfileFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.workspaceProfile.foundation.assetId, "LIGHTHOUSE_COASTAL_FAMILY_001");
  assert.equal(result.workspaceProfile.foundation.appearanceProfiles.length, 3);
  assert.equal(result.workspaceProfile.compatibility.workspaceCompatibilityVerified, true);
});

test("workspace and appearance profile foundation validates day, sunset, and night appearance profiles", () => {
  const result =
    foundationModule.validateAssetGenerationWorkspaceAppearanceProfileFoundation();

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.workspaceProfile.foundation.appearanceProfiles.map((entry) => entry.profileId),
    [
      "DAY_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE"
    ]
  );
});

test("workspace and appearance profile foundation rejects mismatched appearance profiles and invalid animation authorization safely", () => {
  const badAppearance =
    foundationModule.validateAssetGenerationWorkspaceAppearanceProfileFoundation({
      ...foundationModule.assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
      appearanceProfiles: foundationModule.assetGenerationWorkspaceAppearanceProfileFoundationDefinition.appearanceProfiles.slice(
        0,
        2
      )
    });

  const badAnimation =
    foundationModule.validateAssetGenerationWorkspaceAppearanceProfileFoundation({
      ...foundationModule.assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
      animationProfiles: [
        {
          ...foundationModule.assetGenerationWorkspaceAppearanceProfileFoundationDefinition.animationProfiles[0],
          animationAuthorized: true
        }
      ]
    });

  assert.equal(badAppearance.ok, false);
  assert.equal(badAppearance.errorCode, "appearance_profile_mismatch");
  assert.equal(badAnimation.ok, false);
  assert.equal(badAnimation.errorCode, "animation_authorization_open");
});

test("workspace and appearance profile foundation remains passive and non-rendering", () => {
  const result =
    foundationModule.validateAssetGenerationWorkspaceAppearanceProfileFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workspaceProfile, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workspaceProfile, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workspaceProfile, "runtimeRenderer"),
    false
  );
});
