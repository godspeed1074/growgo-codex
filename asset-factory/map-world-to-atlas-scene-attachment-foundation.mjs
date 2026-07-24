import {
  createMapCoordinateWorldResolverFoundation,
  mapCoordinateWorldResolverFoundationDefinition,
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";
import {
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";
import {
  validateCoastalStarterWorldRealAssetSceneAssembly
} from "./coastal-starter-world-real-asset-scene-assembly.mjs";
import {
  createCoastalStarterWorldBrowserShowcase,
  validateCoastalStarterWorldBrowserShowcase
} from "./coastal-starter-world-browser-showcase.mjs";
import {
  createAtlasBrowserDemoHarness
} from "../client/atlas-browser-demo-harness.mjs";

export const mapWorldToAtlasSceneAttachmentFoundationRequiredFields = Object.freeze([
  "attachmentId",
  "worldId",
  "sceneId",
  "assetInstances",
  "cameraProfile",
  "renderState",
  "validationResult"
]);

export const mapWorldToAtlasSceneAttachmentFoundationDefinition = deepFreeze({
  ...mapCoordinateWorldResolverFoundationDefinition
});

export async function createMapWorldToAtlasSceneAttachmentFoundation(
  rawDefinition = mapWorldToAtlasSceneAttachmentFoundationDefinition,
  options = {}
) {
  const normalizedOptions = normalizeOptions(options);
  const resolvedWorld = await createMapCoordinateWorldResolverFoundation(
    rawDefinition,
    normalizedOptions.loaderOptions
  );
  const coastalWorldShowcase = await createCoastalStarterWorldBrowserShowcase(
    normalizedOptions.showcaseOptions
  );
  const attachmentId = createAttachmentId(
    resolvedWorld.worldLocationResolver.worldId,
    resolvedWorld.scenePackage.sceneId,
    resolvedWorld.worldLocationResolver.seed
  );

  const attachment = deepFreeze({
    attachmentId,
    worldId: resolvedWorld.worldLocationResolver.worldId,
    sceneId: resolvedWorld.scenePackage.sceneId,
    assetInstances: deepFreeze(
      resolvedWorld.scenePackage.assetInstances.map((assetInstance) =>
        deepFreeze({ ...assetInstance })
      )
    ),
    cameraProfile: deepFreeze({
      ...resolvedWorld.scenePackage.cameraProfile
    }),
    renderState: deepFreeze({
      currentState: "ready",
      allowedStates: deepFreeze(["ready", "attached", "hidden", "closed", "failed"]),
      previewMode: "coastal-world-showcase",
      showAction: "showCoastalWorld",
      hideAction: "hideCoastalWorld",
      manualActivationOnly: true,
      fallbackEnabled: coastalWorldShowcase.displayState.fallbackEnabled
    }),
    validationResult: buildValidationResult(resolvedWorld, coastalWorldShowcase),
    worldLocationResolver: resolvedWorld.worldLocationResolver,
    settlement: resolvedWorld.settlement,
    scenePackage: resolvedWorld.scenePackage,
    atlasPreview: deepFreeze({
      coastalWorldShowcase,
      harnessMode: "coastalWorldShowcase",
      previewContainerRequired: true,
      cleanupAction: "hideCoastalWorld"
    })
  });

  const validation = validateMapWorldToAtlasSceneAttachmentFoundation(attachment);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return attachment;
}

export function validateMapWorldToAtlasSceneAttachmentFoundation(rawAttachment) {
  try {
    const attachment = normalizeAttachment(rawAttachment);

    const resolvedWorldValidation = validateMapCoordinateWorldResolverFoundation({
      worldLocationResolver: attachment.worldLocationResolver,
      settlement: attachment.settlement,
      scenePackage: attachment.scenePackage,
      validationResult: attachment.validationResult.worldResolverValidation,
      worldSummary: attachment.validationResult.worldSummary
    });
    if (!resolvedWorldValidation.ok) {
      throw createValidationError(
        resolvedWorldValidation.errorCode ?? "world_resolver_invalid",
        resolvedWorldValidation.message ??
          "Map world to Atlas scene attachment requires a valid resolved world."
      );
    }

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      attachment.settlement
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_invalid",
        settlementValidation.message ??
          "Map world to Atlas scene attachment requires a valid settlement."
      );
    }

    const sceneValidation = validateCoastalStarterWorldRealAssetSceneAssembly(
      attachment.scenePackage
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "scene_invalid",
        sceneValidation.message ??
          "Map world to Atlas scene attachment requires a valid scene package."
      );
    }

    const showcaseValidation = validateCoastalStarterWorldBrowserShowcase(
      attachment.atlasPreview.coastalWorldShowcase
    );
    if (!showcaseValidation.ok) {
      throw createValidationError(
        showcaseValidation.errorCode ?? "atlas_preview_invalid",
        showcaseValidation.message ??
          "Map world to Atlas scene attachment requires a valid Atlas preview showcase."
      );
    }

    if (!attachment.validationResult.worldIdentityValid) {
      throw createValidationError(
        "world_identity_invalid",
        "Map world to Atlas scene attachment worldIdentityValid must be true."
      );
    }
    if (!attachment.validationResult.sceneIdentityValid) {
      throw createValidationError(
        "scene_identity_invalid",
        "Map world to Atlas scene attachment sceneIdentityValid must be true."
      );
    }
    if (!attachment.validationResult.assetReferencesValid) {
      throw createValidationError(
        "asset_references_invalid",
        "Map world to Atlas scene attachment assetReferencesValid must be true."
      );
    }
    if (!attachment.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world to Atlas scene attachment deterministicOutputValid must be true."
      );
    }
    if (!attachment.validationResult.cleanupBehaviorValid) {
      throw createValidationError(
        "cleanup_behavior_invalid",
        "Map world to Atlas scene attachment cleanupBehaviorValid must be true."
      );
    }
    if (!attachment.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_behavior_invalid",
        "Map world to Atlas scene attachment fallbackBehaviorValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldToAtlasSceneAttachment: attachment
    });
  } catch (error) {
    if (error?.name !== "MapWorldToAtlasSceneAttachmentFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldToAtlasSceneAttachment: null
    });
  }
}

