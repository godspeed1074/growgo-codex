import {
  atlasCompatibleRecipeIds,
  natureAssetPackRecipes
} from "./asset-registry.mjs";

export const assetFactoryPackPrioritySystemSchemaId =
  "ASSET_FACTORY_PACK_PRIORITY_SYSTEM_001";
export const assetFactoryPackPriorityValidationSchemaId =
  "ASSET_FACTORY_PACK_PRIORITY_VALIDATION_001";

const atlasDemandRecipeRecords = deepFreeze([
  recipeDemand("RECIPE_TRANSPORT_ROUTE_STANDARD_001", "ROAD_AND_STREET", "Atlas transport route"),
  recipeDemand("RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001", "RESIDENTIAL", "Atlas house"),
  recipeDemand("RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001", "RESIDENTIAL", "Atlas residential garden"),
  recipeDemand("RECIPE_BUILDING_BAKERY_SMALL_TOWN_001", "COMMERCIAL", "Atlas bakery"),
  recipeDemand("RECIPE_BUILDING_CAFE_COASTAL_001", "COMMERCIAL", "Atlas cafe"),
  recipeDemand("RECIPE_BUILDING_FUEL_STATION_STANDARD_001", "COMMERCIAL", "Atlas petrol station"),
  recipeDemand("RECIPE_BUILDING_SHOP_STANDARD_001", "COMMERCIAL", "Atlas shop"),
  recipeDemand("LIBRARY_RECIPE_001", "CIVIC", "Atlas library"),
  recipeDemand("SCHOOL_RECIPE_001", "CIVIC", "Atlas school"),
  recipeDemand("COMMUNITY_BUILDING_RECIPE_001", "CIVIC", "Atlas community building"),
  recipeDemand("SPORTS_OVAL_RECIPE_001", "CIVIC", "Atlas sports oval"),
  recipeDemand("RECREATION_AREA_RECIPE_001", "CIVIC", "Atlas recreation area"),
  recipeDemand("RAILWAY_STATION_RECIPE_001", "TRANSPORT", "Atlas railway station"),
  recipeDemand("FERRY_TERMINAL_RECIPE_001", "TRANSPORT", "Atlas ferry terminal"),
  recipeDemand("BUS_STOP_RECIPE_001", "TRANSPORT", "Atlas bus stop"),
  recipeDemand("BEACH_RECIPE_001", "NATURAL", "Atlas beach"),
  recipeDemand("RESERVE_RECIPE_001", "NATURAL", "Atlas reserve"),
  recipeDemand("FOREST_RECIPE_001", "NATURAL", "Atlas forest"),
  recipeDemand("RECIPE_TREATMENT_PARK_STANDARD_001", "NATURAL", "Atlas park"),
  recipeDemand("WAREHOUSE_RECIPE_001", "INDUSTRIAL", "Atlas warehouse"),
  recipeDemand("INDUSTRIAL_BUILDING_RECIPE_001", "INDUSTRIAL", "Atlas industrial building")
]);

