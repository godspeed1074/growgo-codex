const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_PLACEMENT_PROVIDER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_PLACEMENT_PROVIDER_RESULT_001";

const DEFAULT_APPROVED_REGIONS = Object.freeze(["BELLARINE"]);
const DEFAULT_APPROVED_PACKAGES = Object.freeze(["ATLAS_DEVELOPER_PACKAGE"]);
const SUPPORTED_LODS = new Set(["close", "gameplay", "map"]);

const DEFAULT_APPROVED_ASSET_REGISTRY = Object.freeze({
  TREE_EUCALYPTUS_001: Object.freeze({
    assetId: "TREE_EUCALYPTUS_001",
    assetVersion: "v001",
    assetCategory: "nature",
    familyId: "COASTAL_NATURE_FAMILY_001",
    recipeId: "TREE_EUCALYPTUS_RECIPE_001",
    atlasCompatibility: Object.freeze({
      atlasCompatible: true,
      lightweightRendering: true,
      reusableAssetReference: true
    }),
    dependencyReferences: Object.freeze([
      Object.freeze({
        dependencyId: "MOD_TREE_LEAF_CLUSTER_001",
        category: "module",
        identityPolicy: "DEPENDENCY_DECLARED_ONLY"
      })
    ]),
    lods: Object.freeze({
      close: Object.freeze({
        triangleCount: 249,
        relativePath:
          "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
        sha256:
          "862be6bc5e365dad75c55fbe0877ca3b246972a1bea123a1c75aea6b3a5b9725"
      }),
      gameplay: Object.freeze({
        triangleCount: 153,
        relativePath:
          "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
        sha256:
          "ac3487f5be6131e0eaec66f6e431a148efb9266348ac5aa339e3547b46868f49"
      }),
      map: Object.freeze({
        triangleCount: 77,
        relativePath:
          "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_MAP.glb",
        sha256:
          "94a90a141a6eae569e8ceaf65a12608121abe25d0d59236fb553c9a462097a55"
      })
    }),
    assetReferenceId: "TREE_EUCALYPTUS_001@v001",
    assetReferenceHash:
      "7d3d8df1c555885e83b295b95a40689c81cc0297f0079c8bca4551842d7faf29"
  })
});

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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    providerReady: state.providerReady,
    assetId: state.assetId,
    instanceId: state.instanceId,
    placementStatus: state.placementStatus,
    resolverStatus: state.resolverStatus,
    deterministicSeed: state.deterministicSeed,
    lodSelected: state.lodSelected,
    renderCommandCreated: state.renderCommandCreated,
    renderSubmissionAccepted: state.renderSubmissionAccepted,
    assetReferenceId: state.assetReferenceId,
    projectionPath: state.projectionPath,
    resolverAttemptCount: state.resolverAttemptCount,
    resolverCompletedCount: state.resolverCompletedCount,
    renderSubmissionAttemptCount: state.renderSubmissionAttemptCount,
    renderSubmissionCompletedCount: state.renderSubmissionCompletedCount,
    cleanupAttemptCount: state.cleanupAttemptCount,
    cleanupCompletedCount: state.cleanupCompletedCount,
    failureReason: state.failureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function defaultProjectCoordinate({ geographicCoordinate }) {
  return {
    x: Number(geographicCoordinate.longitude.toFixed(6)) * 1000,
    y: Number((-geographicCoordinate.latitude).toFixed(6)) * 1000,
    projectionPath: "deterministic_coordinate_projection_v1"
  };
}