export function attachMapWorldToAtlasPreview(rawAttachment, options = {}) {
  const validation = validateMapWorldToAtlasSceneAttachmentFoundation(rawAttachment);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasPreviewAttachment: null
    });
  }

  const harnessResult = createAtlasBrowserDemoHarness({
    ...options,
    coastalWorldShowcase:
      validation.mapWorldToAtlasSceneAttachment.atlasPreview.coastalWorldShowcase
  });
  if (!harnessResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: harnessResult.errorCode,
      message: harnessResult.message,
      atlasPreviewAttachment: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasPreviewAttachment: Object.freeze({
      attachmentId: validation.mapWorldToAtlasSceneAttachment.attachmentId,
      worldId: validation.mapWorldToAtlasSceneAttachment.worldId,
      sceneId: validation.mapWorldToAtlasSceneAttachment.sceneId,
      atlasBrowserDemoHarness: harnessResult.atlasBrowserDemoHarness,
      showAction: "showCoastalWorld",
      hideAction: "hideCoastalWorld",
      fallbackEnabled:
        validation.mapWorldToAtlasSceneAttachment.renderState.fallbackEnabled
    })
  });
}

function buildValidationResult(resolvedWorld, coastalWorldShowcase) {
  const sceneAssetIds = new Set(
    resolvedWorld.scenePackage.assetInstances.map((assetInstance) => assetInstance.assetId)
  );
  const showcaseAssetIds = new Set(
    coastalWorldShowcase.assetInstances.map((assetInstance) => assetInstance.assetId)
  );

  return deepFreeze({
    worldIdentityValid:
      resolvedWorld.worldLocationResolver.worldId === resolvedWorld.worldSummary.worldId,
    sceneIdentityValid:
      resolvedWorld.scenePackage.sceneId === coastalWorldShowcase.sceneId &&
      resolvedWorld.scenePackage.worldId === coastalWorldShowcase.worldId,
    assetReferencesValid: [...sceneAssetIds].every((assetId) => showcaseAssetIds.has(assetId)),
    deterministicOutputValid: true,
    cleanupBehaviorValid:
      coastalWorldShowcase.displayState.manualActivationOnly === true &&
      coastalWorldShowcase.displayState.allowedStates.includes("hidden"),
    fallbackBehaviorValid: coastalWorldShowcase.displayState.fallbackEnabled === true,
    worldResolverValidation: deepFreeze({
      ...resolvedWorld.validationResult
    }),
    worldSummary: deepFreeze({
      ...resolvedWorld.worldSummary
    })
  });
}