const packBlueprints = deepFreeze([
  deepFreeze({
    packId: "ROAD_AND_STREET_PACK_001",
    includedAssetScopes: deepFreeze([
      "roads",
      "sidewalks",
      "crossings",
      "street_lights",
      "signs",
      "street_furniture"
    ]),
    atlasDemandSources: deepFreeze([
      "ATLAS_OBJECT_RELATIONSHIP_LAYER_001:served_by_road",
      "ATLAS_STREET_SCENE_COMPOSITION_LAYER_001:road_layout_reference",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_TRANSPORT_ROUTE_STANDARD_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:BUS_STOP_RECIPE_001"
    ]),
    recipeDependencies: deepFreeze([
      "RECIPE_TRANSPORT_ROUTE_STANDARD_001",
      "BUS_STOP_RECIPE_001"
    ]),
    estimatedReuseValue: 10
  }),
  deepFreeze({
    packId: "RESIDENTIAL_PACK_001",
    includedAssetScopes: deepFreeze([
      "houses",
      "townhouses",
      "apartments",
      "gardens",
      "fences"
    ]),
    atlasDemandSources: deepFreeze([
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
      "ATLAS_ENVIRONMENT_PREVIEW_LAYER_001:RESIDENTIAL_AREA_PREVIEW",
      "ATLAS_STREET_SCENE_COMPOSITION_LAYER_001:SUBURBAN_STREET_SCENE"
    ]),
    recipeDependencies: deepFreeze([
      "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
      "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001"
    ]),
    estimatedReuseValue: 10
  }),
  deepFreeze({
    packId: "COMMERCIAL_PACK_001",
    includedAssetScopes: deepFreeze([
      "bakery",
      "cafe",
      "restaurant",
      "petrol_station",
      "shops"
    ]),
    atlasDemandSources: deepFreeze([
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_BUILDING_CAFE_COASTAL_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_BUILDING_FUEL_STATION_STANDARD_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECIPE_BUILDING_SHOP_STANDARD_001"
    ]),
    recipeDependencies: deepFreeze([
      "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
      "RECIPE_BUILDING_CAFE_COASTAL_001",
      "RECIPE_BUILDING_FUEL_STATION_STANDARD_001",
      "RECIPE_BUILDING_SHOP_STANDARD_001"
    ]),
    estimatedReuseValue: 9
  }),
  deepFreeze({
    packId: "CIVIC_PACK_001",
    includedAssetScopes: deepFreeze([
      "schools",
      "libraries",
      "community_buildings",
      "sports_facilities"
    ]),
    atlasDemandSources: deepFreeze([
      "ATLAS_ASSET_RECIPE_RESOLVER_001:SCHOOL_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:LIBRARY_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:COMMUNITY_BUILDING_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:SPORTS_OVAL_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RECREATION_AREA_RECIPE_001"
    ]),
    recipeDependencies: deepFreeze([
      "SCHOOL_RECIPE_001",
      "LIBRARY_RECIPE_001",
      "COMMUNITY_BUILDING_RECIPE_001",
      "SPORTS_OVAL_RECIPE_001",
      "RECREATION_AREA_RECIPE_001"
    ]),
    estimatedReuseValue: 8
  }),
  deepFreeze({
    packId: "TRANSPORT_PACK_001",
    includedAssetScopes: deepFreeze([
      "railway",
      "stations",
      "buses",
      "boats"
    ]),
    atlasDemandSources: deepFreeze([
      "ATLAS_ASSET_RECIPE_RESOLVER_001:RAILWAY_STATION_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:FERRY_TERMINAL_RECIPE_001",
      "ATLAS_ASSET_RECIPE_RESOLVER_001:BUS_STOP_RECIPE_001",
      "ATLAS_RENDERER_HANDOFF_LAYER_001:ROAD_LAYER"
    ]),
    recipeDependencies: deepFreeze([
      "RAILWAY_STATION_RECIPE_001",
      "FERRY_TERMINAL_RECIPE_001",
      "BUS_STOP_RECIPE_001",
      "RECIPE_TRANSPORT_ROUTE_STANDARD_001"
    ]),
    estimatedReuseValue: 8
  })
]);

export function createAssetFactoryPackPrioritySystem() {
  const knownRecipeIds = buildKnownRecipeIds();
  const packs = packBlueprints
    .map((blueprint) => buildPackRecord(blueprint, knownRecipeIds))
    .sort(comparePackPriority);

  const systemBase = deepFreeze({
    schemaId: assetFactoryPackPrioritySystemSchemaId,
    systemId: "ASSET_FACTORY_PACK_PRIORITY_SYSTEM_001_DEFAULT",
    packs: deepFreeze(packs),
    knownRecipeIds: deepFreeze([...knownRecipeIds].sort()),
    atlasDemandRecipes: deepFreeze(structuredClone(atlasDemandRecipeRecords)),
    validation: null,
    getPackById(packId) {
      return this.packs.find((pack) => pack.packId === packId) ?? null;
    },
    listPacksByPriority() {
      return [...this.packs];
    }
  });

  const validation = buildPackPriorityValidation(systemBase);
  const system = deepFreeze({
    ...systemBase,
    validation
  });

  const checked = validateAssetFactoryPackPrioritySystem(system);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return system;
}

