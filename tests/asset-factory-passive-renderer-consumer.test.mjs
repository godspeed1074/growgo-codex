import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-factory-renderer-validation-scene.mjs"
  )
);

const starterWorldPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "starter-world-asset-pack.mjs"
  )
);

const passiveRendererConsumerModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "passive-renderer-consumer.mjs"
  )
);

function buildContext() {
  return starterWorldPackModule.buildStarterWorldAssetPackContext();
}

function buildRendererPayload(context) {
  const sceneResult = sceneModule.buildSyntheticFactoryRendererValidationScene(
    sceneModule.syntheticFactoryRendererValidationSceneDefinition,
    context
  );

  if (!sceneResult.ok) {
    throw new Error(`Expected synthetic scene to build successfully: ${sceneResult.errorCode}`);
  }

  return {
    sceneResult,
    payload: {
      ...sceneResult.scene.rendererAdapterOutput,
      orientation: sceneResult.scene.rendererAdapterOutput.transformData.orientation
    }
  };
}

test("passive renderer consumer accepts valid renderer-facing payload from the asset factory pipeline", () => {
  const context = buildContext();
  const { payload } = buildRendererPayload(context);
  const result =
    passiveRendererConsumerModule.consumePassiveRendererPayload(payload);

  assert.equal(result.ok, true);
  assert.equal(
    result.acceptedPayload.rendererAssetReference.assetId,
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  assert.equal(result.acceptedPayload.rendererComponentReferences.length > 0, true);
  assert.equal(result.acceptedPayload.metadata.adapterProfile, "custom-2.5d-passive");
});

test("passive renderer consumer validates required fields and supported renderer profile", () => {
  const context = buildContext();
  const { payload } = buildRendererPayload(context);
  const missingMetadata = { ...payload };
  delete missingMetadata.metadata;

  const unsupportedProfile = {
    ...payload,
    metadata: {
      ...payload.metadata,
      adapterProfile: "custom-3d-live"
    }
  };

  const missingMetadataResult =
    passiveRendererConsumerModule.consumePassiveRendererPayload(missingMetadata);
  const unsupportedProfileResult =
    passiveRendererConsumerModule.consumePassiveRendererPayload(unsupportedProfile);

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(unsupportedProfileResult.ok, false);
  assert.equal(
    unsupportedProfileResult.errorCode,
    "unsupported_renderer_profile"
  );
});

test("passive renderer consumer rejects invalid transform and component payloads safely", () => {
  const context = buildContext();
  const { payload } = buildRendererPayload(context);

  const invalidTransform = {
    ...payload,
    transformData: {
      ...payload.transformData,
      position: {
        x: Number.NaN,
        y: payload.transformData.position.y
      }
    }
  };

  const invalidComponents = {
    ...payload,
    rendererComponentReferences: []
  };

  const invalidTransformResult =
    passiveRendererConsumerModule.consumePassiveRendererPayload(invalidTransform);
  const invalidComponentsResult =
    passiveRendererConsumerModule.consumePassiveRendererPayload(invalidComponents);

  assert.equal(invalidTransformResult.ok, false);
  assert.equal(invalidTransformResult.errorCode, "invalid_field_type");
  assert.equal(invalidComponentsResult.ok, false);
  assert.equal(
    invalidComponentsResult.errorCode,
    "missing_component_references"
  );
});

test("same input produces identical passive renderer payload", () => {
  const context = buildContext();
  const first = buildRendererPayload(context);
  const second = buildRendererPayload(context);

  const firstValidation =
    passiveRendererConsumerModule.validatePassiveRendererPayload(first.payload);
  const secondValidation =
    passiveRendererConsumerModule.validatePassiveRendererPayload(second.payload);

  assert.equal(firstValidation.ok, true);
  assert.equal(secondValidation.ok, true);
  assert.deepEqual(firstValidation.normalizedPayload, secondValidation.normalizedPayload);
});

test("passive renderer consumer remains non-rendering and non-runtime", () => {
  const context = buildContext();
  const { payload } = buildRendererPayload(context);
  const result =
    passiveRendererConsumerModule.consumePassiveRendererPayload(payload);

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.acceptedPayload, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.acceptedPayload.rendererAssetReference,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.acceptedPayload.transformData, "worldInstance"),
    false
  );
});