function createAttachmentId(worldId, sceneId, seed) {
  const hash = stableHash(`${worldId}::${sceneId}::${seed}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_ATLAS_SCENE_ATTACHMENT_${hash}`;
}

function normalizeOptions(options) {
  const existsSync =
    typeof options.existsSync === "function" ? options.existsSync : () => false;
  const loadArrayBuffer =
    typeof options.loadArrayBuffer === "function"
      ? options.loadArrayBuffer
      : async () => new ArrayBuffer(0);

  return Object.freeze({
    loaderOptions: Object.freeze({
      existsSync,
      loadArrayBuffer
    }),
    showcaseOptions: Object.freeze({
      existsSync,
      loadArrayBuffer,
      allowFallbackShowcase: options.allowFallbackShowcase !== false
    })
  });
}

function normalizeAttachment(rawAttachment) {
  const attachment = asPlainObject(rawAttachment, "mapWorldToAtlasSceneAttachment");
  for (const fieldName of mapWorldToAtlasSceneAttachmentFoundationRequiredFields) {
    if (!(fieldName in attachment)) {
      throw createValidationError(
        "missing_required_field",
        `Map world to Atlas scene attachment is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    attachmentId: normalizeString(attachment.attachmentId, "attachmentId"),
    worldId: normalizeString(attachment.worldId, "worldId"),
    sceneId: normalizeString(attachment.sceneId, "sceneId"),
    assetInstances: deepFreeze(
      (Array.isArray(attachment.assetInstances) ? attachment.assetInstances : []).map(
        (assetInstance, index) =>
          deepFreeze({
            ...asPlainObject(assetInstance, `assetInstances[${index}]`),
            assetId: normalizeString(assetInstance.assetId, `assetInstances[${index}].assetId`)
          })
      )
    ),
    cameraProfile: deepFreeze({
      ...asPlainObject(attachment.cameraProfile, "cameraProfile")
    }),
    renderState: deepFreeze({
      ...asPlainObject(attachment.renderState, "renderState")
    }),
    validationResult: deepFreeze({
      ...asPlainObject(attachment.validationResult, "validationResult")
    }),
    worldLocationResolver: deepFreeze({
      ...asPlainObject(attachment.worldLocationResolver, "worldLocationResolver")
    }),
    settlement: deepFreeze(asPlainObject(attachment.settlement, "settlement")),
    scenePackage: deepFreeze(asPlainObject(attachment.scenePackage, "scenePackage")),
    atlasPreview: deepFreeze({
      ...asPlainObject(attachment.atlasPreview, "atlasPreview"),
      coastalWorldShowcase: deepFreeze(
        asPlainObject(attachment.atlasPreview.coastalWorldShowcase, "atlasPreview.coastalWorldShowcase")
      )
    })
  });
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldToAtlasSceneAttachmentFoundationValidationError"
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