function validateCoordinate(geographicCoordinate) {
  const latitude = Number(geographicCoordinate?.latitude);
  const longitude = Number(geographicCoordinate?.longitude);

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

function normalizeScaleRule(scaleRule) {
  if (scaleRule === "atlas_eucalyptus_scale_v1") {
    return deepFreeze({
      mode: "seeded_range",
      min: 0.92,
      max: 1.08
    });
  }

  if (
    isPlainObject(scaleRule) &&
    scaleRule.mode === "seeded_range" &&
    Number.isFinite(scaleRule.min) &&
    Number.isFinite(scaleRule.max) &&
    Number(scaleRule.max) >= Number(scaleRule.min)
  ) {
    return deepFreeze({
      mode: "seeded_range",
      min: Number(scaleRule.min),
      max: Number(scaleRule.max)
    });
  }

  throw Object.assign(new Error("INVALID_SCALE_RULE"), {
    reasonCode: "INVALID_SCALE_RULE"
  });
}

function normalizeRotationRule(rotationRule) {
  if (rotationRule === "atlas_seeded_rotation_v1") {
    return deepFreeze({
      mode: "seeded_degrees",
      min: 0,
      max: 360
    });
  }

  if (
    isPlainObject(rotationRule) &&
    rotationRule.mode === "seeded_degrees" &&
    Number.isFinite(rotationRule.min) &&
    Number.isFinite(rotationRule.max) &&
    Number(rotationRule.max) >= Number(rotationRule.min)
  ) {
    return deepFreeze({
      mode: "seeded_degrees",
      min: Number(rotationRule.min),
      max: Number(rotationRule.max)
    });
  }

  throw Object.assign(new Error("INVALID_ROTATION_RULE"), {
    reasonCode: "INVALID_ROTATION_RULE"
  });
}

function normalizeLodRule(lodRule) {
  if (lodRule === "atlas_eucalyptus_lod_v1") {
    return deepFreeze({
      mode: "fixed",
      value: "gameplay"
    });
  }

  if (
    isPlainObject(lodRule) &&
    lodRule.mode === "fixed" &&
    SUPPORTED_LODS.has(sanitizeString(lodRule.value))
  ) {
    return deepFreeze({
      mode: "fixed",
      value: sanitizeString(lodRule.value)
    });
  }

  throw Object.assign(new Error("INVALID_LOD_RULE"), {
    reasonCode: "INVALID_LOD_RULE"
  });
}

function computeScale(seed, rule) {
  const fraction = hashFraction(`${seed}:scale`);
  return Number((rule.min + (rule.max - rule.min) * fraction).toFixed(4));
}

function computeRotation(seed, rule) {
  const fraction = hashFraction(`${seed}:rotation`);
  const range = rule.max - rule.min;
  const value = range <= 0 ? rule.min : rule.min + range * fraction;
  return Number((value % 360).toFixed(3));
}

function computeLod(seed, rule, assetRecord) {
  if (rule.mode === "fixed") {
    return rule.value;
  }

  const lodOrder = Object.keys(assetRecord.lods);
  return lodOrder[Math.floor(hashFraction(`${seed}:lod`) * lodOrder.length)] ?? "gameplay";
}

function createAssetInputFingerprint(input) {
  return hashString(
    stableSerialize({
      assetId: input.assetId,
      assetVersion: input.assetVersion,
      assetCategory: input.assetCategory,
      geographicCoordinate: input.geographicCoordinate,
      regionId: input.regionId,
      packageId: input.packageId,
      recipeId: input.recipeId,
      deterministicSeed: input.deterministicSeed
    })
  );
}

function createInstanceId(input) {
  return `ATLAS_ASSET_INSTANCE_${createAssetInputFingerprint(input).slice(0, 16).toUpperCase()}`;
}

function sanitizeSubmissionResult(result) {
  return {
    accepted:
      result?.accepted === true ||
      result?.renderAccepted === true ||
      result?.drawAccepted === true,
    reasonCode: sanitizeString(result?.reasonCode) ?? "RENDER_COMMAND_ACCEPTED"
  };
}

export function createDeveloperOnlyAtlasAssetPlacementProvider({
  assetRegistry = DEFAULT_APPROVED_ASSET_REGISTRY,
  approvedRegions = DEFAULT_APPROVED_REGIONS,
  approvedPackages = DEFAULT_APPROVED_PACKAGES,
  atlasRenderSubmissionProvider = unavailable("ATLAS_RENDER_SUBMISSION_UNAVAILABLE"),
  coordinateProjectionProvider = defaultProjectCoordinate
} = {}) {
  const state = {
    providerReady:
      assetRegistry != null && typeof assetRegistry === "object" && assetRegistry.TREE_EUCALYPTUS_001 != null,
    assetId: null,
    instanceId: null,
    placementStatus: "idle",
    resolverStatus: "idle",
    deterministicSeed: null,
    lodSelected: null,
    renderCommandCreated: false,
    renderSubmissionAccepted: false,
    assetReferenceId: null,
    projectionPath: null,
    resolverAttemptCount: 0,
    resolverCompletedCount: 0,
    renderSubmissionAttemptCount: 0,
    renderSubmissionCompletedCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompletedCount: 0,
    failureReason: null
  };

  const internal = {
    assetRegistry,
    approvedRegions: new Set(approvedRegions.map((value) => String(value))),
    approvedPackages: new Set(approvedPackages.map((value) => String(value))),
    atlasRenderSubmissionProvider,
    coordinateProjectionProvider,
    lastResolvedPlacement: null,
    assetReferenceCache: new Map()
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAssetPlacementProvider: true,
    __state: state,
    __internal: internal
  });
}

