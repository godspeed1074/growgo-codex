import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import {
  createPersistentAtlasFrameSnapshot,
  getPersistentAtlasFrameSnapshotStatus,
  releasePersistentAtlasFrameSnapshot,
  validatePersistentAtlasFrameSnapshot
} from "./developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createPersistentAtlasFrameDrawProvider,
  drawPersistentAtlasFrame,
  getPersistentAtlasFrameDrawStatus
} from "./developer-only-persistent-atlas-frame-draw-provider.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DRAW_INTEGRATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DRAW_INTEGRATION_RESULT_001";
const BATCH_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DRAW_BATCH_001";
const PLAN_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_POPULATION_PLAN_001";

const DEFAULT_DRAW_COMMAND_BUDGET = 24;
const ALLOWED_COMMAND_KEYS = new Set([
  "assetId",
  "instanceId",
  "position",
  "scale",
  "rotation",
  "lod"
]);
const FORBIDDEN_REFERENCE_KEYS = new Set([
  "geometry",
  "mesh",
  "meshes",
  "texture",
  "textures",
  "glb",
  "gltf",
  "blend",
  "blender",
  "model",
  "models",
  "canvas",
  "pane",
  "map",
  "leaflet",
  "renderer",
  "window",
  "document",
  "domNode",
  "element",
  "callback",
  "listener"
]);

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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function isDeeplyFrozen(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") {
    return true;
  }
  if (seen.has(value)) {
    return true;
  }
  if (!Object.isFrozen(value)) {
    return false;
  }
  seen.add(value);
  return Object.values(value).every((nested) => isDeeplyFrozen(nested, seen));
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
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function describeReference(value) {
  const valueType = typeof value;
  return {
    rawReferenceType:
      value == null ? String(value) : valueType === "object" ? "object" : valueType,
    rawReferenceConstructorName:
      value &&
      typeof value === "object" &&
      value.constructor &&
      value.constructor.name
        ? value.constructor.name
        : valueType === "function" && value.name
          ? value.name
          : null
  };
}

function validateNoRawReferences(value, path = "plan") {
  if (value == null) {
    return;
  }

  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateNoRawReferences(item, `${path}[${index}]`)
    );
    return;
  }

  if (!isPlainObject(value)) {
    const descriptor = describeReference(value);
    throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
      reasonCode: "RAW_BROWSER_REFERENCE_DETECTED",
      rawReferenceFieldPath: path,
      rawReferenceType: descriptor.rawReferenceType,
      rawReferenceConstructorName: descriptor.rawReferenceConstructorName
    });
  }

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
      const descriptor = describeReference(nested);
      throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
        reasonCode: "RAW_BROWSER_REFERENCE_DETECTED",
        rawReferenceFieldPath: `${path}.${key}`,
        rawReferenceType: descriptor.rawReferenceType,
        rawReferenceConstructorName: descriptor.rawReferenceConstructorName
      });
    }
    validateNoRawReferences(nested, `${path}.${key}`);
  }
}

function assertFiniteNumber(value, reasonCode) {
  if (!Number.isFinite(Number(value))) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return Number(value);
}

