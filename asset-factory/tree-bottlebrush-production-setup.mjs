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

  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}

export const treeBottlebrushProductionSetupSchemaId =
  "TREE_BOTTLEBRUSH_PRODUCTION_SETUP_001";

export const treeBottlebrushProductionSetupDefinition = deepFreeze({
  assetId: "TREE_BOTTLEBRUSH_001",
  recipeId: "TREE_BOTTLEBRUSH_RECIPE_001",
  registryRecipeId: "RECIPE_NATURE_ROADSIDE_NATIVE_STANDARD_001",
  category: "nature",
  assetFamilyId: "TREE_ASSET_FAMILY_001",
  productionFamilyId: "COASTAL_NATURE_FAMILY_001",
  version: "v001",
  variantId: "DEFAULT",
  paletteId: "AU_BOTTLEBRUSH_NATIVE_001",
  lodProfile: "NATURE_STANDARD_001",
  identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
  blenderVersion: "Blender 4.2 LTS",
  outputLocation:
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
  expectedOutputs: deepFreeze({
    blend: "TREE_BOTTLEBRUSH_001_v001.blend",
    proofAssets: deepFreeze([
      "TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb",
      "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb",
      "TREE_BOTTLEBRUSH_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "tree-bottlebrush-manifest.json",
      "tree-bottlebrush-metadata.json",
      "tree-bottlebrush-validation.json"
    ]),
    lifecycleFiles: deepFreeze([
      "tree-bottlebrush-registration.json",
      "tree-bottlebrush-development-catalog-entry.json",
      "tree-bottlebrush-manual-visual-review.json"
    ])
  }),
  placeholderScripts: deepFreeze({
    generator:
      "asset-factory/local-blender-scripts/generate_tree_bottlebrush_001.py",
    exportResume:
      "asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py"
  }),
  visualTargets: deepFreeze([
    "GrowGo papercut 2.5D style",
    "lightweight mobile geometry",
    "Australian native vegetation identity",
    "road/trail placement suitability"
  ]),
  expectedLods: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
  reusableDependencies: deepFreeze([
    deepFreeze({
      dependencyId: "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
      category: "module",
      role: "trunk module",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
      category: "module",
      role: "branch module",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
      category: "module",
      role: "leaf cluster",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
      category: "module",
      role: "flower module",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    }),
    deepFreeze({
      dependencyId: "MOD_TREE_GROUND_SOCKET_001",
      category: "module",
      role: "ground socket",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    })
  ]),
  manualVisualReviewCriteria: deepFreeze([
    "papercut_2_5d_style",
    "australian_bottlebrush_identity",
    "mobile_lightweight_design",
    "road_trail_placement_suitability"
  ]),
  noBlenderLaunchFromCodex: true,
  setupOnly: true
});

export function buildTreeBottlebrushProductionSetup(
  rawDefinition = treeBottlebrushProductionSetupDefinition
) {
  const definition = normalizeDefinition(rawDefinition);
  const identityContract = buildAssetIdentityContract({
    assetId: definition.assetId,
    category: definition.category.toUpperCase(),
    recipeId: definition.recipeId,
    version: definition.version,
    variantId: definition.variantId,
    paletteId: definition.paletteId,
    lodProfile: definition.lodProfile,
    source: {
      generator: "Asset Factory",
      authoringTool: "Blender"
    },
    dependencies: definition.reusableDependencies.map((dependency) => ({
      dependencyId: dependency.dependencyId,
      category: dependency.category,
      identityPolicy: dependency.identityPolicy
    })),
    identityPolicy: definition.identityPolicy,
    identityAnchor: {
      componentRole: "IDENTITY_ANCHOR",
      required: true
    },
    anchorRequired: true,
    anchorValidation: "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
    exportedIdentitySource: "identity_anchor"
  });

  return deepFreeze({
    schemaId: treeBottlebrushProductionSetupSchemaId,
    assetId: definition.assetId,
    recipeDefinition: deepFreeze({
      assetId: definition.assetId,
      recipeId: definition.recipeId,
      registryRecipeId: definition.registryRecipeId,
      version: definition.version,
      variantId: definition.variantId,
      paletteId: definition.paletteId,
      lodProfile: definition.lodProfile,
      dependencies: definition.reusableDependencies
    }),
    identityContract,
    lodPlan: deepFreeze({
      expectedLods: definition.expectedLods,
      lodRoots: deepFreeze(
        definition.expectedLods.map((lodLabel) => ({
          lodLabel,
          rootName: createLodIdentityName(identityContract, lodLabel, "ROOT"),
          anchorName: createIdentityAnchorName(identityContract, lodLabel)
        }))
      )
    }),
    visualTargets: definition.visualTargets,
    reusableDependencies: definition.reusableDependencies,
    placeholderWorkflow: deepFreeze({
      generatorScript: definition.placeholderScripts.generator,
      exportWorkflowScript: definition.placeholderScripts.exportResume,
      validationRecordFilename: definition.expectedOutputs.metadataFiles[2],
      registrationRecordFilename: definition.expectedOutputs.lifecycleFiles[0],
      developmentCatalogFilename: definition.expectedOutputs.lifecycleFiles[1],
      visualReviewFilename: definition.expectedOutputs.lifecycleFiles[2],
      outputBlendFilename: definition.expectedOutputs.blend,
      outputGlbFilenames: definition.expectedOutputs.proofAssets
    }),
    manualVisualReviewCriteria: definition.manualVisualReviewCriteria,
    readiness: deepFreeze({
      recipeDefined: true,
      identityContractReady: true,
      lodPlanReady: true,
      dependenciesDeclared: true,
      placeholderGeneratorPrepared: true,
      placeholderExportWorkflowPrepared: true,
      validationPlaceholderPrepared: true,
      registrationPlaceholderPrepared: true,
      visualReviewPlaceholderPrepared: true,
      manualBlenderAuthoringReady: true,
      binaryOutputsCreated: false,
      publishingPrepared: false
    }),
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: definition.assetId,
          recipeId: definition.recipeId,
          identityContract,
          expectedOutputs: definition.expectedOutputs,
          dependencies: definition.reusableDependencies
        })
      )
      .digest("hex")
  });
}

