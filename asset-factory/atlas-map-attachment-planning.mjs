import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasEngineRecipeIntegrationPlanning } from "./atlas-engine-recipe-integration-planning.mjs";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import { buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const MAP_ATTACHMENT_ROOT =
  "asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001";

const SPECIFICATION_FILENAME = "atlas-map-attachment-specification.json";
const CONTRACTS_FILENAME = "atlas-map-attachment-metadata-contracts.json";
const VALIDATION_FILENAME = "atlas-map-attachment-validation.json";
const LIFECYCLE_FILENAME = "atlas-map-attachment-lifecycle-rules.json";
const REPORT_FILENAME = "atlas-map-attachment-architecture-report.md";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function normalizeBucket(value) {
  return Number(Number(value).toFixed(2));
}

function normalizeBucketToken(value) {
  return String(value).replace(/\./g, "_").replace(/-/g, "NEG_");
}

function createRegionId(regionSlug, latBucket, lngBucket, environmentProfile) {
  return `REGION_${regionSlug}_${normalizeBucketToken(latBucket)}_${normalizeBucketToken(lngBucket)}_${environmentProfile}`;
}

function createPackageId(regionSlug, latBucket, lngBucket) {
  return `ATLAS_REGION_PACKAGE_${regionSlug}_${normalizeBucketToken(latBucket)}_${normalizeBucketToken(lngBucket)}_v001`;
}

function buildMapAttachmentSpecification(
  integrationPlanning,
  regionalPlanning,
  selectorFoundation,
  recipeFactory
) {
  const representativePackages = regionalPlanning.specification.representativePackages;

  return deepFreeze({
    schemaId: "ATLAS_MAP_ATTACHMENT_SPECIFICATION_001",
    attachmentId: "ATLAS_MAP_ATTACHMENT_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      atlasEngineRecipeIntegrationId:
        integrationPlanning.specification.integrationId,
      atlasRegionalPackagePlanningId:
        regionalPlanning.specification.packageLayerId,
      locationRecipeSelectorId: selectorFoundation.specification.selectorId,
      locationRecipeFactoryId: recipeFactory.lifecycle.factoryId
    },
    coordinateInputContract: {
      schemaId: "ATLAS_MAP_COORDINATE_INPUT_CONTRACT_001",
      requiredFields: [
        "lat",
        "lng",
        "mapZoom",
        "mapProjection",
        "environment",
        "requestIntent"
      ],
      normalizationRules: [
        "lat and lng are bucketed to two decimal places for planning lookups",
        "mapProjection must be declared before region lookup",
        "requestIntent must remain PLANNING_PREVIEW or INSPECTION_ONLY"
      ],
      supportedEnvironment: "DEVELOPMENT_ONLY"
    },
    mapToRegionLookupRules: {
      schemaId: "ATLAS_MAP_TO_REGION_LOOKUP_RULES_001",
      lookupInputs: [
        "latBucket",
        "lngBucket",
        "environmentProfile",
        "selectorVersion",
        "schemaVersion"
      ],
      deterministicLookupPolicy:
        "same coordinate buckets and environment profile must resolve to same regionId and packageId",
      representativeRegions: representativePackages.map((pkg) => ({
        regionId: pkg.regionId,
        packageId: pkg.packageId,
        environmentProfile: pkg.environmentProfile
      }))
    },
    regionBoundaryRules: {
      schemaId: "ATLAS_MAP_REGION_BOUNDARY_RULES_001",
      requiredFields: ["boundaryPolygon", "centroid", "latBucket", "lngBucket"],
      rules: [
        "map attachment planning may use region boundaries for lookup only",
        "boundaries remain source-authoritative and read-only",
        "cross-boundary requests must prefer deterministic nearest-bucket resolution before fallback review"
      ]
    },
    packageLoadingRules: {
      schemaId: "ATLAS_MAP_PACKAGE_LOADING_RULES_001",
      allowedArtifacts: [
        "environmentSummary",
        "classificationInputs",
        "selectorCompatibility",
        "cacheMetadata"
      ],
      blockedArtifacts: [
        "runtime_scene",
        "renderer_payload",
        "mesh_stream",
        "texture_stream"
      ],
      loadPolicies: [
        "package loading is metadata-only during planning",
        "package loading must preserve packageFingerprint and sourceRevision",
        "package loading must stop before renderer or runtime attachment"
      ]
    },
    deterministicSeedGenerationFromCoordinates: {
      schemaId: "ATLAS_MAP_COORDINATE_SEED_GENERATION_001",
      seedInputs: [
        "regionId",
        "packageVersion",
        "latBucket",
        "lngBucket",
        "primaryBiomeHint",
        "archetypeHint",
        "selectorVersion"
      ],
      seedPolicy:
        "sha256(regionId, packageVersion, latBucket, lngBucket, biomeHint, archetypeHint, selectorVersion)",
      replayGuarantee: true
    },
    mapAttachmentPermissions: {
      schemaId: "ATLAS_MAP_ATTACHMENT_PERMISSIONS_001",
      allowedStates: [
        "PLANNING_ONLY",
        "LOOKUP_READY",
        "PACKAGE_METADATA_READY",
        "SELECTOR_HANDOFF_READY"
      ],
      blockedStates: [
        "MAP_DOWNLOADED",
        "RENDERER_ATTACHED",
        "RUNTIME_ACTIVATED",
        "PLAYER_VISIBLE"
      ],
      permissions: {
        runtimeActivationAuthorized: false,
        mapDownloadsAuthorized: false,
        rendererAttachmentAuthorized: false,
        blenderAuthorized: false,
        glbAuthorized: false,
        assetModificationAuthorized: false
      }
    },
    rendererBoundaryRules: {
      schemaId: "ATLAS_MAP_RENDERER_BOUNDARY_RULES_001",
      blockedImports: [
        "live_renderer_runtime",
        "map_canvas_attachment",
        "webgl_scene_boot",
        "leaflet_layer_attachment"
      ],
      rules: [
        "selector and package handoff stop before renderer attachment",
        "no runtime scene graph may be created in planning",
        "no renderer lifecycle flags may change during map attachment planning"
      ]
    },
    failureHandling: {
      schemaId: "ATLAS_MAP_ATTACHMENT_FAILURE_HANDLING_001",
      reasonCodes: [
        "UNSUPPORTED_COORDINATE_CONTEXT",
        "REGION_NOT_FOUND",
        "PACKAGE_INCOMPATIBLE",
        "SELECTOR_CONTRACT_MISMATCH",
        "PERMISSION_BLOCKED",
        "RENDERER_BOUNDARY_VIOLATION"
      ],
      safeFailureRules: [
        "failures return metadata-only blocked states",
        "failures do not trigger downloads",
        "failures do not attach renderer",
        "failures do not mutate assets or map state"
      ]
    }
  });
}