function requireProvider(provider) {
  if (
    !provider?.__growgoDeveloperOnlyAtlasAssetPlacementProvider ||
    !provider.__state ||
    !provider.__internal
  ) {
    throw Object.assign(new Error("ATLAS_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "ATLAS_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE"
    });
  }

  return provider;
}

function resolveAssetRecord(provider, {
  assetId,
  assetVersion,
  assetCategory
}) {
  const record = provider.__internal.assetRegistry?.[assetId] ?? null;

  if (!assetId) {
    throw Object.assign(new Error("MISSING_ASSET_ID"), {
      reasonCode: "MISSING_ASSET_ID"
    });
  }

  if (!record) {
    throw Object.assign(new Error("UNKNOWN_ASSET_ID"), {
      reasonCode: "UNKNOWN_ASSET_ID"
    });
  }

  if (sanitizeString(assetVersion) == null) {
    throw Object.assign(new Error("INVALID_ASSET_VERSION"), {
      reasonCode: "INVALID_ASSET_VERSION"
    });
  }

  if (record.assetVersion !== sanitizeString(assetVersion)) {
    throw Object.assign(new Error("INVALID_ASSET_VERSION"), {
      reasonCode: "INVALID_ASSET_VERSION"
    });
  }

  if (sanitizeString(assetCategory) !== record.assetCategory) {
    throw Object.assign(new Error("INVALID_ASSET_CATEGORY"), {
      reasonCode: "INVALID_ASSET_CATEGORY"
    });
  }

  return record;
}

function getReusableAssetReference(provider, record) {
  if (!provider.__internal.assetReferenceCache.has(record.assetReferenceId)) {
    provider.__internal.assetReferenceCache.set(
      record.assetReferenceId,
      deepFreeze({
        assetReferenceId: record.assetReferenceId,
        assetId: record.assetId,
        assetVersion: record.assetVersion,
        assetCategory: record.assetCategory,
        assetReferenceHash: record.assetReferenceHash,
        lods: record.lods,
        dependencyReferences: record.dependencyReferences
      })
    );
  }

  return provider.__internal.assetReferenceCache.get(record.assetReferenceId);
}

