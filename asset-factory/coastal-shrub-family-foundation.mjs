import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  buildAssetIdentityContract,
  createIdentityAnchorName,
  createLodIdentityName
} from "./asset-identity-contract.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

export const coastalShrubFamilyFoundationSchemaId =
  "COASTAL_SHRUB_FAMILY_FOUNDATION_001";

export const coastalShrubFamilyFoundationDefinition = deepFreeze({
  familyId: "COASTAL_SHRUB_FAMILY_001",
  category: "nature",
  status: "foundation_only",
  referencePipelineAssets: deepFreeze([
    "TREE_EUCALYPTUS_001",
    "TREE_BOTTLEBRUSH_001"
  ]),
  primaryAsset: deepFreeze({
    assetId: "SHRUB_COASTAL_LOW_001",
    recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
    version: "v001",
    variantId: "DEFAULT",
    paletteId: "AU_COASTAL_SHRUB_NATIVE_001",
    lodProfile: "NATURE_STANDARD_001",
    identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
  }),
  recipePlaceholders: deepFreeze([
    deepFreeze({
      recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
      role: "PRIMARY_LOW_SHRUB",
      status: "placeholder",
      variantId: "DEFAULT"
    }),
    deepFreeze({
      recipeId: "SHRUB_COASTAL_FLOWERING_RECIPE_001",
      role: "FLOWERING_VARIANT",
      status: "reserved_placeholder",
      variantId: "FLOWERING"
    }),
    deepFreeze({
      recipeId: "SHRUB_COASTAL_WINDSWEPT_RECIPE_001",
      role: "WINDSWEPT_VARIANT",
      status: "reserved_placeholder",
      variantId: "WINDSWEPT"
    })
  ]),
  reusableDependencyPlaceholders: deepFreeze([
    deepFreeze({
      dependencyId: "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
      category: "module",
      role: "branch cluster",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
      category: "module",
      role: "foliage cluster",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_SHRUB_FLOWER_CLUSTER_COASTAL_001",
      category: "module",
      role: "optional flower cluster",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_SHRUB_GROUND_SOCKET_COASTAL_001",
      category: "module",
      role: "ground socket",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    })
  ]),
  expectedLods: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
  expectedFutureOutputs: deepFreeze({
    blend: "SHRUB_COASTAL_LOW_001_v001.blend",
    glbs: deepFreeze([
      "SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb",
      "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb",
      "SHRUB_COASTAL_LOW_001_LOD_MAP.glb"
    ]),
    metadata: deepFreeze([
      "shrub-coastal-low-manifest.json",
      "shrub-coastal-low-metadata.json",
      "shrub-coastal-low-validation.json"
    ])
  }),
  productionRoot:
    "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001",
  folderStructure: deepFreeze([
    "source",
    "export",
    "validation"
  ]),
  visualTargets: deepFreeze([
    "GrowGo papercut 2.5D style",
    "low coastal wind-shaped silhouette",
    "Australian native coastal vegetation identity",
    "lightweight mobile geometry",
    "road trail dune and reserve-edge placement suitability"
  ]),
  validationExpectations: deepFreeze([
    "asset_identity_preserved",
    "recipe_identity_preserved",
    "dependency_identity_preserved",
    "metadata_identity_preserved",
    "identity_anchor_present_per_lod",
    "no_external_dependencies",
    "triangles_close_gt_gameplay_gt_map",
    "meshes_close_gte_gameplay_gte_map",
    "primitives_close_gte_gameplay_gte_map",
    "deterministic_export",
    "manual_visual_review_required_before_approval",
    "publishing_blocked_until_explicit_phase"
  ]),
  authoringState: deepFreeze({
    blenderGeneratorCreated: false,
    blenderLaunched: false,
    blendCreated: false,
    glbsCreated: false,
    registrationCreated: false,
    visualApprovalCreated: false,
    publishingPrepared: false,
    runtimeActivationPrepared: false
  })
});

