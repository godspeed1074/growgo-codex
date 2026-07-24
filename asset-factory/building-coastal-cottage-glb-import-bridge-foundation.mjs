import path from "node:path";
import { existsSync as defaultExistsSync } from "node:fs";
import {
  buildingCoastalCottagePrototypeAssetPackageDefinition,
  validateBuildingCoastalCottagePrototypeAssetPackage
} from "./building-coastal-cottage-prototype-asset-package.mjs";
import {
  buildingCoastalCottageLocalGeneratorDefinition,
  validateBuildingCoastalCottageLocalGenerator
} from "./building-coastal-cottage-local-generator.mjs";

export const buildingCoastalCottageGlbImportBridgeFoundationRequiredFields =
  Object.freeze(["glbRegistration", "runtimePreviewBinding"]);

export const buildingCoastalCottageGlbImportBridgeFoundationDefinition =
  deepFreeze({
    glbRegistration: {
      assetId: "BUILDING_COASTAL_COTTAGE_001",
      glbPath:
        "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
      lodReferences: {
        LOD_CLOSE:
          "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
        LOD_GAMEPLAY:
          "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
        LOD_MAP:
          "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_MAP.glb",
        LOD_DISTANT_SILHOUETTE:
          "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_DISTANT_SILHOUETTE.glb"
      },
      manifestReference:
        "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/building-coastal-cottage-manifest.json",
      metadataReference:
        "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/building-coastal-cottage-metadata.json",
      validationStatus: {
        glbExistsValidated: false,
        manifestLinked: true,
        metadataLinked: true,
        assetIdentityValidated: true,
        exportValidated: true
      }
    },
    runtimePreviewBinding: {
      assetId: "BUILDING_COASTAL_COTTAGE_001",
      renderPayload: {
        rendererAssetReference: "BUILDING_COASTAL_COTTAGE_001",
        primaryGlb:
          "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
        rendererProfile: "custom-2.5d-passive"
      },
      lodSelector: {
        close: "LOD_CLOSE",
        gameplay: "LOD_GAMEPLAY",
        map: "LOD_MAP",
        distantSilhouette: "LOD_DISTANT_SILHOUETTE"
      },
      appearanceProfile: "day"
    }
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedAppearanceProfiles = new Set(["day", "sunset", "night"]);

export function createBuildingCoastalCottageGlbImportBridgeFoundation(
  rawDefinition = buildingCoastalCottageGlbImportBridgeFoundationDefinition
) {
  return normalizeBridgeFoundation(rawDefinition);
}

export function validateBuildingCoastalCottageGlbImportBridgeFoundation(
  rawDefinition = buildingCoastalCottageGlbImportBridgeFoundationDefinition,
  options = {}
) {
  try {
    const definition = normalizeBridgeFoundation(rawDefinition);
    const assetPackageDefinition =
      options.assetPackageDefinition ??
      buildingCoastalCottagePrototypeAssetPackageDefinition;
    const localGeneratorDefinition =
      options.localGeneratorDefinition ??
      buildingCoastalCottageLocalGeneratorDefinition;
    const existsSync =
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync;

    const packageResult =
      validateBuildingCoastalCottagePrototypeAssetPackage(assetPackageDefinition);
    if (!packageResult.ok) {
      return freezeFailure(packageResult);
    }

    const generatorResult =
      validateBuildingCoastalCottageLocalGenerator(localGeneratorDefinition, {
        assetPackageDefinition
      });
    if (!generatorResult.ok) {
      return freezeFailure(generatorResult);
    }

    validateCompatibility(
      definition,
      packageResult.prototypeAssetPackage.package,
      generatorResult.localGenerator.definition,
      existsSync
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      glbImportBridge: Object.freeze({
        foundation: definition,
        compatibility: Object.freeze({
          assetPackageVerified: true,
          localGeneratorVerified: true,
          runtimePreviewBindingVerified: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !==
      "BuildingCoastalCottageGlbImportBridgeFoundationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      glbImportBridge: null
    });
  }
}

function validateCompatibility(definition, assetPackage, localGenerator, existsSync) {
  const registration = definition.glbRegistration;
  const previewBinding = definition.runtimePreviewBinding;

  if (
    registration.assetId !== assetPackage.assetId ||
    registration.assetId !== previewBinding.assetId
  ) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Building coastal cottage GLB import bridge asset identity must match the approved asset package and runtime preview binding."
    );
  }

  if (registration.glbPath !== registration.lodReferences.LOD_CLOSE) {
    throw createValidationError(
      "primary_glb_mismatch",
      "Building coastal cottage GLB primary glbPath must match the close LOD reference."
    );
  }

  const expectedOutputRoot = localGenerator.expectedOutputLocation;
  const expectedLodPaths = {
    LOD_CLOSE: path.join(expectedOutputRoot, assetPackage.lodRequirements.close.output),
    LOD_GAMEPLAY: path.join(
      expectedOutputRoot,
      assetPackage.lodRequirements.gameplay.output
    ),
    LOD_MAP: path.join(expectedOutputRoot, assetPackage.lodRequirements.map.output),
    LOD_DISTANT_SILHOUETTE: path.join(
      expectedOutputRoot,
      assetPackage.lodRequirements.distantSilhouette.output
    )
  };

  for (const [lodLabel, expectedPath] of Object.entries(expectedLodPaths)) {
    if (registration.lodReferences[lodLabel] !== expectedPath) {
      throw createValidationError(
        "lod_reference_mismatch",
        `Building coastal cottage GLB registration ${lodLabel} must match the approved prototype asset package export output.`
      );
    }
  }

  if (
    path.basename(registration.manifestReference) !==
      "building-coastal-cottage-manifest.json" ||
    path.basename(registration.metadataReference) !==
      "building-coastal-cottage-metadata.json"
  ) {
    throw createValidationError(
      "metadata_linkage_mismatch",
      "Building coastal cottage GLB import bridge must preserve the approved manifest and metadata filenames."
    );
  }

  validateFileExistence(registration, existsSync);

  if (
    previewBinding.renderPayload.primaryGlb !== registration.glbPath ||
    previewBinding.renderPayload.rendererAssetReference !== registration.assetId ||
    previewBinding.renderPayload.rendererProfile !== "custom-2.5d-passive"
  ) {
    throw createValidationError(
      "runtime_preview_binding_mismatch",
      "Building coastal cottage runtime preview binding must point to the registered primary GLB and passive renderer profile."
    );
  }
}

function validateFileExistence(registration, existsSync) {
  const requiredPaths = [
    registration.glbPath,
    ...Object.values(registration.lodReferences),
    registration.manifestReference,
    registration.metadataReference
  ];
  const missingPaths = requiredPaths.filter(
    (candidatePath) => !existsSync(candidatePath)
  );
  if (missingPaths.length > 0) {
    throw createValidationError(
      "glb_missing",
      `Building coastal cottage GLB import bridge requires existing files before registration: ${missingPaths.join(", ")}`
    );
  }
}

function normalizeBridgeFoundation(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "buildingCoastalCottageGlbImportBridgeFoundation"
  );
  for (const fieldName of buildingCoastalCottageGlbImportBridgeFoundationRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Building coastal cottage GLB import bridge is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    glbRegistration: normalizeGlbRegistration(definition.glbRegistration),
    runtimePreviewBinding: normalizeRuntimePreviewBinding(
      definition.runtimePreviewBinding
    )
  });
}

function normalizeGlbRegistration(rawValue) {
  const registration = asPlainObject(rawValue, "glbRegistration");
  return deepFreeze({
    assetId: normalizePermanentId(registration.assetId, "glbRegistration.assetId"),
    glbPath: normalizeRelativePath(registration.glbPath, "glbRegistration.glbPath"),
    lodReferences: normalizeLodReferences(registration.lodReferences),
    manifestReference: normalizeRelativePath(
      registration.manifestReference,
      "glbRegistration.manifestReference"
    ),
    metadataReference: normalizeRelativePath(
      registration.metadataReference,
      "glbRegistration.metadataReference"
    ),
    validationStatus: normalizeValidationStatus(registration.validationStatus)
  });
}

function normalizeRuntimePreviewBinding(rawValue) {
  const previewBinding = asPlainObject(rawValue, "runtimePreviewBinding");
  const renderPayload = asPlainObject(
    previewBinding.renderPayload,
    "runtimePreviewBinding.renderPayload"
  );
  const lodSelector = asPlainObject(
    previewBinding.lodSelector,
    "runtimePreviewBinding.lodSelector"
  );
  const appearanceProfile = normalizeString(
    previewBinding.appearanceProfile,
    "runtimePreviewBinding.appearanceProfile"
  ).toLowerCase();

  if (!supportedAppearanceProfiles.has(appearanceProfile)) {
    throw createValidationError(
      "invalid_appearance_profile",
      "Building coastal cottage runtime preview binding appearanceProfile must be supported."
    );
  }

  return deepFreeze({
    assetId: normalizePermanentId(
      previewBinding.assetId,
      "runtimePreviewBinding.assetId"
    ),
    renderPayload: deepFreeze({
      rendererAssetReference: normalizePermanentId(
        renderPayload.rendererAssetReference,
        "runtimePreviewBinding.renderPayload.rendererAssetReference"
      ),
      primaryGlb: normalizeRelativePath(
        renderPayload.primaryGlb,
        "runtimePreviewBinding.renderPayload.primaryGlb"
      ),
      rendererProfile: normalizeString(
        renderPayload.rendererProfile,
        "runtimePreviewBinding.renderPayload.rendererProfile"
      )
    }),
    lodSelector: deepFreeze({
      close: normalizeString(
        lodSelector.close,
        "runtimePreviewBinding.lodSelector.close"
      ),
      gameplay: normalizeString(
        lodSelector.gameplay,
        "runtimePreviewBinding.lodSelector.gameplay"
      ),
      map: normalizeString(lodSelector.map, "runtimePreviewBinding.lodSelector.map"),
      distantSilhouette: normalizeString(
        lodSelector.distantSilhouette,
        "runtimePreviewBinding.lodSelector.distantSilhouette"
      )
    }),
    appearanceProfile
  });
}

function normalizeLodReferences(rawValue) {
  const lodReferences = asPlainObject(rawValue, "glbRegistration.lodReferences");
  return deepFreeze({
    LOD_CLOSE: normalizeRelativePath(
      lodReferences.LOD_CLOSE,
      "glbRegistration.lodReferences.LOD_CLOSE"
    ),
    LOD_GAMEPLAY: normalizeRelativePath(
      lodReferences.LOD_GAMEPLAY,
      "glbRegistration.lodReferences.LOD_GAMEPLAY"
    ),
    LOD_MAP: normalizeRelativePath(
      lodReferences.LOD_MAP,
      "glbRegistration.lodReferences.LOD_MAP"
    ),
    LOD_DISTANT_SILHOUETTE: normalizeRelativePath(
      lodReferences.LOD_DISTANT_SILHOUETTE,
      "glbRegistration.lodReferences.LOD_DISTANT_SILHOUETTE"
    )
  });
}

function normalizeValidationStatus(rawValue) {
  const validationStatus = asPlainObject(rawValue, "glbRegistration.validationStatus");
  return deepFreeze({
    glbExistsValidated: normalizeBoolean(
      validationStatus.glbExistsValidated,
      "glbRegistration.validationStatus.glbExistsValidated"
    ),
    manifestLinked: normalizeBoolean(
      validationStatus.manifestLinked,
      "glbRegistration.validationStatus.manifestLinked"
    ),
    metadataLinked: normalizeBoolean(
      validationStatus.metadataLinked,
      "glbRegistration.validationStatus.metadataLinked"
    ),
    assetIdentityValidated: normalizeBoolean(
      validationStatus.assetIdentityValidated,
      "glbRegistration.validationStatus.assetIdentityValidated"
    ),
    exportValidated: normalizeBoolean(
      validationStatus.exportValidated,
      "glbRegistration.validationStatus.exportValidated"
    )
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent Asset Factory identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (normalized.startsWith("/")) {
    throw createValidationError(
      "invalid_relative_path",
      `${fieldName} must remain repository-relative.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError("invalid_boolean", `${fieldName} must be a boolean.`);
  }
  return value;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    glbImportBridge: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCoastalCottageGlbImportBridgeFoundationValidationError";
  error.code = code;
  return error;
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
