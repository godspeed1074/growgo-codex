import {
  validateGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";
import {
  validateAtlasObjectRelationshipLayer
} from "./atlas-object-relationship.mjs";

const atlasAssetRecipeResolverSchemaId = "ATLAS_ASSET_RECIPE_RESOLVER_001";
const atlasAssetAssignmentsSchemaId = "ATLAS_ASSET_ASSIGNMENTS_001";
const atlasAssetAssignmentValidationSchemaId =
  "ATLAS_ASSET_ASSIGNMENT_VALIDATION_001";

const recipeCatalog = deepFreeze({
  HOUSE: deepFreeze({
    recipeId: "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
    assetFamily: "FAMILY_BUILDING_RESIDENTIAL_HOUSE",
    variantRules: deepFreeze(["residential_context_sensitive", "suburban_or_town_context"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  BAKERY: deepFreeze({
    recipeId: "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_BAKERY",
    variantRules: deepFreeze(["shopfront_small_town", "pedestrian_facing"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  CAFE: deepFreeze({
    recipeId: "RECIPE_BUILDING_CAFE_COASTAL_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_CAFE",
    variantRules: deepFreeze(["coastal_or_town_cafe", "street_frontage"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  SHOP: deepFreeze({
    recipeId: "RECIPE_BUILDING_SHOP_STANDARD_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_SHOP",
    variantRules: deepFreeze(["shopfront_standard", "street_frontage"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  PETROL_STATION: deepFreeze({
    recipeId: "RECIPE_BUILDING_FUEL_STATION_STANDARD_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_FUEL",
    variantRules: deepFreeze(["roadside_service", "vehicle_access_required"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  LIBRARY: deepFreeze({
    recipeId: "LIBRARY_RECIPE_001",
    assetFamily: "FAMILY_BUILDING_CIVIC_LIBRARY",
    variantRules: deepFreeze(["civic_frontage", "community_anchor"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  SCHOOL: deepFreeze({
    recipeId: "SCHOOL_RECIPE_001",
    assetFamily: "FAMILY_BUILDING_CIVIC_SCHOOL",
    variantRules: deepFreeze(["civic_campus", "community_anchor"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  COMMUNITY_BUILDING: deepFreeze({
    recipeId: "COMMUNITY_BUILDING_RECIPE_001",
    assetFamily: "FAMILY_BUILDING_CIVIC_COMMUNITY",
    variantRules: deepFreeze(["community_hub", "public_frontage"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  PARK: deepFreeze({
    recipeId: "RECIPE_TREATMENT_PARK_STANDARD_001",
    assetFamily: "FAMILY_TREATMENT_PARK",
    variantRules: deepFreeze(["green_space", "trail_connection_sensitive"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  RESERVE: deepFreeze({
    recipeId: "RESERVE_RECIPE_001",
    assetFamily: "FAMILY_TREATMENT_RESERVE",
    variantRules: deepFreeze(["green_space", "controlled_access"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  OVAL: deepFreeze({
    recipeId: "SPORTS_OVAL_RECIPE_001",
    assetFamily: "FAMILY_TREATMENT_RECREATION_OVAL",
    variantRules: deepFreeze(["sports_ground", "open_recreation"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  RECREATION_AREA: deepFreeze({
    recipeId: "RECREATION_AREA_RECIPE_001",
    assetFamily: "FAMILY_TREATMENT_RECREATION",
    variantRules: deepFreeze(["active_recreation", "open_space"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  BEACH: deepFreeze({
    recipeId: "BEACH_RECIPE_001",
    assetFamily: "FAMILY_TREATMENT_BEACH",
    variantRules: deepFreeze(["beach_edge", "coastal_open_space"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  FOREST: deepFreeze({
    recipeId: "FOREST_RECIPE_001",
    assetFamily: "FAMILY_TREATMENT_FOREST",
    variantRules: deepFreeze(["forest_edge", "nature_preservation"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  LIGHTHOUSE: deepFreeze({
    recipeId: "RECIPE_LANDMARK_LIGHTHOUSE_001",
    assetFamily: "FAMILY_LANDMARK_LIGHTHOUSE",
    variantRules: deepFreeze(["coastal_landmark", "focal_point"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  LOOKOUT: deepFreeze({
    recipeId: "RECIPE_LANDMARK_LOOKOUT_001",
    assetFamily: "FAMILY_LANDMARK_LOOKOUT",
    variantRules: deepFreeze(["scenic_overlook", "focal_point"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  HISTORIC_SITE: deepFreeze({
    recipeId: "RECIPE_LANDMARK_HISTORIC_SITE_001",
    assetFamily: "FAMILY_LANDMARK_HISTORIC",
    variantRules: deepFreeze(["heritage_site", "focal_point"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  LANDMARK: deepFreeze({
    recipeId: "RECIPE_LANDMARK_GENERIC_001",
    assetFamily: "FAMILY_LANDMARK_GENERIC",
    variantRules: deepFreeze(["generic_landmark", "focal_point"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  RAILWAY_STATION: deepFreeze({
    recipeId: "RAILWAY_STATION_RECIPE_001",
    assetFamily: "FAMILY_TRANSPORT_RAILWAY_STATION",
    variantRules: deepFreeze(["transport_hub", "rail_access"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  FERRY_TERMINAL: deepFreeze({
    recipeId: "FERRY_TERMINAL_RECIPE_001",
    assetFamily: "FAMILY_TRANSPORT_FERRY_TERMINAL",
    variantRules: deepFreeze(["transport_hub", "waterfront_context"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  BUS_STOP: deepFreeze({
    recipeId: "BUS_STOP_RECIPE_001",
    assetFamily: "FAMILY_TRANSPORT_BUS_STOP",
    variantRules: deepFreeze(["transport_stop", "road_served"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  WAREHOUSE: deepFreeze({
    recipeId: "WAREHOUSE_RECIPE_001",
    assetFamily: "FAMILY_BUILDING_INDUSTRIAL_WAREHOUSE",
    variantRules: deepFreeze(["industrial_frontage", "logistics_access"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  INDUSTRIAL_BUILDING: deepFreeze({
    recipeId: "INDUSTRIAL_BUILDING_RECIPE_001",
    assetFamily: "FAMILY_BUILDING_INDUSTRIAL_GENERIC",
    variantRules: deepFreeze(["industrial_frontage", "service_access"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  NATURAL_FEATURE: deepFreeze({
    recipeId: "RECIPE_TREATMENT_NATURAL_FEATURE_001",
    assetFamily: "FAMILY_TREATMENT_NATURAL",
    variantRules: deepFreeze(["preserve_real_boundary", "context_sensitive"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  }),
  TRANSPORT_ROUTE: deepFreeze({
    recipeId: "RECIPE_TRANSPORT_ROUTE_STANDARD_001",
    assetFamily: "FAMILY_TRANSPORT_ROUTE",
    variantRules: deepFreeze(["linear_transport", "served_object_sensitive"]),
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
  })
});

export function createAtlasAssetRecipeResolver(rawInput, rawRelationships = null) {
  const normalized = normalizeResolverInput(rawInput, rawRelationships);
  const assignments = buildAtlasAssetAssignments(
    normalized.worldObjects.objects,
    normalized.relationships.entries
  );

  const resolverBase = deepFreeze({
    schemaId: atlasAssetRecipeResolverSchemaId,
    resolverId: `${normalized.layerId}_ASSET_RECIPE_RESOLVER`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    assignments: deepFreeze({
      schemaId: atlasAssetAssignmentsSchemaId,
      entries: assignments
    }),
    validation: null
  });

  const validation = buildAssetAssignmentValidation(resolverBase, normalized.worldObjects.objects);
  const resolver = deepFreeze({
    ...resolverBase,
    validation
  });

  const checked = validateAtlasAssetRecipeResolver(resolver);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return resolver;
}

export function validateAtlasAssetRecipeResolver(rawResolver) {
  try {
    const resolver = rawResolver;
    if (resolver?.schemaId !== atlasAssetRecipeResolverSchemaId) {
      throw createValidationError(
        "invalid_atlas_asset_recipe_resolver_schema",
        `Expected ${atlasAssetRecipeResolverSchemaId} but received ${resolver?.schemaId}.`
      );
    }
    assertPresent(resolver.assignments, "Atlas asset assignments are required.");
    assertPresent(resolver.validation, "Atlas asset assignment validation is required.");

    if (resolver.assignments.schemaId !== atlasAssetAssignmentsSchemaId) {
      throw createValidationError(
        "invalid_atlas_asset_assignments_schema",
        `Expected ${atlasAssetAssignmentsSchemaId} but received ${resolver.assignments.schemaId}.`
      );
    }

    if (!Array.isArray(resolver.assignments.entries) || resolver.assignments.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_asset_assignment_entries",
        "Atlas asset assignments must expose a non-empty entries array."
      );
    }

    const objectIds = new Set(resolver.validation.objectIds);
    for (const entry of resolver.assignments.entries) {
      assertPresent(entry.objectId, "Assignment objectId is required.");
      assertPresent(entry.objectType, "Assignment objectType is required.");
      assertPresent(entry.classification, "Assignment classification is required.");
      assertPresent(entry.recipeId, "Assignment recipeId is required.");
      assertPresent(entry.assetFamily, "Assignment assetFamily is required.");
      if (!objectIds.has(entry.objectId)) {
        throw createValidationError(
          "invalid_atlas_asset_assignment_object_reference",
          `Assignment for object ${entry.objectId} references an unknown object.`
        );
      }
    }

    for (const key of [
      "recipeExists",
      "objectTypeCompatible",
      "geometryPreserved",
      "deterministicAssignment",
      "validationPassed"
    ]) {
      if (resolver.validation[key] !== true) {
        throw createValidationError(
          "atlas_asset_assignment_validation_failed",
          `Atlas asset assignment validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(resolver)
    );
    if (expectedSignature !== resolver.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_asset_assignment_signature_mismatch",
        "Atlas asset assignment deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasAssetRecipeResolver: resolver
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_asset_assignment_validation_failed",
      message: error.message,
      atlasAssetRecipeResolver: null
    });
  }
}

function normalizeResolverInput(rawInput, rawRelationships) {
  if (rawInput?.schemaId === "GROWGO_WORLD_OBJECTS_001") {
    const relationships =
      rawRelationships?.schemaId === "ATLAS_OBJECT_RELATIONSHIP_LAYER_001"
        ? rawRelationships.relationships
        : rawRelationships?.schemaId === "ATLAS_OBJECT_RELATIONSHIPS_001"
          ? rawRelationships
          : deepFreeze({ schemaId: "ATLAS_OBJECT_RELATIONSHIPS_001", entries: [] });
    return deepFreeze({
      layerId: "GROWGO_WORLD_OBJECTS_001_DIRECT_INPUT",
      packageId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      regionId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      worldObjects: structuredClone(rawInput),
      relationships: structuredClone(relationships)
    });
  }

  if (rawInput?.schemaId === "ATLAS_OBJECT_RELATIONSHIP_LAYER_001") {
    const validation = validateAtlasObjectRelationshipLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_object_relationship_layer",
        validation.message
      );
    }
    const layer = validation.atlasObjectRelationshipLayer;
    const classification = normalizeClassificationLayer(rawRelationships);
    return deepFreeze({
      layerId: layer.layerId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      worldObjects: structuredClone(classification.worldObjects),
      relationships: structuredClone(layer.relationships)
    });
  }

  const classification = normalizeClassificationLayer(rawInput);
  const relationships =
    rawRelationships?.schemaId === "ATLAS_OBJECT_RELATIONSHIP_LAYER_001"
      ? rawRelationships.relationships
      : rawRelationships?.schemaId === "ATLAS_OBJECT_RELATIONSHIPS_001"
        ? rawRelationships
        : deepFreeze({ schemaId: "ATLAS_OBJECT_RELATIONSHIPS_001", entries: [] });

  return deepFreeze({
    layerId: classification.layerId,
    packageId: classification.packageId,
    regionId: classification.regionId,
    worldObjects: structuredClone(classification.worldObjects),
    relationships: structuredClone(relationships)
  });
}

function normalizeClassificationLayer(rawInput) {
  if (rawInput?.schemaId === "GROWGO_WORLD_OBJECTS_001") {
    return deepFreeze({
      layerId: "GROWGO_WORLD_OBJECTS_001_DIRECT_INPUT",
      packageId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      regionId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      worldObjects: structuredClone(rawInput)
    });
  }

  const validation = validateGrowgoObjectClassificationLayer(rawInput);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_growgo_object_classification_layer",
      validation.message
    );
  }
  const layer = validation.growgoObjectClassificationLayer;
  return deepFreeze({
    layerId: layer.layerId,
    packageId: layer.packageId,
    regionId: layer.regionId,
    worldObjects: structuredClone(layer.worldObjects)
  });
}

function buildAtlasAssetAssignments(objects, relationships) {
  const relationshipsByObject = groupRelationshipsByObject(relationships);
  return deepFreeze(
    objects
      .map((object) =>
        deepFreeze(buildAssetAssignment(object, relationshipsByObject.get(object.objectId) ?? []))
      )
      .sort(compareBy("objectId"))
  );
}

function buildAssetAssignment(object, objectRelationships) {
  const catalogEntry = resolveRecipeCatalogEntry(object, objectRelationships);
  return {
    objectId: object.objectId,
    objectType: object.realWorldType,
    classification: object.growgoClassification,
    recipeId: catalogEntry.recipeId,
    assetFamily: catalogEntry.assetFamily,
    variantRules: catalogEntry.variantRules,
    lodRules: catalogEntry.lodRules,
    geometryReference: object.geometryReference,
    sourceReference: object.sourceReference
  };
}

function resolveRecipeCatalogEntry(object, relationships) {
  if (object.realWorldType === "HOUSE") {
    return recipeCatalog.HOUSE;
  }
  if (object.realWorldType === "BAKERY") {
    return recipeCatalog.BAKERY;
  }
  if (object.realWorldType === "CAFE") {
    return recipeCatalog.CAFE;
  }
  if (object.realWorldType === "SHOP") {
    return recipeCatalog.SHOP;
  }
  if (object.realWorldType === "PETROL_STATION") {
    return recipeCatalog.PETROL_STATION;
  }
  if (object.realWorldType === "LIBRARY") {
    return recipeCatalog.LIBRARY;
  }
  if (object.realWorldType === "SCHOOL") {
    return recipeCatalog.SCHOOL;
  }
  if (object.realWorldType === "COMMUNITY_BUILDING") {
    return recipeCatalog.COMMUNITY_BUILDING;
  }
  if (object.realWorldType === "PARK") {
    return enhanceCatalogEntry(recipeCatalog.PARK, relationships);
  }
  if (object.realWorldType === "RESERVE") {
    return enhanceCatalogEntry(recipeCatalog.RESERVE, relationships);
  }
  if (object.realWorldType === "OVAL") {
    return enhanceCatalogEntry(recipeCatalog.OVAL, relationships);
  }
  if (object.realWorldType === "RECREATION_AREA") {
    return enhanceCatalogEntry(recipeCatalog.RECREATION_AREA, relationships);
  }
  if (object.realWorldType === "BEACH") {
    return enhanceCatalogEntry(recipeCatalog.BEACH, relationships);
  }
  if (object.realWorldType === "FOREST") {
    return enhanceCatalogEntry(recipeCatalog.FOREST, relationships);
  }
  if (object.realWorldType === "LIGHTHOUSE") {
    return enhanceCatalogEntry(recipeCatalog.LIGHTHOUSE, relationships);
  }
  if (object.realWorldType === "LOOKOUT") {
    return enhanceCatalogEntry(recipeCatalog.LOOKOUT, relationships);
  }
  if (object.realWorldType === "HISTORIC_SITE") {
    return recipeCatalog.HISTORIC_SITE;
  }
  if (object.realWorldType === "RAILWAY_STATION") {
    return enhanceCatalogEntry(recipeCatalog.RAILWAY_STATION, relationships);
  }
  if (object.realWorldType === "FERRY_TERMINAL") {
    return enhanceCatalogEntry(recipeCatalog.FERRY_TERMINAL, relationships);
  }
  if (object.realWorldType === "BUS_STOP") {
    return enhanceCatalogEntry(recipeCatalog.BUS_STOP, relationships);
  }
  if (object.realWorldType === "WAREHOUSE") {
    return enhanceCatalogEntry(recipeCatalog.WAREHOUSE, relationships);
  }
  if (object.realWorldType === "INDUSTRIAL_BUILDING") {
    return enhanceCatalogEntry(recipeCatalog.INDUSTRIAL_BUILDING, relationships);
  }
  if (object.realWorldType === "TRANSPORT_ROUTE") {
    return enhanceCatalogEntry(recipeCatalog.TRANSPORT_ROUTE, relationships);
  }
  if (object.growgoClassification === "LANDMARK") {
    return enhanceCatalogEntry(recipeCatalog.LANDMARK, relationships);
  }
  if (object.growgoClassification === "NATURAL_FEATURE") {
    return enhanceCatalogEntry(recipeCatalog.NATURAL_FEATURE, relationships);
  }
  if (object.growgoClassification === "BUSINESS") {
    return enhanceCatalogEntry(recipeCatalog.CAFE, relationships);
  }
  return enhanceCatalogEntry(recipeCatalog.NATURAL_FEATURE, relationships);
}

function enhanceCatalogEntry(catalogEntry, relationships) {
  const extraVariants = [];
  if (relationships.some((entry) => entry.relationshipType === "waterfront_relationship")) {
    extraVariants.push("waterfront_context");
  }
  if (relationships.some((entry) => entry.relationshipType === "business_area")) {
    extraVariants.push("business_area_context");
  }
  if (relationships.some((entry) => entry.relationshipType === "served_by_road")) {
    extraVariants.push("road_served_context");
  }
  if (relationships.some((entry) => entry.relationshipType === "park_has_trail")) {
    extraVariants.push("trail_connected_context");
  }

  return deepFreeze({
    ...catalogEntry,
    variantRules: deepFreeze([...new Set([...catalogEntry.variantRules, ...extraVariants])].sort())
  });
}

function groupRelationshipsByObject(relationships) {
  const byObject = new Map();
  for (const entry of relationships) {
    if (!byObject.has(entry.fromObjectId)) {
      byObject.set(entry.fromObjectId, []);
    }
    byObject.get(entry.fromObjectId).push(entry);
  }
  return byObject;
}

function buildAssetAssignmentValidation(resolverBase, objects) {
  const objectIds = objects.map((object) => object.objectId).sort();
  const objectMap = new Map(objects.map((object) => [object.objectId, object]));
  const validationWithoutHash = deepFreeze({
    schemaId: atlasAssetAssignmentValidationSchemaId,
    recipeExists: resolverBase.assignments.entries.every(
      (entry) =>
        typeof entry.recipeId === "string" &&
        (entry.recipeId.startsWith("RECIPE_") || entry.recipeId.endsWith("_RECIPE_001"))
    ),
    objectTypeCompatible: resolverBase.assignments.entries.every((entry) =>
      isObjectTypeCompatible(entry, objectMap.get(entry.objectId))
    ),
    geometryPreserved: resolverBase.assignments.entries.every((entry) =>
      stableStringify(entry.geometryReference) ===
      stableStringify(objectMap.get(entry.objectId)?.geometryReference)
    ),
    deterministicAssignment: true,
    validationPassed: true,
    objectIds: deepFreeze(objectIds),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      ...resolverBase,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function isObjectTypeCompatible(assignment, object) {
  if (!object) {
    return false;
  }
  const recipe = assignment.recipeId;
  if (object.realWorldType === "HOUSE") {
    return recipe.includes("RESIDENTIAL_HOUSE");
  }
  if (object.realWorldType === "BAKERY") {
    return recipe.includes("BAKERY");
  }
  if (object.realWorldType === "CAFE") {
    return recipe.includes("CAFE");
  }
  if (object.realWorldType === "SHOP") {
    return recipe.includes("SHOP");
  }
  if (object.realWorldType === "PETROL_STATION") {
    return recipe.includes("FUEL_STATION");
  }
  if (object.realWorldType === "LIBRARY") {
    return recipe.includes("LIBRARY");
  }
  if (object.realWorldType === "SCHOOL") {
    return recipe.includes("SCHOOL");
  }
  if (object.realWorldType === "COMMUNITY_BUILDING") {
    return recipe.includes("COMMUNITY");
  }
  if (object.realWorldType === "PARK") {
    return recipe.includes("PARK");
  }
  if (object.realWorldType === "RESERVE") {
    return recipe.includes("RESERVE");
  }
  if (object.realWorldType === "OVAL") {
    return recipe.includes("OVAL");
  }
  if (object.realWorldType === "RECREATION_AREA") {
    return recipe.includes("RECREATION");
  }
  if (object.realWorldType === "BEACH") {
    return recipe.includes("BEACH");
  }
  if (object.realWorldType === "FOREST") {
    return recipe.includes("FOREST");
  }
  if (object.realWorldType === "LIGHTHOUSE") {
    return recipe.includes("LIGHTHOUSE");
  }
  if (object.realWorldType === "LOOKOUT") {
    return recipe.includes("LOOKOUT");
  }
  if (object.realWorldType === "HISTORIC_SITE") {
    return recipe.includes("HISTORIC_SITE");
  }
  if (object.realWorldType === "RAILWAY_STATION") {
    return recipe.includes("RAILWAY_STATION");
  }
  if (object.realWorldType === "FERRY_TERMINAL") {
    return recipe.includes("FERRY_TERMINAL");
  }
  if (object.realWorldType === "BUS_STOP") {
    return recipe.includes("BUS_STOP");
  }
  if (object.realWorldType === "WAREHOUSE") {
    return recipe.includes("WAREHOUSE");
  }
  if (object.realWorldType === "INDUSTRIAL_BUILDING") {
    return recipe.includes("INDUSTRIAL");
  }
  return recipe.startsWith("RECIPE_");
}

function buildValidationSignatureSource(resolver) {
  return {
    assignments: resolver.assignments?.entries?.map((entry) => ({
      objectId: entry.objectId,
      classification: entry.classification,
      recipeId: entry.recipeId,
      assetFamily: entry.assetFamily,
      variantRules: entry.variantRules,
      lodRules: entry.lodRules
    })) ?? [],
    validationFlags: resolver.validation
      ? {
          recipeExists: resolver.validation.recipeExists,
          objectTypeCompatible: resolver.validation.objectTypeCompatible,
          geometryPreserved: resolver.validation.geometryPreserved,
          deterministicAssignment: resolver.validation.deterministicAssignment,
          validationPassed: resolver.validation.validationPassed
        }
      : null
  };
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function assertPresent(value, message) {
  if (value === null || value === undefined) {
    throw createValidationError("missing_required_value", message);
  }
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicSignatureHash(value) {
  const stable = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
