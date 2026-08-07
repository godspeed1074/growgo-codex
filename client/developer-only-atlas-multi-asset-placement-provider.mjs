import {
  createDeveloperOnlyAtlasAssetRegistry,
  getDeveloperOnlyAtlasAssetRegistryStatus,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MULTI_ASSET_PLACEMENT_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MULTI_ASSET_PLACEMENT_RESULT_001";
const BATCH_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MULTI_ASSET_BATCH_001";

const SUPPORTED_LODS = new Set(["close", "gameplay", "map"]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }

  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  return fn;
}

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype
  );
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }

  return fallback;
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const left = (h2 >>> 0).toString(16).padStart(8, "0");
  const right = (h1 >>> 0).toString(16).padStart(8, "0");
  return `${left}${right}`;
}

function hashFraction(seed) {
  const slice = hashString(seed).slice(0, 13);
  const numerator = Number.parseInt(slice, 16);
  const denominator = 0x1fffffffffffff;
  return denominator === 0 ? 0 : numerator / denominator;
}

function validateCoordinate(coordinate) {
  const latitude = Number(coordinate?.latitude);
  const longitude = Number(coordinate?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error("MISSING_GEOGRAPHIC_COORDINATE"), {
      reasonCode: "MISSING_GEOGRAPHIC_COORDINATE"
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw Object.assign(new Error("INVALID_GEOGRAPHIC_COORDINATE"), {
      reasonCode: "INVALID_GEOGRAPHIC_COORDINATE"
    });
  }

  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function defaultProjectCoordinate({ geographicCoordinate, registryEntry }) {
  const baseX = Number((geographicCoordinate.longitude * 1000).toFixed(3));
  const baseY = Number((-geographicCoordinate.latitude * 1000).toFixed(3));
  const classOffset =
    registryEntry.placementRules.placementClass === "building" ? 25 : 0;

  return {
    x: Number((baseX + classOffset).toFixed(3)),
    y: baseY,
    projectionPath: "deterministic_multi_asset_projection_v1"
  };
}

function normalizeInput(input = {}) {
  return deepFreeze({
    assetId: sanitizeString(input.assetId),
    version: sanitizeString(input.version),
    coordinate: validateCoordinate(input.coordinate),
    regionId: sanitizeString(input.regionId),
    packageId: sanitizeString(input.packageId),
    recipeId: sanitizeString(input.recipeId),
    selectorSeed: sanitizeString(input.selectorSeed)
  });
}

function createInstanceId(input, registryEntry) {
  return `ATLAS_ASSET_INSTANCE_${hashString(
    stableSerialize({
      assetId: input.assetId,
      version: input.version,
      coordinate: input.coordinate,
      regionId: input.regionId,
      packageId: input.packageId,
      recipeId: input.recipeId,
      selectorSeed: input.selectorSeed,
      placementClass: registryEntry.placementRules.placementClass
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;
}

function computeScale(instanceId, scaleRules) {
  if (scaleRules.mode === "seeded_range") {
    const fraction = hashFraction(`${instanceId}:scale`);
    return Number(
      (
        Number(scaleRules.min) +
        (Number(scaleRules.max) - Number(scaleRules.min)) * fraction
      ).toFixed(4)
    );
  }

  throw Object.assign(new Error("INVALID_SCALE_RULE"), {
    reasonCode: "INVALID_SCALE_RULE"
  });
}

function computeRotation(instanceId, rotationRules) {
  if (rotationRules.mode === "seeded_degrees") {
    const fraction = hashFraction(`${instanceId}:rotation`);
    const min = Number(rotationRules.min);
    const max = Number(rotationRules.max);
    return Number((min + (max - min) * fraction).toFixed(3));
  }

  if (rotationRules.mode === "cardinal_degrees") {
    const values = rotationRules.values ?? [];
    const index = Math.floor(hashFraction(`${instanceId}:rotation`) * values.length);
    return Number(values[index % values.length]);
  }

  throw Object.assign(new Error("INVALID_ROTATION_RULE"), {
    reasonCode: "INVALID_ROTATION_RULE"
  });
}

function computeLod(instanceId, lodRules) {
  if (lodRules.mode === "fixed") {
    const lod = sanitizeString(lodRules.value);
    if (!SUPPORTED_LODS.has(lod)) {
      throw Object.assign(new Error("INVALID_LOD_RULE"), {
        reasonCode: "INVALID_LOD_RULE"
      });
    }
    return lod;
  }

  throw Object.assign(new Error("INVALID_LOD_RULE"), {
    reasonCode: "INVALID_LOD_RULE"
  });
}

function validatePlacementContext(input, registryEntry) {
  if (input.version !== registryEntry.assetVersion) {
    throw Object.assign(new Error("INVALID_ASSET_VERSION"), {
      reasonCode: "INVALID_ASSET_VERSION"
    });
  }

  if (!input.regionId || !registryEntry.approvedRegions.includes(input.regionId)) {
    throw Object.assign(new Error("INVALID_REGION_ID"), {
      reasonCode: "INVALID_REGION_ID"
    });
  }

  if (!input.packageId || !registryEntry.approvedPackages.includes(input.packageId)) {
    throw Object.assign(new Error("INVALID_PACKAGE_ID"), {
      reasonCode: "INVALID_PACKAGE_ID"
    });
  }

  if (!input.recipeId || !registryEntry.approvedRecipeIds.includes(input.recipeId)) {
    throw Object.assign(new Error("INVALID_RECIPE_ID"), {
      reasonCode: "INVALID_RECIPE_ID"
    });
  }

  if (!input.selectorSeed) {
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }
}

function validatePlacementRules(registryEntry, input) {
  const placementClass = registryEntry.placementRules.placementClass;

  if (placementClass === "vegetation") {
    if (registryEntry.performanceBudget.lightweightReferenceOnly !== true) {
      throw Object.assign(new Error("INVALID_VEGETATION_REFERENCE_MODE"), {
        reasonCode: "INVALID_VEGETATION_REFERENCE_MODE"
      });
    }
    return;
  }

  if (placementClass === "building") {
    if ((registryEntry.placementRules.footprintRadius ?? 0) < 5) {
      throw Object.assign(new Error("INVALID_BUILDING_FOOTPRINT_RULE"), {
        reasonCode: "INVALID_BUILDING_FOOTPRINT_RULE"
      });
    }
    if (
      registryEntry.rotationRules.mode !== "cardinal_degrees" ||
      !Array.isArray(registryEntry.rotationRules.values) ||
      registryEntry.rotationRules.values.length === 0
    ) {
      throw Object.assign(new Error("INVALID_BUILDING_ROTATION_RULE"), {
        reasonCode: "INVALID_BUILDING_ROTATION_RULE"
      });
    }
    if (!input.recipeId) {
      throw Object.assign(new Error("INVALID_RECIPE_ID"), {
        reasonCode: "INVALID_RECIPE_ID"
      });
    }
    return;
  }

  if (placementClass === "landmark") {
    return;
  }

  throw Object.assign(new Error("INVALID_PLACEMENT_CLASS"), {
    reasonCode: "INVALID_PLACEMENT_CLASS"
  });
}

function sanitizeSubmissionResult(result) {
  return {
    accepted:
      result?.accepted === true ||
      result?.renderAccepted === true ||
      result?.drawAccepted === true,
    reasonCode: sanitizeString(result?.reasonCode) ?? "ATLAS_RENDER_COMMAND_ACCEPTED"
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    registryVersion: state.registryVersion,
    registeredAssetCount: state.registeredAssetCount,
    resolvedAssetCount: state.resolvedAssetCount,
    rejectedAssetCount: state.rejectedAssetCount,
    lastResolvedAssetId: state.lastResolvedAssetId,
    lastFailureReason: state.lastFailureReason,
    batchCommandCount: state.batchCommandCount,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasMultiAssetPlacementProvider({
  registry = createDeveloperOnlyAtlasAssetRegistry(),
  atlasRenderSubmissionProvider = unavailable("ATLAS_RENDER_SUBMISSION_UNAVAILABLE"),
  coordinateProjectionProvider = defaultProjectCoordinate
} = {}) {
  const registryStatus = getDeveloperOnlyAtlasAssetRegistryStatus(registry);

  const state = {
    registryVersion: registryStatus.registryVersion,
    registeredAssetCount: registryStatus.registeredAssetCount,
    resolvedAssetCount: 0,
    rejectedAssetCount: 0,
    lastResolvedAssetId: null,
    lastFailureReason: null,
    batchCommandCount: 0
  };

  const internal = {
    registry,
    atlasRenderSubmissionProvider,
    coordinateProjectionProvider,
    lastResolved: [],
    lastBatch: null
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasMultiAssetPlacementProvider: true,
    __state: state,
    __internal: internal
  });
}

function requireProvider(provider) {
  if (
    !provider?.__growgoDeveloperOnlyAtlasMultiAssetPlacementProvider ||
    !provider.__state ||
    !provider.__internal
  ) {
    throw Object.assign(new Error("ATLAS_MULTI_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "ATLAS_MULTI_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE"
    });
  }

  return provider;
}

export function resolveDeveloperOnlyAtlasMultiAssetPlacement(provider, input = {}) {
  requireProvider(provider);
  const state = provider.__state;
  const internal = provider.__internal;

  try {
    const normalizedInput = normalizeInput(input);
    const registryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
      internal.registry,
      normalizedInput.assetId
    );

    validatePlacementContext(normalizedInput, registryEntry);
    validatePlacementRules(registryEntry, normalizedInput);

    const instanceId = createInstanceId(normalizedInput, registryEntry);
    const position = internal.coordinateProjectionProvider({
      geographicCoordinate: normalizedInput.coordinate,
      registryEntry,
      regionId: normalizedInput.regionId,
      packageId: normalizedInput.packageId,
      recipeId: normalizedInput.recipeId
    });
    const scale = computeScale(instanceId, registryEntry.scaleRules);
    const rotation = computeRotation(instanceId, registryEntry.rotationRules);
    const lod = computeLod(instanceId, registryEntry.lodRules);

    const renderCommand = deepFreeze({
      assetId: registryEntry.assetId,
      instanceId,
      position: deepFreeze({
        x: Number(position.x),
        y: Number(position.y)
      }),
      scale,
      rotation,
      lod
    });

    const result = deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      assetId: registryEntry.assetId,
      assetVersion: registryEntry.assetVersion,
      assetCategory: registryEntry.assetCategory,
      assetFamily: registryEntry.assetFamily,
      assetReferenceId: registryEntry.assetReferenceId,
      placementClass: registryEntry.placementRules.placementClass,
      instanceId,
      position: renderCommand.position,
      scale,
      rotation,
      lod,
      renderCommand,
      selectorSeed: normalizedInput.selectorSeed,
      regionId: normalizedInput.regionId,
      packageId: normalizedInput.packageId,
      recipeId: normalizedInput.recipeId,
      projectionPath:
        sanitizeString(position.projectionPath) ??
        "deterministic_multi_asset_projection_v1"
    });

    internal.lastResolved = [...internal.lastResolved, result];
    state.resolvedAssetCount += 1;
    state.lastResolvedAssetId = registryEntry.assetId;
    state.lastFailureReason = null;
    return result;
  } catch (error) {
    state.rejectedAssetCount += 1;
    state.lastFailureReason = toReasonCode(error, "ATLAS_MULTI_ASSET_PLACEMENT_FAILED");
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason
    });
  }
}

export function createDeveloperOnlyAtlasAssetBatch(provider, inputs = []) {
  requireProvider(provider);
  const resolved = inputs.map((input) =>
    resolveDeveloperOnlyAtlasMultiAssetPlacement(provider, input)
  );

  const deduped = new Map();
  for (const placement of resolved) {
    deduped.set(placement.instanceId, placement);
  }

  const ordered = [...deduped.values()].sort((left, right) => {
    if (left.instanceId === right.instanceId) {
      return left.assetId.localeCompare(right.assetId);
    }
    return left.instanceId.localeCompare(right.instanceId);
  });

  const commands = ordered.map((placement) => placement.renderCommand);
  const batchId = `ATLAS_ASSET_BATCH_${hashString(
    stableSerialize(commands)
  )
    .slice(0, 16)
    .toUpperCase()}`;

  provider.__state.batchCommandCount = commands.length;
  provider.__internal.lastBatch = deepFreeze({
    schemaId: BATCH_SCHEMA_ID,
    batchId,
    commands: deepFreeze(commands)
  });

  return provider.__internal.lastBatch;
}

export function submitDeveloperOnlyAtlasAssetBatch(provider, batch = null) {
  requireProvider(provider);
  const internal = provider.__internal;
  const state = provider.__state;

  const targetBatch = batch ?? internal.lastBatch;
  if (!targetBatch?.commands || !Array.isArray(targetBatch.commands)) {
    state.lastFailureReason = "ASSET_BATCH_UNAVAILABLE";
    throw Object.assign(new Error("ASSET_BATCH_UNAVAILABLE"), {
      reasonCode: "ASSET_BATCH_UNAVAILABLE"
    });
  }

  if (!isAvailableFunction(internal.atlasRenderSubmissionProvider)) {
    state.lastFailureReason = "ATLAS_RENDER_SUBMISSION_UNAVAILABLE";
    throw Object.assign(new Error("ATLAS_RENDER_SUBMISSION_UNAVAILABLE"), {
      reasonCode: "ATLAS_RENDER_SUBMISSION_UNAVAILABLE"
    });
  }

  const submission = sanitizeSubmissionResult(
    internal.atlasRenderSubmissionProvider(targetBatch)
  );

  if (submission.accepted !== true) {
    state.lastFailureReason = submission.reasonCode;
    throw Object.assign(new Error(submission.reasonCode), {
      reasonCode: submission.reasonCode
    });
  }

  state.lastFailureReason = null;
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    accepted: true,
    reasonCode: submission.reasonCode,
    batchId: targetBatch.batchId,
    commandCount: targetBatch.commands.length
  });
}

export function getDeveloperOnlyAtlasMultiAssetPlacementStatus(provider) {
  try {
    requireProvider(provider);
  } catch {
    return freezeStatus({
      registryVersion: null,
      registeredAssetCount: 0,
      resolvedAssetCount: 0,
      rejectedAssetCount: 0,
      lastResolvedAssetId: null,
      lastFailureReason: "ATLAS_MULTI_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE",
      batchCommandCount: 0
    });
  }

  return freezeStatus(provider.__state);
}