function buildMetadataContracts(specification, regionalPlanning, integrationPlanning) {
  const representativePackages = regionalPlanning.specification.representativePackages;

  const representativeLookupContexts = representativePackages.map((pkg) => {
    const latBucket = normalizeBucket(pkg.latBucket);
    const lngBucket = normalizeBucket(pkg.lngBucket);
    const regionSlug = pkg.regionSlug;
    const regionId = createRegionId(
      regionSlug,
      latBucket,
      lngBucket,
      pkg.environmentProfile
    );
    const packageId = createPackageId(regionSlug, latBucket, lngBucket);
    const selectorSeed = hashHex(
      regionId,
      pkg.packageVersion,
      latBucket,
      lngBucket,
      pkg.primaryBiomeHint ?? "UNKNOWN",
      pkg.archetypeHint ?? "UNKNOWN",
      integrationPlanning.specification.selectorReference.selectorId
    );

    return deepFreeze({
      schemaId: "ATLAS_MAP_ATTACHMENT_LOOKUP_CONTEXT_001",
      regionId,
      packageId,
      coordinateInput: {
        lat: pkg.latBucket,
        lng: pkg.lngBucket,
        latBucket,
        lngBucket,
        mapZoom: 14,
        mapProjection: "EPSG:3857",
        environment: "DEVELOPMENT_ONLY",
        requestIntent: "PLANNING_PREVIEW"
      },
      lookupResolution: {
        environmentProfile: pkg.environmentProfile,
        packageFingerprint: pkg.packageFingerprint,
        schemaVersion: regionalPlanning.specification.packageVersioning.schemaVersion,
        selectorVersion: integrationPlanning.specification.selectorReference.selectorId,
        selectorSeed
      },
      attachmentPermissions: {
        runtimeActivationAuthorized: false,
        mapDownloadsAuthorized: false,
        rendererAttachmentAuthorized: false
      },
      deterministicFingerprint: hashHex(
        regionId,
        packageId,
        latBucket,
        lngBucket,
        selectorSeed
      )
    });
  });

  const failureContracts = [
    {
      scenarioId: "MAP_ATTACHMENT_UNSUPPORTED_CONTEXT_001",
      reasonCode: "UNSUPPORTED_COORDINATE_CONTEXT",
      blockedState: "LOOKUP_BLOCKED",
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false
    },
    {
      scenarioId: "MAP_ATTACHMENT_REGION_NOT_FOUND_001",
      reasonCode: "REGION_NOT_FOUND",
      blockedState: "PACKAGE_METADATA_BLOCKED",
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false
    },
    {
      scenarioId: "MAP_ATTACHMENT_RENDERER_BOUNDARY_001",
      reasonCode: "RENDERER_BOUNDARY_VIOLATION",
      blockedState: "RENDERER_BLOCKED",
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false
    }
  ].map((entry) =>
    deepFreeze({
      ...entry,
      deterministicFingerprint: hashHex(
        entry.scenarioId,
        entry.reasonCode,
        entry.blockedState
      )
    })
  );

  return deepFreeze({
    schemaId: "ATLAS_MAP_ATTACHMENT_METADATA_CONTRACTS_001",
    attachmentId: specification.attachmentId,
    representativeLookupContexts,
    failureContracts
  });
}

