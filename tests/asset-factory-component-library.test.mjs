import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const componentLibraryModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "component-library.mjs"
  )
);

function buildComponent(overrides = {}) {
  return {
    componentId: "WALL_BASIC_001",
    category: "walls",
    type: "straight_wall",
    version: "1.0.0",
    status: "validated",
    dimensions: {
      width: 2,
      height: 3,
      depth: 0.25
    },
    attachmentPoints: [
      {
        pointId: "TOP_CENTER",
        type: "roof_anchor",
        position: {
          x: 0,
          y: 3,
          z: 0
        }
      }
    ],
    compatibilityRules: {
      allowedCategories: ["roofs", "doors"],
      allowedTypes: ["gable_roof", "wood_door"],
      disallowedComponentIds: ["WINDOW_GLASS_999"]
    },
    tags: ["wall", "building", "module"],
    metadata: {
      creatorSource: "internal",
      validationState: "validated"
    },
    ...overrides
  };
}

test("valid component records normalize and validate successfully", () => {
  const result = componentLibraryModule.validateComponentRecord(buildComponent());

  assert.equal(result.ok, true);
  assert.equal(result.normalizedComponent.componentId, "WALL_BASIC_001");
  assert.equal(result.normalizedComponent.category, "walls");
  assert.equal(result.normalizedComponent.version, "1.0.0");
  assert.equal(result.normalizedComponent.status, "validated");
});

test("component required fields are enforced", () => {
  const component = buildComponent();
  delete component.compatibilityRules;

  const result = componentLibraryModule.validateComponentRecord(component);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "missing_required_field");
});

test("component version, category, and status rules are enforced", () => {
  const badVersion = componentLibraryModule.validateComponentRecord(
    buildComponent({ version: "v2" })
  );
  const badCategory = componentLibraryModule.validateComponentRecord(
    buildComponent({ category: "signs" })
  );
  const badStatus = componentLibraryModule.validateComponentRecord(
    buildComponent({ status: "shipping" })
  );

  assert.equal(badVersion.ok, false);
  assert.equal(badVersion.errorCode, "invalid_version");
  assert.equal(badCategory.ok, false);
  assert.equal(badCategory.errorCode, "invalid_category");
  assert.equal(badStatus.ok, false);
  assert.equal(badStatus.errorCode, "invalid_status");
});

test("component validation rejects invalid compatibility rules and invalid dimensions", () => {
  const badCompatibility = componentLibraryModule.validateComponentRecord(
    buildComponent({
      compatibilityRules: {
        allowedCategories: "roofs",
        allowedTypes: [],
        disallowedComponentIds: []
      }
    })
  );
  const badDimensions = componentLibraryModule.validateComponentRecord(
    buildComponent({
      dimensions: {
        width: 0,
        height: 3,
        depth: 0.25
      }
    })
  );

  assert.equal(badCompatibility.ok, false);
  assert.equal(badCompatibility.errorCode, "invalid_field_type");
  assert.equal(badDimensions.ok, false);
  assert.equal(badDimensions.errorCode, "invalid_field_value");
});

test("component library rejects duplicate component IDs", () => {
  const library = componentLibraryModule.createComponentLibrary([buildComponent()]);

  assert.throws(
    () => library.addComponent(buildComponent()),
    /already exists in the component library/
  );
});

test("component library supports lookup, metadata, attachments, and availability", () => {
  const library = componentLibraryModule.createComponentLibrary([
    buildComponent(),
    buildComponent({
      componentId: "ROOF_GABLE_001",
      category: "roofs",
      type: "gable_roof",
      status: "draft",
      compatibilityRules: {
        allowedCategories: ["walls"],
        allowedTypes: ["straight_wall"],
        disallowedComponentIds: []
      }
    })
  ]);

  const component = library.findComponentById("wall_basic_001");
  const metadata = library.getComponentMetadata("WALL_BASIC_001");
  const attachments = library.getComponentAttachmentInformation("WALL_BASIC_001");

  assert.equal(component.componentId, "WALL_BASIC_001");
  assert.equal(metadata.creatorSource, "internal");
  assert.equal(Array.isArray(attachments), true);
  assert.equal(library.isComponentAvailable("WALL_BASIC_001"), true);
  assert.equal(library.isComponentAvailable("ROOF_GABLE_001"), false);
});

test("component library compatibility checks remain modular and data-oriented", () => {
  const library = componentLibraryModule.createComponentLibrary([buildComponent()]);

  assert.equal(
    library.isComponentCompatible("WALL_BASIC_001", {
      componentId: "ROOF_GABLE_001",
      category: "roofs",
      type: "gable_roof"
    }),
    true
  );

  assert.equal(
    library.isComponentCompatible("WALL_BASIC_001", {
      componentId: "WINDOW_GLASS_999",
      category: "windows",
      type: "glass_window"
    }),
    false
  );

  assert.equal(
    library.isComponentCompatible("WALL_BASIC_001", {
      componentId: "TERRAIN_GRASS_PATCH_001",
      category: "terrain_pieces",
      type: "grass_patch"
    }),
    false
  );
});