export function validateTreeBottlebrushProductionSetup(
  rawDefinition = treeBottlebrushProductionSetupDefinition,
  options = {}
) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    const setup = buildTreeBottlebrushProductionSetup(definition);
    const cwd = options.cwd ?? process.cwd();
    const generatorScriptPath = path.resolve(cwd, definition.placeholderScripts.generator);
    const exportScriptPath = path.resolve(cwd, definition.placeholderScripts.exportResume);

    const checks = deepFreeze([
      deepFreeze({
        name: "generator_placeholder_exists",
        ok: fs.existsSync(generatorScriptPath)
      }),
      deepFreeze({
        name: "export_placeholder_exists",
        ok: fs.existsSync(exportScriptPath)
      }),
      deepFreeze({
        name: "three_required_lods_defined",
        ok:
          JSON.stringify(definition.expectedLods) ===
          JSON.stringify(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"])
      }),
      deepFreeze({
        name: "identity_anchor_required",
        ok: setup.identityContract.anchorRequired === true
      }),
      deepFreeze({
        name: "manual_authoring_ready",
        ok: setup.readiness.manualBlenderAuthoringReady === true
      }),
      deepFreeze({
        name: "binary_outputs_not_created",
        ok: setup.readiness.binaryOutputsCreated === false
      }),
      deepFreeze({
        name: "publishing_not_prepared",
        ok: setup.readiness.publishingPrepared === false
      })
    ]);

    return deepFreeze({
      ok: checks.every((check) => check.ok),
      setup,
      checks
    });
  } catch (error) {
    if (error?.name !== "TreeBottlebrushProductionSetupError") {
      throw error;
    }
    return deepFreeze({
      ok: false,
      setup: null,
      checks: deepFreeze([
        deepFreeze({
          name: error.code,
          ok: false,
          message: error.message
        })
      ])
    });
  }
}

function normalizeDefinition(rawDefinition) {
  if (!rawDefinition || typeof rawDefinition !== "object") {
    throw createSetupError("invalid_definition", "Bottlebrush setup definition must be an object.");
  }

  return deepFreeze({
    ...rawDefinition,
    visualTargets: deepFreeze([...rawDefinition.visualTargets]),
    expectedLods: deepFreeze([...rawDefinition.expectedLods]),
    reusableDependencies: deepFreeze(
      rawDefinition.reusableDependencies.map((dependency) => deepFreeze({ ...dependency }))
    ),
    manualVisualReviewCriteria: deepFreeze([...rawDefinition.manualVisualReviewCriteria]),
    expectedOutputs: deepFreeze({
      ...rawDefinition.expectedOutputs,
      proofAssets: deepFreeze([...rawDefinition.expectedOutputs.proofAssets]),
      metadataFiles: deepFreeze([...rawDefinition.expectedOutputs.metadataFiles]),
      lifecycleFiles: deepFreeze([...rawDefinition.expectedOutputs.lifecycleFiles])
    }),
    placeholderScripts: deepFreeze({ ...rawDefinition.placeholderScripts })
  });
}

function createSetupError(code, message) {
  const error = new Error(message);
  error.name = "TreeBottlebrushProductionSetupError";
  error.code = code;
  return error;
}