export function resolveDeveloperOnlyAtlasAssetPlacement(provider, input = {}) {
  requireProvider(provider);
  const state = provider.__state;
  const internal = provider.__internal;

  state.resolverAttemptCount += 1;
  state.placementStatus = "resolving";
  state.resolverStatus = "resolving";
  state.renderSubmissionAccepted = false;
  state.renderCommandCreated = false;
  state.failureReason = null;

  try {
    const assetId = sanitizeString(input.assetId);
    const assetVersion = sanitizeString(input.assetVersion);
    const assetCategory = sanitizeString(input.assetCategory);
    const regionId = sanitizeString(input.regionId);
    const packageId = sanitizeString(input.packageId);
    const recipeId = sanitizeString(input.recipeId);
    const selectorSeed = sanitizeString(input.selectorSeed);
    const placementSeed = sanitizeString(input.placementSeed);
    const deterministicSeed = selectorSeed ?? placementSeed;

    const assetRecord = resolveAssetRecord(provider, {
      assetId,
      assetVersion,
      assetCategory
    });

    if (!placementSeed) {
      throw Object.assign(new Error("MISSING_PLACEMENT_SEED"), {
        reasonCode: "MISSING_PLACEMENT_SEED"
      });
    }

    if (!regionId || !internal.approvedRegions.has(regionId)) {
      throw Object.assign(new Error("INVALID_REGION_ID"), {
        reasonCode: "INVALID_REGION_ID"
      });
    }

    if (!packageId || !internal.approvedPackages.has(packageId)) {
      throw Object.assign(new Error("INVALID_PACKAGE_ID"), {
        reasonCode: "INVALID_PACKAGE_ID"
      });
    }

    if (!recipeId) {
      throw Object.assign(new Error("MISSING_RECIPE_ID"), {
        reasonCode: "MISSING_RECIPE_ID"
      });
    }

    const geographicCoordinate = validateCoordinate(input.geographicCoordinate);
    const scaleRule = normalizeScaleRule(input.scaleRule);
    const rotationRule = normalizeRotationRule(input.rotationRule);
    const lodRule = normalizeLodRule(input.lodRule);

    const normalizedInput = deepFreeze({
      assetId,
      assetVersion,
      assetCategory,
      geographicCoordinate,
      placementSeed,
      selectorSeed,
      deterministicSeed,
      scaleRule,
      rotationRule,
      lodRule,
      regionId,
      packageId,
      recipeId
    });

    const instanceId = createInstanceId(normalizedInput);
    const position = internal.coordinateProjectionProvider({
      geographicCoordinate,
      regionId,
      packageId,
      recipeId
    });
    const scale = computeScale(instanceId, scaleRule);
    const rotation = computeRotation(instanceId, rotationRule);
    const lod = computeLod(instanceId, lodRule, assetRecord);
    const assetReference = getReusableAssetReference(provider, assetRecord);

    const renderCommand = deepFreeze({
      assetId,
      instanceId,
      position: deepFreeze({
        x: Number(position.x),
        y: Number(position.y)
      }),
      scale,
      rotation,
      lod
    });

    const resolved = deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      assetInput: normalizedInput,
      assetReference,
      resolverStatus: "resolved",
      placementStatus: "resolved",
      deterministicSeed,
      instanceId,
      lodSelected: lod,
      projectionPath:
        sanitizeString(position.projectionPath) ??
        "deterministic_coordinate_projection_v1",
      assetInstanceDescription: deepFreeze({
        assetId,
        assetVersion,
        assetCategory,
        instanceId,
        regionId,
        packageId,
        recipeId,
        geographicCoordinate,
        scale,
        rotation,
        lod,
        deterministicSeed
      }),
      renderCommandCreated: true,
      renderCommand
    });

    internal.lastResolvedPlacement = resolved;
    state.assetId = assetId;
    state.instanceId = instanceId;
    state.placementStatus = "resolved";
    state.resolverStatus = "resolved";
    state.deterministicSeed = deterministicSeed;
    state.lodSelected = lod;
    state.renderCommandCreated = true;
    state.assetReferenceId = assetReference.assetReferenceId;
    state.projectionPath = resolved.projectionPath;
    state.resolverCompletedCount += 1;
    state.failureReason = null;

    return resolved;
  } catch (error) {
    const reasonCode = toReasonCode(error, "ATLAS_ASSET_PLACEMENT_FAILED");
    state.placementStatus = "failed_closed";
    state.resolverStatus = "failed_closed";
    state.renderCommandCreated = false;
    state.failureReason = reasonCode;
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
}