export function buildCoastalShrubFamilyFoundation(
  rawDefinition = coastalShrubFamilyFoundationDefinition
) {
  const definition = normalizeDefinition(rawDefinition);
  const asset = definition.primaryAsset;
  const identityContract = buildAssetIdentityContract({
    assetId: asset.assetId,
    category: definition.category.toUpperCase(),
    recipeId: asset.recipeId,
    version: asset.version,
    variantId: asset.variantId,
    paletteId: asset.paletteId,
    lodProfile: asset.lodProfile,
    source: {
      generator: "Asset Factory",
      authoringTool: "Blender"
    },
    dependencies: definition.reusableDependencyPlaceholders.map(
      ({ dependencyId, category, identityPolicy }) => ({
        dependencyId,
        category,
        identityPolicy
      })
    ),
    identityPolicy: asset.identityPolicy,
    identityAnchor: {
      componentRole: "IDENTITY_ANCHOR",
      required: true
    },
    anchorRequired: true,
    anchorValidation: "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
    exportedIdentitySource: "identity_anchor"
  });
  const lodPlan = definition.expectedLods.map((lodLabel) => ({
    lodLabel,
    rootName: createLodIdentityName(identityContract, lodLabel, "ROOT"),
    anchorName: createIdentityAnchorName(identityContract, lodLabel)
  }));

  return deepFreeze({
    schemaId: coastalShrubFamilyFoundationSchemaId,
    familyId: definition.familyId,
    category: definition.category,
    status: definition.status,
    referencePipelineAssets: definition.referencePipelineAssets,
    assetIdentitySpecification: deepFreeze({
      assetId: asset.assetId,
      familyId: definition.familyId,
      identityContract,
      lodPlan: deepFreeze(lodPlan)
    }),
    recipePlaceholders: definition.recipePlaceholders,
    reusableDependencyPlaceholders:
      definition.reusableDependencyPlaceholders,
    expectedFutureOutputs: definition.expectedFutureOutputs,
    productionStructure: deepFreeze({
      root: definition.productionRoot,
      folders: definition.folderStructure
    }),
    visualTargets: definition.visualTargets,
    validationExpectations: definition.validationExpectations,
    authoringState: definition.authoringState,
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          familyId: definition.familyId,
          asset,
          recipePlaceholders: definition.recipePlaceholders,
          dependencies: definition.reusableDependencyPlaceholders,
          expectedLods: definition.expectedLods,
          validationExpectations: definition.validationExpectations
        })
      )
      .digest("hex")
  });
}

export function validateCoastalShrubFamilyFoundation(
  rawDefinition = coastalShrubFamilyFoundationDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const foundation = buildCoastalShrubFamilyFoundation(definition);
  const cwd = options.cwd ?? process.cwd();
  const productionRoot = path.resolve(cwd, definition.productionRoot);
  const expectedDirectories = definition.folderStructure.map((folder) =>
    path.join(productionRoot, folder)
  );
  const binaryFiles = fs.existsSync(productionRoot)
    ? walkFiles(productionRoot).filter((filename) =>
        [".blend", ".glb"].includes(path.extname(filename).toLowerCase())
      )
    : [];
  const checks = deepFreeze([
    deepFreeze({
      name: "reference_pipeline_assets_declared",
      ok:
        definition.referencePipelineAssets.includes("TREE_EUCALYPTUS_001") &&
        definition.referencePipelineAssets.includes("TREE_BOTTLEBRUSH_001")
    }),
    deepFreeze({
      name: "queued_primary_asset_identity_preserved",
      ok:
        definition.primaryAsset.assetId === "SHRUB_COASTAL_LOW_001" &&
        definition.primaryAsset.recipeId === "SHRUB_COASTAL_LOW_RECIPE_001"
    }),
    deepFreeze({
      name: "identity_anchor_required",
      ok: foundation.assetIdentitySpecification.identityContract.anchorRequired === true
    }),
    deepFreeze({
      name: "three_lods_reserved",
      ok:
        JSON.stringify(definition.expectedLods) ===
        JSON.stringify(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
    }),
    deepFreeze({
      name: "recipe_placeholders_declared",
      ok:
        definition.recipePlaceholders.length >= 1 &&
        definition.recipePlaceholders.every(
          (recipe) =>
            recipe.status === "placeholder" ||
            recipe.status === "reserved_placeholder"
        )
    }),
    deepFreeze({
      name: "production_folders_exist",
      ok:
        fs.existsSync(productionRoot) &&
        expectedDirectories.every((directory) => fs.existsSync(directory))
    }),
    deepFreeze({
      name: "binary_state_compatible_with_validation_phase",
      ok:
        binaryFiles.length === 0 ||
        options.allowGeneratedBinaries === true
    }),
    deepFreeze({
      name: "authoring_and_publishing_inactive",
      ok: Object.values(definition.authoringState).every((value) => value === false)
    })
  ]);

  return deepFreeze({
    schemaId: "COASTAL_SHRUB_FAMILY_FOUNDATION_VALIDATION_001",
    ok: checks.every((check) => check.ok),
    checks,
    binaryFiles: deepFreeze(binaryFiles),
    foundation
  });
}

function normalizeDefinition(rawDefinition) {
  if (
    !rawDefinition?.familyId ||
    !rawDefinition?.primaryAsset?.assetId ||
    !rawDefinition?.primaryAsset?.recipeId
  ) {
    throw new Error("Coastal shrub family foundation definition was incomplete.");
  }
  return deepFreeze({ ...rawDefinition });
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
  });
}