function validateIdentityMatch(plan, identity) {
  const currentIdentity = {
    regionId: sanitizeString(identity?.regionId),
    packageId: sanitizeString(identity?.packageId),
    recipeId: sanitizeString(identity?.recipeId),
    selectorSeed: sanitizeString(identity?.selectorSeed)
  };

  if (currentIdentity.regionId !== sanitizeString(plan.regionId)) {
    throw Object.assign(new Error("REGION_IDENTITY_MISMATCH"), {
      reasonCode: "REGION_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.packageId !== sanitizeString(plan.packageId)) {
    throw Object.assign(new Error("PACKAGE_IDENTITY_MISMATCH"), {
      reasonCode: "PACKAGE_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.recipeId !== sanitizeString(plan.recipeId)) {
    throw Object.assign(new Error("RECIPE_IDENTITY_MISMATCH"), {
      reasonCode: "RECIPE_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.selectorSeed !== sanitizeString(plan.selectorSeed)) {
    throw Object.assign(new Error("SELECTOR_SEED_MISMATCH"), {
      reasonCode: "SELECTOR_SEED_MISMATCH"
    });
  }
}

function validatePopulationPlanSchema(plan) {
  if (!plan || plan.schemaId !== PLAN_SCHEMA_ID) {
    throw Object.assign(new Error("INVALID_PLAN_SCHEMA"), {
      reasonCode: "INVALID_PLAN_SCHEMA"
    });
  }
  if (!isDeeplyFrozen(plan)) {
    throw Object.assign(new Error("PLAN_NOT_IMMUTABLE"), {
      reasonCode: "PLAN_NOT_IMMUTABLE"
    });
  }
  if (!isSerializable(plan)) {
    throw Object.assign(new Error("PLAN_NOT_SERIALIZABLE"), {
      reasonCode: "PLAN_NOT_SERIALIZABLE"
    });
  }
  if (!Array.isArray(plan.commands)) {
    throw Object.assign(new Error("INVALID_PLAN_COMMANDS"), {
      reasonCode: "INVALID_PLAN_COMMANDS"
    });
  }
  if (!Array.isArray(plan.rejectedCandidates)) {
    throw Object.assign(new Error("INVALID_PLAN_SCHEMA"), {
      reasonCode: "INVALID_PLAN_SCHEMA"
    });
  }
  validateNoRawReferences(plan);
}

function validateCommandShape(command, index) {
  if (!isPlainObject(command)) {
    throw Object.assign(new Error("INVALID_COMMAND_SHAPE"), {
      reasonCode: "INVALID_COMMAND_SHAPE"
    });
  }

  for (const key of Object.keys(command)) {
    if (!ALLOWED_COMMAND_KEYS.has(key)) {
      if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
        throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
          reasonCode: "RAW_BROWSER_REFERENCE_DETECTED",
          rawReferenceFieldPath: `plan.commands[${index}].${key}`
        });
      }
      throw Object.assign(new Error("INVALID_COMMAND_SHAPE"), {
        reasonCode: "INVALID_COMMAND_SHAPE"
      });
    }
  }

  const assetId = sanitizeString(command.assetId);
  const instanceId = sanitizeString(command.instanceId);
  const lod = sanitizeString(command.lod);
  if (!assetId || !instanceId || !lod) {
    throw Object.assign(new Error("INVALID_COMMAND_SHAPE"), {
      reasonCode: "INVALID_COMMAND_SHAPE"
    });
  }
  if (!isPlainObject(command.position)) {
    throw Object.assign(new Error("INVALID_COMMAND_SHAPE"), {
      reasonCode: "INVALID_COMMAND_SHAPE"
    });
  }

  return deepFreeze({
    assetId,
    instanceId,
    position: deepFreeze({
      x: assertFiniteNumber(command.position.x, "INVALID_COMMAND_SHAPE"),
      y: assertFiniteNumber(command.position.y, "INVALID_COMMAND_SHAPE")
    }),
    scale: assertFiniteNumber(command.scale, "INVALID_COMMAND_SHAPE"),
    rotation: assertFiniteNumber(command.rotation, "INVALID_COMMAND_SHAPE"),
    lod
  });
}

function validateDeterministicOrdering(commands) {
  const expected = [...commands].sort((left, right) => {
    if (left.instanceId === right.instanceId) {
      return left.assetId.localeCompare(right.assetId);
    }
    return left.instanceId.localeCompare(right.instanceId);
  });

  for (let index = 0; index < commands.length; index += 1) {
    if (
      commands[index].instanceId !== expected[index].instanceId ||
      commands[index].assetId !== expected[index].assetId
    ) {
      throw Object.assign(new Error("DETERMINISTIC_ORDERING_VIOLATION"), {
        reasonCode: "DETERMINISTIC_ORDERING_VIOLATION"
      });
    }
  }
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    integrationReady: state.integrationReady,
    planValidated: state.planValidated,
    populationPlanId: state.populationPlanId,
    batchId: state.batchId,
    inputCommandCount: state.inputCommandCount,
    acceptedCommandCount: state.acceptedCommandCount,
    rejectedCommandCount: state.rejectedCommandCount,
    drawSubmitted: state.drawSubmitted,
    drawCompleted: state.drawCompleted,
    requestedRedrawReason: state.requestedRedrawReason,
    acceptedRedrawReason: state.acceptedRedrawReason,
    drawFailureReason: state.drawFailureReason,
    referencesReleased: state.referencesReleased,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult({
  populationPlanId,
  batchId,
  inputCommandCount,
  acceptedCommandCount,
  rejectedCommandCount,
  drawCompleted,
  drawFailureReason
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    populationPlanId,
    batchId,
    inputCommandCount,
    acceptedCommandCount,
    rejectedCommandCount,
    drawSubmitted: true,
    drawCompleted,
    drawFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function readDeps(integration) {
  const deps = integration?.__deps;
  if (!deps) {
    throw Object.assign(new Error("POPULATION_DRAW_INTEGRATION_UNAVAILABLE"), {
      reasonCode: "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
    });
  }

  const requiredFunctions = [
    "atlasIdentityProvider",
    "retainedSurfaceResolver",
    "retainedSurfaceValidator",
    "lifecycleOwnerResolver",
    "lifecycleOwnerValidator",
    "authorizationResolver",
    "authorizationValidator",
    "populationBatchDrawProvider",
    "mutableDrawStateProvider",
    "canvasPositionAdapter",
    "drawStateReleaseProvider",
    "batchReferenceReleaseProvider",
    "timeProvider"
  ];

  for (const name of requiredFunctions) {
    if (!isAvailableFunction(deps[name])) {
      throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
        reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
      });
    }
  }

  if (!integration.__internal?.snapshotProvider?.__growgoPersistentAtlasFrameSnapshotProvider) {
    throw Object.assign(new Error("SNAPSHOT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "SNAPSHOT_PROVIDER_UNAVAILABLE"
    });
  }

  return deps;
}

function summarizeSnapshotValidation(snapshot) {
  return {
    ok: true,
    snapshotId: sanitizeString(snapshot.snapshotId),
    snapshotGenerationId: sanitizeString(snapshot.snapshotGenerationId),
    sessionId: sanitizeString(snapshot.sessionId),
    mapIdentityId: sanitizeString(snapshot.mapIdentityId),
    lifecycleOwnerId: sanitizeString(snapshot.lifecycleOwnerId),
    lifecycleGenerationId: sanitizeString(snapshot.lifecycleGenerationId),
    surfaceOwnerId: sanitizeString(snapshot.surfaceOwnerId)
  };
}

function createPopulationDrawBatch({
  assetRegistry,
  plan,
  drawCommandBudget
}) {
  validatePopulationPlanSchema(plan);

  if (plan.commands.length > drawCommandBudget) {
    throw Object.assign(new Error("DRAW_COMMAND_BUDGET_EXCEEDED"), {
      reasonCode: "DRAW_COMMAND_BUDGET_EXCEEDED"
    });
  }

  const normalizedCommands = plan.commands.map((command, index) =>
    validateCommandShape(command, index)
  );
  validateDeterministicOrdering(normalizedCommands);

  const seenInstanceIds = new Set();
  const batchCommands = normalizedCommands.map((command) => {
    if (seenInstanceIds.has(command.instanceId)) {
      throw Object.assign(new Error("DUPLICATE_INSTANCE_ID"), {
        reasonCode: "DUPLICATE_INSTANCE_ID"
      });
    }
    seenInstanceIds.add(command.instanceId);

    const registryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
      assetRegistry,
      command.assetId
    );

    return deepFreeze({
      assetReferenceId: registryEntry.assetReferenceId,
      instanceId: command.instanceId,
      position: command.position,
      scale: command.scale,
      rotation: command.rotation,
      lod: command.lod,
      assetCategory: registryEntry.assetCategory,
      assetFamily: registryEntry.assetFamily
    });
  });

  const batchId = `ATLAS_POPULATION_DRAW_BATCH_${hashString(
    stableSerialize({
      populationPlanId: plan.populationPlanId,
      commands: batchCommands
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  return deepFreeze({
    schemaId: BATCH_SCHEMA_ID,
    batchId,
    populationPlanId: sanitizeString(plan.populationPlanId),
    regionId: sanitizeString(plan.regionId),
    packageId: sanitizeString(plan.packageId),
    recipeId: sanitizeString(plan.recipeId),
    selectorSeed: sanitizeString(plan.selectorSeed),
    commands: deepFreeze(batchCommands),
    inputCommandCount: normalizedCommands.length,
    acceptedCommandCount: batchCommands.length,
    rejectedCommandCount: Array.isArray(plan.rejectedCandidates)
      ? plan.rejectedCandidates.length
      : 0
  });
}

export function createAtlasPopulationDrawIntegration({
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  snapshotProvider = null,
  atlasIdentityProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  retainedSurfaceResolver = unavailable("RETAINED_SURFACE_UNAVAILABLE"),
  retainedSurfaceValidator = unavailable("RETAINED_SURFACE_UNAVAILABLE"),
  lifecycleOwnerResolver = unavailable("LIFECYCLE_OWNER_UNAVAILABLE"),
  lifecycleOwnerValidator = unavailable("LIFECYCLE_OWNER_UNAVAILABLE"),
  authorizationResolver = unavailable("AUTHORIZATION_UNAVAILABLE"),
  authorizationValidator = unavailable("AUTHORIZATION_UNAVAILABLE"),
  populationBatchDrawProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  mutableDrawStateProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  canvasPositionAdapter = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  drawStateReleaseProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  batchReferenceReleaseProvider = () => {},
  timeProvider = () => new Date().toISOString(),
  drawCommandBudget = DEFAULT_DRAW_COMMAND_BUDGET
} = {}) {
  const state = {
    integrationReady: true,
    planValidated: false,
    populationPlanId: null,
    batchId: null,
    inputCommandCount: 0,
    acceptedCommandCount: 0,
    rejectedCommandCount: 0,
    drawSubmitted: false,
    drawCompleted: false,
    requestedRedrawReason: null,
    acceptedRedrawReason: null,
    drawFailureReason: null,
    referencesReleased: true,
    lastFailureReason: null
  };

  const internal = {
    assetRegistry,
    snapshotProvider,
    currentPopulationBatch: null,
    drawCommandBudget: Number(drawCommandBudget) || DEFAULT_DRAW_COMMAND_BUDGET,
    drawGenerationCounter: 0,
    drawProvider: null
  };

  const integration = Object.freeze({
    __growgoAtlasPopulationDrawIntegration: true,
    __state: state,
    __internal: internal,
    __deps: {
      atlasIdentityProvider,
      retainedSurfaceResolver,
      retainedSurfaceValidator,
      lifecycleOwnerResolver,
      lifecycleOwnerValidator,
      authorizationResolver,
      authorizationValidator,
      populationBatchDrawProvider,
      mutableDrawStateProvider,
      canvasPositionAdapter,
      drawStateReleaseProvider,
      batchReferenceReleaseProvider,
      timeProvider
    }
  });

  internal.drawProvider = createPersistentAtlasFrameDrawProvider({
    snapshotValidator: ({ snapshot }) => {
      validatePersistentAtlasFrameSnapshot(snapshotProvider, snapshot);
      return summarizeSnapshotValidation(snapshot);
    },
    retainedSurfaceValidator: ({ retainedSurface }) =>
      retainedSurfaceValidator({ retainedSurface }),
    lifecycleOwnerValidator: ({ lifecycleOwner }) =>
      lifecycleOwnerValidator({ lifecycleOwner }),
    authorizationValidator: ({ authorization, redrawReason, drawGenerationId }) =>
      authorizationValidator({ authorization, redrawReason, drawGenerationId }),
    snapshotAwareDrawProvider: ({
      snapshot,
      canvas,
      pane,
      mutableDrawState,
      drawGenerationId,
      redrawReason
    }) => {
      if (!internal.currentPopulationBatch) {
        throw Object.assign(new Error("POPULATION_BATCH_UNAVAILABLE"), {
          reasonCode: "POPULATION_BATCH_UNAVAILABLE"
        });
      }
      return populationBatchDrawProvider({
        snapshot,
        canvas,
        pane,
        mutableDrawState,
        drawGenerationId,
        redrawReason,
        populationBatch: internal.currentPopulationBatch
      });
    },
    mutableDrawStateProvider,
    canvasPositionAdapter,
    drawStateReleaseProvider,
    timeProvider
  });

  try {
    readDeps(integration);
    state.integrationReady = true;
  } catch (error) {
    state.integrationReady = false;
    state.lastFailureReason = toReasonCode(
      error,
      "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
    );
  }

  return integration;
}

export function validateAtlasPopulationPlanForDraw(integration, plan) {
  if (!integration?.__growgoAtlasPopulationDrawIntegration) {
    throw Object.assign(new Error("POPULATION_DRAW_INTEGRATION_UNAVAILABLE"), {
      reasonCode: "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
    });
  }

  const state = integration.__state;
  const internal = integration.__internal;
  const deps = readDeps(integration);

  const identity = deps.atlasIdentityProvider();
  assertFiniteNumber(internal.drawCommandBudget, "DRAW_COMMAND_BUDGET_EXCEEDED");

  const batch = createPopulationDrawBatch({
    assetRegistry: internal.assetRegistry,
    plan,
    drawCommandBudget: internal.drawCommandBudget
  });

  validateIdentityMatch(plan, identity);

  state.planValidated = true;
  state.populationPlanId = batch.populationPlanId;
  state.batchId = batch.batchId;
  state.inputCommandCount = batch.inputCommandCount;
  state.acceptedCommandCount = batch.acceptedCommandCount;
  state.rejectedCommandCount = batch.rejectedCommandCount;
  state.lastFailureReason = null;

  return batch;
}

export function submitAtlasPopulationPlanForDraw(
  integration,
  { plan, redrawReason = "manual_redraw" } = {}
) {
  if (!integration?.__growgoAtlasPopulationDrawIntegration) {
    throw Object.assign(new Error("POPULATION_DRAW_INTEGRATION_UNAVAILABLE"), {
      reasonCode: "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
    });
  }

  const state = integration.__state;
  const internal = integration.__internal;
  const deps = readDeps(integration);

  let snapshot = null;
  let batch = null;

  state.drawSubmitted = false;
  state.drawCompleted = false;
  state.requestedRedrawReason = sanitizeString(redrawReason);
  state.acceptedRedrawReason = null;
  state.drawFailureReason = null;
  state.referencesReleased = false;

  try {
    batch = validateAtlasPopulationPlanForDraw(integration, plan);
    internal.currentPopulationBatch = batch;

    const retainedSurface = deps.retainedSurfaceResolver();
    if (!retainedSurface) {
      throw Object.assign(new Error("RETAINED_SURFACE_UNAVAILABLE"), {
        reasonCode: "RETAINED_SURFACE_UNAVAILABLE"
      });
    }

    const lifecycleOwner = deps.lifecycleOwnerResolver();
    if (!lifecycleOwner) {
      throw Object.assign(new Error("LIFECYCLE_OWNER_UNAVAILABLE"), {
        reasonCode: "LIFECYCLE_OWNER_UNAVAILABLE"
      });
    }

    const authorization = deps.authorizationResolver();
    if (!authorization) {
      throw Object.assign(new Error("AUTHORIZATION_UNAVAILABLE"), {
        reasonCode: "AUTHORIZATION_UNAVAILABLE"
      });
    }

    snapshot = createPersistentAtlasFrameSnapshot(internal.snapshotProvider, {
      redrawReason
    });
    state.acceptedRedrawReason = sanitizeString(snapshot?.redrawReason) ?? sanitizeString(redrawReason);

    internal.drawGenerationCounter += 1;
    const drawGenerationId = `POPULATION_DRAW_GEN_${String(
      internal.drawGenerationCounter
    ).padStart(3, "0")}`;

    state.drawSubmitted = true;

    const batchBefore = JSON.stringify(batch);
    drawPersistentAtlasFrame(internal.drawProvider, {
      snapshot,
      retainedSurface,
      lifecycleOwner,
      authorization,
      drawGenerationId
    });

    if (JSON.stringify(batch) !== batchBefore) {
      throw Object.assign(new Error("POPULATION_BATCH_MUTATED_DURING_DRAW"), {
        reasonCode: "POPULATION_BATCH_MUTATED_DURING_DRAW"
      });
    }

    state.drawCompleted = true;
    state.drawFailureReason = null;
    state.lastFailureReason = null;

    return buildResult({
      populationPlanId: batch.populationPlanId,
      batchId: batch.batchId,
      inputCommandCount: batch.inputCommandCount,
      acceptedCommandCount: batch.acceptedCommandCount,
      rejectedCommandCount: batch.rejectedCommandCount,
      drawCompleted: true,
      drawFailureReason: null
    });
  } catch (error) {
    const reasonCode = toReasonCode(error, "POPULATION_DRAW_SUBMISSION_FAILED");
    state.drawFailureReason = reasonCode;
    state.lastFailureReason = reasonCode;
    throw Object.assign(new Error(reasonCode), { reasonCode });
  } finally {
    try {
      if (snapshot) {
        releasePersistentAtlasFrameSnapshot(internal.snapshotProvider, snapshot);
      }
    } finally {
      try {
        if (batch) {
          deps.batchReferenceReleaseProvider({
            populationBatch: batch,
            reason: state.drawCompleted ? "draw_completed" : "draw_failed"
          });
        }
      } finally {
        internal.currentPopulationBatch = null;
        state.referencesReleased = true;
      }
    }
  }
}

export function getAtlasPopulationDrawIntegrationStatus(integration) {
  if (!integration?.__growgoAtlasPopulationDrawIntegration) {
    return freezeStatus({
      integrationReady: false,
      planValidated: false,
      populationPlanId: null,
      batchId: null,
      inputCommandCount: 0,
      acceptedCommandCount: 0,
      rejectedCommandCount: 0,
      drawSubmitted: false,
      drawCompleted: false,
      requestedRedrawReason: null,
      acceptedRedrawReason: null,
      drawFailureReason: null,
      referencesReleased: false,
      lastFailureReason: "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
    });
  }

  const state = integration.__state;
  const snapshotStatus = getPersistentAtlasFrameSnapshotStatus(
    integration.__internal.snapshotProvider
  );
  const drawStatus = getPersistentAtlasFrameDrawStatus(
    integration.__internal.drawProvider
  );

  return freezeStatus({
    ...state,
    drawFailureReason:
      state.drawFailureReason ??
      (drawStatus.lastFailureReason === "DRAW_PROVIDER_UNAVAILABLE"
        ? null
        : drawStatus.lastFailureReason),
    lastFailureReason:
      state.lastFailureReason ??
      (snapshotStatus.lastFailureReason === "SNAPSHOT_PROVIDER_UNAVAILABLE" &&
      drawStatus.lastFailureReason === "DRAW_PROVIDER_UNAVAILABLE"
        ? null
        : drawStatus.lastFailureReason ?? snapshotStatus.lastFailureReason)
  });
}
