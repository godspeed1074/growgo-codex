import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "blender-prototype-scene-generation.mjs"
  )
);

test("blender prototype scene generation validates lighthouse island rocky scene planning", () => {
  const result = sceneModule.validateBlenderPrototypeSceneGeneration();

  assert.equal(result.ok, true);
  assert.equal(result.prototypeScene.scene.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.deepEqual(result.prototypeScene.scene.sceneCollections, [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);
});

test("blender prototype scene generation includes required object and material definitions", () => {
  const result = sceneModule.validateBlenderPrototypeSceneGeneration();

  assert.equal(result.ok, true);
  assert.equal(result.prototypeScene.scene.objectDefinitions.length, 6);
  assert.deepEqual(
    result.prototypeScene.scene.materialDefinitions.map((entry) => entry.materialRole),
    ["white-stone", "dark-roof", "glass-glow", "coastal-rock", "grass"]
  );
});

test("blender prototype scene generation rejects invalid object naming and placeholder component mapping safely", () => {
  const badName = sceneModule.validateBlenderPrototypeSceneGeneration({
    ...sceneModule.blenderPrototypeSceneGenerationDefinition,
    objectDefinitions: [
      {
        ...sceneModule.blenderPrototypeSceneGenerationDefinition.objectDefinitions[0],
        objectId: "badName"
      },
      ...sceneModule.blenderPrototypeSceneGenerationDefinition.objectDefinitions.slice(1)
    ]
  });

  const badPlaceholder = sceneModule.validateBlenderPrototypeSceneGeneration({
    ...sceneModule.blenderPrototypeSceneGenerationDefinition,
    objectDefinitions: sceneModule.blenderPrototypeSceneGenerationDefinition.objectDefinitions.map(
      (entry) =>
        entry.objectId === "COASTAL_ENVIRONMENT_ROCK_PLACEHOLDER_001_OBJ"
          ? {
              ...entry,
              componentReference: "LIGHTHOUSE_TOWER_BASE_001"
            }
          : entry
    )
  });

  assert.equal(badName.ok, false);
  assert.equal(badName.errorCode, "invalid_object_name");
  assert.equal(badPlaceholder.ok, false);
  assert.equal(badPlaceholder.errorCode, "placeholder_component_mismatch");
});

test("blender prototype scene generation remains passive and non-rendering", () => {
  const result = sceneModule.validateBlenderPrototypeSceneGeneration();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeScene, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeScene, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeScene, "runtimeRenderer"),
    false
  );
});