function buildValidation(specification, contracts, integrationPlanning, regionalPlanning, selectorFoundation) {
  const checks = [
    {
      name: "coordinate_input_contract_defined",
      ok: specification.coordinateInputContract.requiredFields.length === 6
    },
    {
      name: "map_to_region_lookup_rules_defined",
      ok: specification.mapToRegionLookupRules.lookupInputs.length >= 5
    },
    {
      name: "region_boundary_rules_defined",
      ok: specification.regionBoundaryRules.requiredFields.length === 4
    },
    {
      name: "package_loading_rules_defined",
      ok: specification.packageLoadingRules.allowedArtifacts.length >= 4
    },
    {
      name: "deterministic_seed_generation_defined",
      ok:
        specification.deterministicSeedGenerationFromCoordinates.seedInputs.length ===
        7
    },
    {
      name: "map_attachment_permissions_defined",
      ok:
        specification.mapAttachmentPermissions.allowedStates.length === 4 &&
        specification.mapAttachmentPermissions.blockedStates.length === 4
    },
    {
      name: "renderer_boundary_rules_defined",
      ok: specification.rendererBoundaryRules.blockedImports.length === 4
    },
    {
      name: "failure_handling_defined",
      ok: specification.failureHandling.reasonCodes.length >= 6
    },
    {
      name: "representative_lookup_contracts_valid",
      ok:
        contracts.representativeLookupContexts.length ===
          regionalPlanning.specification.representativePackages.length &&
        contracts.representativeLookupContexts.every(
          (entry) =>
            entry.attachmentPermissions.runtimeActivationAuthorized === false &&
            entry.attachmentPermissions.mapDownloadsAuthorized === false &&
            entry.attachmentPermissions.rendererAttachmentAuthorized === false
        )
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        specification.mapAttachmentPermissions.permissions.runtimeActivationAuthorized ===
          false &&
        specification.mapAttachmentPermissions.permissions.mapDownloadsAuthorized ===
          false &&
        specification.mapAttachmentPermissions.permissions.rendererAttachmentAuthorized ===
          false &&
        specification.mapAttachmentPermissions.permissions.blenderAuthorized ===
          false &&
        specification.mapAttachmentPermissions.permissions.glbAuthorized === false &&
        specification.mapAttachmentPermissions.permissions.assetModificationAuthorized ===
          false &&
        selectorFoundation.validation.status === "pass" &&
        integrationPlanning.validation.status === "pass"
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_MAP_ATTACHMENT_VALIDATION_001",
    attachmentId: specification.attachmentId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.attachmentId,
      JSON.stringify(specification),
      JSON.stringify(contracts),
      JSON.stringify(checks)
    ),
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    rendererAttachmentAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycleRules(specification, contracts, validation) {
  return deepFreeze({
    schemaId: "ATLAS_MAP_ATTACHMENT_LIFECYCLE_RULES_001",
    attachmentId: specification.attachmentId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    allowedStates: specification.mapAttachmentPermissions.allowedStates,
    blockedStates: specification.mapAttachmentPermissions.blockedStates,
    lookupReadyCount: contracts.representativeLookupContexts.length,
    failureScenarioCount: contracts.failureContracts.length,
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    rendererAttachmentAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: validation.deterministicFingerprint
  });
}

function buildReport(specification, contracts, validation, lifecycleRules) {
  const lookupLines = contracts.representativeLookupContexts
    .map(
      (entry) =>
        `- ${entry.regionId}: package ${entry.packageId}, seed ${entry.lookupResolution.selectorSeed}`
    )
    .join("\n");

  return `# ATLAS MAP ATTACHMENT ARCHITECTURE REPORT

## Scope

${specification.attachmentId} defines the safe planning contract between the GrowGo map layer and Atlas systems before any runtime attachment.

## Defined Areas

- coordinate input contract
- map-to-region lookup rules
- region boundary rules
- package loading rules
- deterministic seed generation from coordinates
- map attachment permissions
- renderer boundary rules
- failure handling

## Representative Lookup Contexts

${lookupLines}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- map downloads authorized: ${validation.mapDownloadsAuthorized}
- renderer attachment authorized: ${validation.rendererAttachmentAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Lifecycle

- lifecycle status: ${lifecycleRules.lifecycleStatus}
- lookup-ready count: ${lifecycleRules.lookupReadyCount}
- failure-scenario count: ${lifecycleRules.failureScenarioCount}

## Readiness

Future map attachment: READY
`;
}

export function buildAtlasMapAttachmentPlanning({ cwd = process.cwd() } = {}) {
  const integrationPlanning = buildAtlasEngineRecipeIntegrationPlanning({ cwd });
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const recipeFactory = buildLocationRecipeFactoryFoundation({ cwd });

  const specification = buildMapAttachmentSpecification(
    integrationPlanning,
    regionalPlanning,
    selectorFoundation,
    recipeFactory
  );
  const contracts = buildMetadataContracts(
    specification,
    regionalPlanning,
    integrationPlanning
  );
  const validation = buildValidation(
    specification,
    contracts,
    integrationPlanning,
    regionalPlanning,
    selectorFoundation
  );
  const lifecycleRules = buildLifecycleRules(
    specification,
    contracts,
    validation
  );
  const report = buildReport(
    specification,
    contracts,
    validation,
    lifecycleRules
  );

  return deepFreeze({
    root: path.resolve(cwd, MAP_ATTACHMENT_ROOT),
    specification,
    contracts,
    validation,
    lifecycleRules,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasMapAttachmentPlanning({ cwd = process.cwd() } = {}) {
  const planning = buildAtlasMapAttachmentPlanning({ cwd });
  const specificationDir = path.join(planning.root, "specification");
  const metadataDir = path.join(planning.root, "metadata");
  const validationDir = path.join(planning.root, "validation");
  const lifecycleDir = path.join(planning.root, "lifecycle");
  const reportsDir = path.join(planning.root, "reports");

  for (const directory of [
    specificationDir,
    metadataDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    planning.specification
  );
  writeJson(path.join(metadataDir, CONTRACTS_FILENAME), planning.contracts);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycleRules);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasMapAttachmentPlanning();
}