export function validateAssetFactoryPackPrioritySystem(rawSystem) {
  try {
    if (rawSystem?.schemaId !== assetFactoryPackPrioritySystemSchemaId) {
      throw createValidationError(
        "invalid_asset_factory_pack_priority_schema",
        `Expected ${assetFactoryPackPrioritySystemSchemaId} but received ${rawSystem?.schemaId}.`
      );
    }

    assertPresent(rawSystem.packs, "Pack priority records are required.");
    assertPresent(rawSystem.validation, "Pack priority validation is required.");

    if (!Array.isArray(rawSystem.packs) || rawSystem.packs.length === 0) {
      throw createValidationError(
        "invalid_asset_factory_pack_priority_entries",
        "Pack priority system must expose a non-empty pack list."
      );
    }

    for (const pack of rawSystem.packs) {
      assertPresent(pack.packId, "Pack ID is required.");
      assertPresent(pack.priorityScore, "Pack priority score is required.");
      assertPresent(pack.recipeDependencies, "Pack recipe dependencies are required.");
      assertPresent(pack.atlasDemandSources, "Pack Atlas demand sources are required.");
      assertPresent(pack.estimatedReuseValue, "Pack estimated reuse value is required.");
    }

    for (const key of [
      "uniquePackIds",
      "recipeLinksValid",
      "prioritiesDeterministic",
      "validationPassed"
    ]) {
      if (rawSystem.validation[key] !== true) {
        throw createValidationError(
          "asset_factory_pack_priority_validation_failed",
          `Asset Factory pack priority validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(
      buildValidationSignatureSource(rawSystem)
    );
    if (expectedHash !== rawSystem.validation.deterministicPriorityHash) {
      throw createValidationError(
        "asset_factory_pack_priority_hash_mismatch",
        "Pack priority deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryPackPrioritySystem: rawSystem
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_pack_priority_validation_failed",
      message: error.message,
      assetFactoryPackPrioritySystem: null
    });
  }
}

function buildKnownRecipeIds() {
  const known = new Set(atlasCompatibleRecipeIds);
  for (const recipe of natureAssetPackRecipes) {
    known.add(recipe.recipeId);
  }
  for (const recipe of atlasDemandRecipeRecords) {
    known.add(recipe.recipeId);
  }
  return known;
}

function buildPackRecord(blueprint, knownRecipeIds) {
  const coveredRecipeCount = blueprint.recipeDependencies.filter((recipeId) =>
    atlasCompatibleRecipeIds.includes(recipeId)
  ).length;
  const unmetRecipeDependencies = blueprint.recipeDependencies.filter(
    (recipeId) => !atlasCompatibleRecipeIds.includes(recipeId)
  );
  const knownDemandCount = blueprint.recipeDependencies.filter((recipeId) =>
    knownRecipeIds.has(recipeId)
  ).length;
  const priorityScore =
    unmetRecipeDependencies.length * 30 +
    blueprint.atlasDemandSources.length * 6 +
    blueprint.estimatedReuseValue * 4 +
    (blueprint.recipeDependencies.length - coveredRecipeCount) * 3 +
    knownDemandCount;

  return deepFreeze({
    packId: blueprint.packId,
    includedAssetScopes: blueprint.includedAssetScopes,
    priorityScore,
    atlasDemandSources: blueprint.atlasDemandSources,
    recipeDependencies: blueprint.recipeDependencies,
    estimatedReuseValue: blueprint.estimatedReuseValue,
    coverageSummary: deepFreeze({
      coveredRecipeCount,
      unmetRecipeCount: unmetRecipeDependencies.length,
      unmetRecipeDependencies: deepFreeze(unmetRecipeDependencies)
    })
  });
}

function buildPackPriorityValidation(system) {
  const uniquePackIds = new Set(system.packs.map((pack) => pack.packId)).size === system.packs.length;
  const recipeLinksValid = system.packs.every((pack) =>
    pack.recipeDependencies.every((recipeId) => system.knownRecipeIds.includes(recipeId))
  );
  const sortedPackIds = [...system.packs]
    .sort(comparePackPriority)
    .map((pack) => pack.packId);
  const currentPackIds = system.packs.map((pack) => pack.packId);
  const prioritiesDeterministic =
    stableStringify(sortedPackIds) === stableStringify(currentPackIds);

  const validationBase = deepFreeze({
    schemaId: assetFactoryPackPriorityValidationSchemaId,
    uniquePackIds,
    recipeLinksValid,
    prioritiesDeterministic,
    validationPassed: uniquePackIds && recipeLinksValid && prioritiesDeterministic,
    deterministicPriorityHash: null
  });

  return deepFreeze({
    ...validationBase,
    deterministicPriorityHash: computeDeterministicHash(
      buildValidationSignatureSource({
        ...system,
        validation: validationBase
      })
    )
  });
}

function buildValidationSignatureSource(system) {
  return {
    packs: system.packs.map((pack) => ({
      packId: pack.packId,
      priorityScore: pack.priorityScore,
      atlasDemandSources: pack.atlasDemandSources,
      recipeDependencies: pack.recipeDependencies,
      estimatedReuseValue: pack.estimatedReuseValue,
      coverageSummary: pack.coverageSummary
    })),
    validation: system.validation
      ? {
          uniquePackIds: system.validation.uniquePackIds,
          recipeLinksValid: system.validation.recipeLinksValid,
          prioritiesDeterministic: system.validation.prioritiesDeterministic,
          validationPassed: system.validation.validationPassed
        }
      : null
  };
}

function recipeDemand(recipeId, category, rationale) {
  return deepFreeze({
    recipeId,
    category,
    rationale
  });
}

function comparePackPriority(left, right) {
  if (right.priorityScore !== left.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }
  return String(left.packId).localeCompare(String(right.packId));
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

function computeDeterministicHash(value) {
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
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}
