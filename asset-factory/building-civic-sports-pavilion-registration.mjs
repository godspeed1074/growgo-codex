import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import {
  buildingCivicSportsPavilionProductionRunDefinition,
  verifyBuildingCivicSportsPavilionOutputs
} from "./building-civic-sports-pavilion-production-run.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}

export function buildBuildingCivicSportsPavilionRegistrationRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, {
    cwd
  });

  if (!verification.registrationGate.ready) {
    throw createRegistrationError(
      "registration_gate_blocked",
      `Cannot register ${definition.assetId} until final pavilion outputs validate.`
    );
  }

  const registry = createAssetFactoryRegistryLayer();
  const registeredAsset = registry.getAssetById(definition.assetId);
  if (!registeredAsset) {
    throw createRegistrationError(
      "missing_registry_asset",
      `Asset ${definition.assetId} is not present in the Asset Factory registry layer.`
    );
  }

  const manifest = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json"),
    "pavilion manifest"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json"),
    "pavilion metadata"
  );
  const validation = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-validation.json"),
    "pavilion validation"
  );

  const sourceBlendFilename = "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend";
  const sourceBlendPath = path.join(outputDirectory, sourceBlendFilename);
  const sourceBlendStats = fs.statSync(sourceBlendPath);

  const lods = Object.fromEntries(
    Object.entries(manifest.verifiedOutputs ?? {}).map(([lod, value]) => [
      lod,
      deepFreeze({
        ...value,
        relativePath: path.join(
          "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export",
          value.filename
        )
      })
    ])
  );

  return deepFreeze({
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    familyId: definition.familyId,
    version: registeredAsset.version,
    registrationStatus: "registered",
    validationStatus: "validated",
    publishStatus: "not_published",
    readyForApproval: true,
    readyForPublishing: false,
    registeredAt: options.registrationDate ?? "2026-07-28",
    sourceBlend: deepFreeze({
      filename: sourceBlendFilename,
      relativePath:
        "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend",
      sizeBytes: sourceBlendStats.size
    }),
    registry: deepFreeze({
      assetId: registeredAsset.assetId,
      assetFamily: registeredAsset.assetFamily,
      assetType: registeredAsset.assetType,
      recipeId: registeredAsset.recipeId,
      atlasCompatibility: registeredAsset.atlasCompatibility,
      footprintCompatibility: registeredAsset.footprintCompatibility ?? []
    }),
    verifiedOutputs: lods,
    verification: deepFreeze({
      fingerprint: manifest.verificationFingerprint,
      outputVerification: Object.fromEntries(
        Object.entries(validation.outputVerification ?? {}).filter(
          ([filename]) => filename !== "building-civic-sports-pavilion-registration.json"
        )
      ),
      registrationReady: validation.registrationReady === true,
      finalGlbVerificationPassed: validation.finalGlbVerificationPassed === true,
      noExternalDependencies: validation.noExternalDependencies === true,
      lodComplexityCheck: validation.lodComplexityCheck
    }),
    preservedContracts: deepFreeze({
      assetIdPreserved: validation.assetIdPreserved === true,
      recipePreserved: validation.recipePreserved === true,
      sourceBlendReference: metadata.sourceBlendReference ?? sourceBlendFilename
    }),
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: definition.assetId,
          recipeId: definition.recipeId,
          version: registeredAsset.version,
          lods,
          verificationFingerprint: manifest.verificationFingerprint
        })
      )
      .digest("hex")
  });
}

export function writeBuildingCivicSportsPavilionRegistrationRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const record = buildBuildingCivicSportsPavilionRegistrationRecord(rawDefinition, options);
  const registrationPath = path.join(
    outputDirectory,
    "building-civic-sports-pavilion-registration.json"
  );

  fs.writeFileSync(registrationPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    registrationPath,
    record
  });
}

function readJsonRequired(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createRegistrationError(
      "missing_required_record",
      `Missing ${label} at ${absolutePath}.`
    );
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  return deepFreeze({
    assetId: normalizeString(definition.assetId, "assetId"),
    recipeId: normalizeString(definition.recipeId, "recipeId"),
    familyId: normalizeString(definition.familyId, "familyId"),
    outputLocation: normalizeString(definition.outputLocation, "outputLocation")
  });
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createRegistrationError(
      "invalid_registration_definition",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function createRegistrationError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionRegistrationError";
  error.code = code;
  return error;
}