export function submitDeveloperOnlyAtlasAssetRenderCommand(provider, resolvedPlacement) {
  requireProvider(provider);
  const state = provider.__state;
  const internal = provider.__internal;

  state.renderSubmissionAttemptCount += 1;

  if (!isAvailableFunction(internal.atlasRenderSubmissionProvider)) {
    state.failureReason = "ATLAS_RENDER_SUBMISSION_UNAVAILABLE";
    throw Object.assign(new Error("ATLAS_RENDER_SUBMISSION_UNAVAILABLE"), {
      reasonCode: "ATLAS_RENDER_SUBMISSION_UNAVAILABLE"
    });
  }

  const placement =
    resolvedPlacement ??
    internal.lastResolvedPlacement;

  if (!placement?.renderCommand || !placement?.assetReference) {
    state.failureReason = "ASSET_RENDER_COMMAND_UNAVAILABLE";
    throw Object.assign(new Error("ASSET_RENDER_COMMAND_UNAVAILABLE"), {
      reasonCode: "ASSET_RENDER_COMMAND_UNAVAILABLE"
    });
  }

  let submissionResult;
  try {
    submissionResult = sanitizeSubmissionResult(
      internal.atlasRenderSubmissionProvider(
        deepFreeze({
          renderCommands: deepFreeze([placement.renderCommand]),
          assetReferenceId: placement.assetReference.assetReferenceId,
          instanceId: placement.instanceId,
          lod: placement.lodSelected
        })
      )
    );
  } catch (error) {
    const reasonCode = toReasonCode(error, "ATLAS_RENDER_SUBMISSION_FAILED");
    state.failureReason = reasonCode;
    state.placementStatus = "failed_closed";
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }

  if (submissionResult.accepted !== true) {
    state.failureReason =
      submissionResult.reasonCode ?? "ATLAS_RENDER_SUBMISSION_REJECTED";
    state.placementStatus = "failed_closed";
    throw Object.assign(new Error(state.failureReason), {
      reasonCode: state.failureReason
    });
  }

  state.renderSubmissionCompletedCount += 1;
  state.renderSubmissionAccepted = true;
  state.placementStatus = "render_command_submitted";
  state.failureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    accepted: true,
    reasonCode: submissionResult.reasonCode,
    instanceId: placement.instanceId,
    assetId: placement.assetInstanceDescription.assetId,
    lodSelected: placement.lodSelected,
    renderCommand: placement.renderCommand
  });
}

export function clearDeveloperOnlyAtlasAssetPlacement(provider, { reasonCode = "MANUAL_CLEAR" } = {}) {
  requireProvider(provider);
  const state = provider.__state;
  const internal = provider.__internal;

  state.cleanupAttemptCount += 1;
  internal.lastResolvedPlacement = null;
  state.assetId = null;
  state.instanceId = null;
  state.placementStatus = "cleared";
  state.resolverStatus = "idle";
  state.deterministicSeed = null;
  state.lodSelected = null;
  state.renderCommandCreated = false;
  state.renderSubmissionAccepted = false;
  state.assetReferenceId = null;
  state.projectionPath = null;
  state.failureReason = sanitizeString(reasonCode);
  state.cleanupCompletedCount += 1;

  return getDeveloperOnlyAtlasAssetPlacementStatus(provider);
}

export function getDeveloperOnlyAtlasAssetPlacementStatus(provider) {
  try {
    requireProvider(provider);
  } catch {
    return freezeStatus({
      providerReady: false,
      assetId: null,
      instanceId: null,
      placementStatus: "unavailable",
      resolverStatus: "unavailable",
      deterministicSeed: null,
      lodSelected: null,
      renderCommandCreated: false,
      renderSubmissionAccepted: false,
      assetReferenceId: null,
      projectionPath: null,
      resolverAttemptCount: 0,
      resolverCompletedCount: 0,
      renderSubmissionAttemptCount: 0,
      renderSubmissionCompletedCount: 0,
      cleanupAttemptCount: 0,
      cleanupCompletedCount: 0,
      failureReason: "ATLAS_ASSET_PLACEMENT_PROVIDER_UNAVAILABLE"
    });
  }

  return freezeStatus(provider.__state);
}
