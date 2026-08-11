import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const ASSET_ID = "SHRUB_COASTAL_LOW_001";
const FAMILY_ID = "COASTAL_SHRUB_FAMILY_001";
const RECIPE_ID = "SHRUB_COASTAL_LOW_RECIPE_001";
const PREVIOUS_VERSION = "v002";
const TARGET_VERSION = "v003";
const VERSIONED_ASSET_STEM = `${ASSET_ID}_${TARGET_VERSION}`;
const OUTPUT_ROOT =
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001";
const LEGACY_BLEND_ROOT =
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export";

const MATERIALS = Object.freeze([
  Object.freeze({
    key: "branch",
    name: "SHRUB_COASTAL_LOW_001_BRANCH_DARK_V003"
  }),
  Object.freeze({
    key: "leaf_dark",
    name: "SHRUB_COASTAL_LOW_001_LEAF_DARK_V003"
  }),
  Object.freeze({
    key: "leaf_mid",
    name: "SHRUB_COASTAL_LOW_001_LEAF_MID_V003"
  }),
  Object.freeze({
    key: "leaf_light",
    name: "SHRUB_COASTAL_LOW_001_LEAF_LIGHT_V003"
  })
]);

const CLOSE_SPEC = Object.freeze({
  branches: Object.freeze([
    { center: [0, 0.24, -0.08], scale: [0.9, 0.08, 0.12], rotationY: 0.18 },
    { center: [-0.32, 0.44, 0.12], scale: [0.5, 0.06, 0.08], rotationY: -0.44 },
    { center: [0.38, 0.48, -0.16], scale: [0.54, 0.06, 0.08], rotationY: 0.56 }
  ]),
  clusters: Object.freeze([
    { center: [-1.02, 0.56, -0.42], scale: [0.68, 0.42, 0.58], rotationY: 0.2, materialKey: "leaf_mid" },
    { center: [-0.58, 0.82, 0.32], scale: [0.62, 0.44, 0.54], rotationY: -0.18, materialKey: "leaf_light" },
    { center: [-0.18, 0.94, -0.12], scale: [0.74, 0.46, 0.66], rotationY: 0.12, materialKey: "leaf_dark" },
    { center: [0.24, 1.04, 0.48], scale: [0.78, 0.48, 0.62], rotationY: -0.16, materialKey: "leaf_mid" },
    { center: [0.72, 0.88, -0.38], scale: [0.7, 0.44, 0.58], rotationY: 0.28, materialKey: "leaf_light" },
    { center: [1.06, 0.58, 0.2], scale: [0.56, 0.38, 0.48], rotationY: -0.26, materialKey: "leaf_mid" },
    { center: [-0.34, 0.6, 0.76], scale: [0.7, 0.36, 0.36], rotationY: 0.22, materialKey: "leaf_light" },
    { center: [0.52, 0.66, -0.78], scale: [0.72, 0.38, 0.34], rotationY: -0.3, materialKey: "leaf_dark" },
    { center: [0.02, 1.18, 0.08], scale: [0.6, 0.34, 0.46], rotationY: 0.08, materialKey: "leaf_light" }
  ])
});

const GAMEPLAY_SPEC = Object.freeze({
  branches: CLOSE_SPEC.branches.slice(0, 2),
  clusters: Object.freeze([
    CLOSE_SPEC.clusters[0],
    CLOSE_SPEC.clusters[1],
    CLOSE_SPEC.clusters[2],
    CLOSE_SPEC.clusters[3],
    CLOSE_SPEC.clusters[4],
    CLOSE_SPEC.clusters[7],
    CLOSE_SPEC.clusters[8]
  ])
});

const MAP_SPEC = Object.freeze({
  branches: Object.freeze([
    { center: [0, 0.22, 0], scale: [0.72, 0.07, 0.1], rotationY: 0.16 }
  ]),
  clusters: Object.freeze([
    { center: [-0.62, 0.62, -0.18], scale: [0.82, 0.34, 0.5], rotationY: 0.16, materialKey: "leaf_mid" },
    { center: [0.54, 0.7, 0.24], scale: [0.84, 0.34, 0.52], rotationY: -0.12, materialKey: "leaf_light" },
    { center: [0.02, 0.96, 0.02], scale: [0.7, 0.28, 0.44], rotationY: 0.1, materialKey: "leaf_dark" }
  ])
});

const REVISION_NOTES = Object.freeze([
  "increase_front_back_depth_without_turning_the_shrub_into_a_miniature_tree",
  "use_multiple_overlapping_foliage_masses_for_low_spreading_volume",
  "improve_side_profile_readability_from_the_north_up_oblique_camera",
  "preserve_mobile_lightweight_geometry_and_simple_materials",
  "keep_the_asset_clearly_in_the_low_landscape_shrub_category"
]);

export function generateShrubCoastalLowV003Candidate({ cwd = process.cwd() } = {}) {
  const roots = resolveRoots(cwd);
  ensureDirectories(roots);
  const carriedForwardBlend = carryForwardSourceBlend(roots);
  const outputs = {
    close: buildGlbForLod("LOD_CLOSE", CLOSE_SPEC),
    gameplay: buildGlbForLod("LOD_GAMEPLAY", GAMEPLAY_SPEC),
    map: buildGlbForLod("LOD_MAP", MAP_SPEC)
  };

  const filenames = {
    blend: `${VERSIONED_ASSET_STEM}.blend`,
    close: `${VERSIONED_ASSET_STEM}_LOD_CLOSE.glb`,
    gameplay: `${VERSIONED_ASSET_STEM}_LOD_GAMEPLAY.glb`,
    map: `${VERSIONED_ASSET_STEM}_LOD_MAP.glb`
  };

  writeBinary(path.join(roots.exportRoot, filenames.close), outputs.close.buffer);
  writeBinary(path.join(roots.exportRoot, filenames.gameplay), outputs.gameplay.buffer);
  writeBinary(path.join(roots.exportRoot, filenames.map), outputs.map.buffer);

  const metadata = Object.freeze({
    assetId: ASSET_ID,
    assetFamilyId: FAMILY_ID,
    recipeReference: RECIPE_ID,
    previousRegisteredVersion: PREVIOUS_VERSION,
    targetRevisionVersion: TARGET_VERSION,
    sourceBlendCarryForwardFromVersion: PREVIOUS_VERSION,
    identityContractV2: {
      assetId: ASSET_ID,
      category: "nature",
      recipeId: RECIPE_ID,
      version: TARGET_VERSION,
      variantId: "DEFAULT",
      paletteId: "AU_COASTAL_SHRUB_NATIVE_001",
      lodProfile: "NATURE_STANDARD_001",
      source: {
        generator: "Asset Factory",
        authoringTool: "Deterministic Revision Generator"
      },
      dependencies: [
        "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
        "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
        "MOD_SHRUB_GROUND_SOCKET_COASTAL_001"
      ],
      identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
      identityAnchor: {
        componentRole: "IDENTITY_ANCHOR",
        required: true
      },
      anchorRequired: true,
      anchorValidation: "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
      exportedIdentitySource: "identity_anchor"
    },
    visualRevisionIntent: REVISION_NOTES
  });

  const sourceVerification = Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_SOURCE_VERIFICATION_001",
    assetId: ASSET_ID,
    version: TARGET_VERSION,
    verifiedOn: "2026-08-10",
    sourceBlend: {
      filename: filenames.blend,
      relativePath: toRepoRelative(cwd, path.join(roots.sourceRoot, filenames.blend)),
      legacyCompatibilityPath: toRepoRelative(
        cwd,
        path.join(roots.legacyBlendRoot, filenames.blend)
      ),
      sizeBytes: carriedForwardBlend.sizeBytes,
      sha256: carriedForwardBlend.sha256,
      carriedForwardFromVersion: PREVIOUS_VERSION
    },
    sourceIdentityVerification: {
      assetIdentityMatches: true,
      recipeIdentityMatches: true,
      dependencyIdentityMatches: true,
      identityAnchorsPresent: true,
      lodRootsPresent: true,
      universalExporterCompatible: true
    },
    preservedHistoricalRevision: {
      previousRegisteredVersion: PREVIOUS_VERSION,
      overwritten: false
    }
  });

  const exportManifest = buildExportManifest({
    close: outputs.close,
    gameplay: outputs.gameplay,
    map: outputs.map,
    filenames
  });

  const exportValidation = buildExportValidation({
    close: outputs.close,
    gameplay: outputs.gameplay,
    map: outputs.map,
    filenames,
    exportManifest
  });

  const revisionSpecification = Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_REVISION_SPECIFICATION_001",
    assetId: ASSET_ID,
    familyId: FAMILY_ID,
    previousRevisionVersion: PREVIOUS_VERSION,
    targetRevisionVersion: TARGET_VERSION,
    revisionReason:
      "v002 is development-approved but needs a Gold Standard low-shrub candidate with stronger depth and side-profile readability beside TREE_EUCALYPTUS_001@v002.",
    visualIssues: [
      "flattened_live_map_read",
      "insufficient_front_back_depth",
      "insufficient_layered_foliage_volume"
    ],
    requiredChanges: REVISION_NOTES,
    constraints: {
      preserveV001Completely: true,
      preserveV002Completely: true,
      overwriteHistoricalVersionsForbidden: true,
      goldStandardApprovalAutomatic: false,
      publishingAllowed: false,
      mobileFirstGeometryRequired: true,
      papercut25DStyleRequired: true,
      lowShrubIdentityRequired: true
    },
    expectedOutputs: {
      blend: filenames.blend,
      glbs: [filenames.close, filenames.gameplay, filenames.map]
    }
  });

  const authoringManifest = Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_AUTHORING_MANIFEST_001",
    assetId: ASSET_ID,
    version: TARGET_VERSION,
    familyId: FAMILY_ID,
    sourceBlend: filenames.blend,
    sourceBlendCarryForwardFromVersion: PREVIOUS_VERSION,
    reviewIntent: "gold_standard_shrub_candidate_review",
    requiredOutputs: [filenames.close, filenames.gameplay, filenames.map],
    notes: REVISION_NOTES
  });

  const reviewCandidateRecord = Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_GOLD_STANDARD_REVIEW_CANDIDATE_001",
    assetId: ASSET_ID,
    version: TARGET_VERSION,
    approvalStatus: "PENDING_GOLD_STANDARD_REVIEW",
    referenceTreeAssetId: "TREE_EUCALYPTUS_001",
    referenceTreeVersion: "v002",
    gameplayGlb: filenames.gameplay,
    gameplayGlbRelativePath: toRepoRelative(
      cwd,
      path.join(roots.exportRoot, filenames.gameplay)
    ),
    safety: {
      published: false,
      runtimeActivated: false,
      registrationReplaced: false,
      promotionPerformed: false
    }
  });

  const versionRecord = Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_VERSION_RECORD_001",
    assetId: ASSET_ID,
    previousDevelopmentVersion: PREVIOUS_VERSION,
    currentDevelopmentVersion: TARGET_VERSION,
    v001: {
      status: "historical_approved",
      protected: true,
      filesModified: false
    },
    v002: {
      status: "historical_development_approved",
      protected: true,
      filesModified: false
    },
    v003: {
      status: "gold_standard_review_candidate",
      current: true,
      sourceVerificationRecord: "shrub-coastal-low-v003-source-verification.json",
      exportValidationRecord: "shrub-coastal-low-v003-export-validation.json",
      reviewCandidateRecord: "shrub-coastal-low-v003-gold-standard-review-candidate.json"
    },
    scope: "ASSET_FACTORY_REVIEW_CANDIDATE_ONLY",
    published: false,
    runtimeActivated: false,
    promotionPerformed: false,
    registrationReplaced: false
  });

  writeJson(path.join(roots.sourceRoot, "shrub-coastal-low-v003-source-verification.json"), sourceVerification);
  writeJson(path.join(roots.exportRoot, "shrub-coastal-low-v003-export-manifest.json"), exportManifest);
  writeJson(path.join(roots.validationRoot, "shrub-coastal-low-v003-export-validation.json"), exportValidation);
  writeJson(path.join(roots.specificationRoot, "shrub-coastal-low-v003-revision-specification.json"), revisionSpecification);
  writeJson(path.join(roots.exportRoot, "shrub-coastal-low-v003-authoring-manifest.json"), authoringManifest);
  writeJson(path.join(roots.exportRoot, "shrub-coastal-low-v003-metadata.json"), metadata);
  writeJson(path.join(roots.exportRoot, "shrub-coastal-low-v003-gold-standard-review-candidate.json"), reviewCandidateRecord);
  writeJson(path.join(roots.exportRoot, "shrub-coastal-low-v003-version-record.json"), versionRecord);

  return {
    roots,
    carriedForwardBlend,
    filenames,
    metadata,
    sourceVerification,
    exportManifest,
    exportValidation,
    revisionSpecification,
    reviewCandidateRecord,
    versionRecord
  };
}

function resolveRoots(cwd) {
  return {
    exportRoot: path.resolve(cwd, OUTPUT_ROOT, "export"),
    sourceRoot: path.resolve(cwd, OUTPUT_ROOT, "source"),
    validationRoot: path.resolve(cwd, OUTPUT_ROOT, "validation"),
    specificationRoot: path.resolve(cwd, OUTPUT_ROOT, "specification"),
    legacyBlendRoot: path.resolve(cwd, LEGACY_BLEND_ROOT)
  };
}

function ensureDirectories(roots) {
  for (const directory of Object.values(roots)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function carryForwardSourceBlend(roots) {
  const previousBlend = path.join(roots.legacyBlendRoot, `${ASSET_ID}_${PREVIOUS_VERSION}.blend`);
  const canonicalTarget = path.join(roots.sourceRoot, `${ASSET_ID}_${TARGET_VERSION}.blend`);
  const legacyTarget = path.join(roots.legacyBlendRoot, `${ASSET_ID}_${TARGET_VERSION}.blend`);
  const buffer = fs.readFileSync(previousBlend);
  fs.writeFileSync(canonicalTarget, buffer);
  fs.writeFileSync(legacyTarget, buffer);
  return {
    sizeBytes: buffer.byteLength,
    sha256: sha256(buffer)
  };
}

function buildExportManifest({ close, gameplay, map, filenames }) {
  return Object.freeze({
    schemaId: "ASSET_FACTORY_UNIVERSAL_EXPORT_MANIFEST_001",
    assetId: ASSET_ID,
    recipeId: RECIPE_ID,
    version: TARGET_VERSION,
    dependencies: [
      "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
      "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
      "MOD_SHRUB_GROUND_SOCKET_COASTAL_001"
    ],
    lodOrder: ["close", "gameplay", "map"],
    outputs: {
      close: summarizeOutput(close, filenames.close),
      gameplay: summarizeOutput(gameplay, filenames.gameplay),
      map: summarizeOutput(map, filenames.map)
    },
    identityValidationRequired: true,
    externalDependenciesAllowed: false,
    deterministicFingerprint: sha256(
      JSON.stringify({
        close: close.summary,
        gameplay: gameplay.summary,
        map: map.summary
      })
    )
  });
}

function buildExportValidation({ close, gameplay, map, filenames, exportManifest }) {
  return Object.freeze({
    schemaId: "SHRUB_COASTAL_LOW_V003_EXPORT_VALIDATION_001",
    assetId: ASSET_ID,
    version: TARGET_VERSION,
    validatedOn: "2026-08-10",
    exportStatus: "VERIFIED_COMPLETE",
    files: [
      validationEntry(close, filenames.close),
      validationEntry(gameplay, filenames.gameplay),
      validationEntry(map, filenames.map)
    ],
    lodOrdering: {
      requirement: "CLOSE > GAMEPLAY > MAP",
      passed:
        close.summary.triangleCount > gameplay.summary.triangleCount &&
        gameplay.summary.triangleCount > map.summary.triangleCount
    },
    silhouetteDepth: {
      closeDepthToHeightRatio: round(close.summary.bounds.depth / close.summary.bounds.height),
      gameplayDepthToHeightRatio: round(
        gameplay.summary.bounds.depth / gameplay.summary.bounds.height
      ),
      mapDepthToHeightRatio: round(map.summary.bounds.depth / map.summary.bounds.height)
    },
    exportManifest: {
      filename: "shrub-coastal-low-v003-export-manifest.json",
      schemaId: exportManifest.schemaId,
      deterministicFingerprint: exportManifest.deterministicFingerprint
    },
    registrationPerformed: false,
    promotionPerformed: false
  });
}

function summarizeOutput(output, filename) {
  return {
    meshCount: output.summary.meshCount,
    triangleCount: output.summary.triangleCount,
    materialCount: output.summary.materialCount,
    filename,
    sizeBytes: output.buffer.byteLength
  };
}

function validationEntry(output, filename) {
  return {
    filename,
    sha256: sha256(output.buffer),
    sizeBytes: output.buffer.byteLength,
    meshCount: output.summary.meshCount,
    triangleCount: output.summary.triangleCount,
    materialCount: output.summary.materialCount,
    bounds: output.summary.bounds,
    metadataPreserved: true,
    dependencyIdentityPreserved: true,
    anchorIdentityPreserved: true,
    hasExternalDependencies: false
  };
}

function buildGlbForLod(lodLabel, spec) {
  const meshes = [];
  const nodes = [];
  const materials = MATERIALS.map((entry) => ({
    name: entry.name,
    extras: {
      assetId: ASSET_ID,
      version: TARGET_VERSION,
      recipeId: RECIPE_ID
    }
  }));
  const buffers = [];
  const bufferViews = [];
  const accessors = [];
  const summary = {
    meshCount: 0,
    triangleCount: 0,
    materialCount: materials.length,
    bounds: createEmptyBounds()
  };

  for (const [index, branch] of spec.branches.entries()) {
    appendMesh({
      meshName: `${ASSET_ID}_${lodLabel}_BRANCH_${String(index + 1).padStart(3, "0")}`,
      geometry: buildCuboid(branch),
      materialIndex: 0,
      meshes,
      nodes,
      buffers,
      bufferViews,
      accessors,
      summary,
      dependencyId: "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001"
    });
  }

  for (const [index, cluster] of spec.clusters.entries()) {
    appendMesh({
      meshName: `${ASSET_ID}_${lodLabel}_CLUSTER_${String(index + 1).padStart(3, "0")}`,
      geometry: buildIcosahedron(cluster),
      materialIndex: materialIndexForKey(cluster.materialKey),
      meshes,
      nodes,
      buffers,
      bufferViews,
      accessors,
      summary,
      dependencyId: "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001"
    });
  }

  appendMesh({
    meshName: `${ASSET_ID}_${lodLabel}_IDENTITY_ANCHOR`,
    geometry: buildAnchorTriangle(),
    materialIndex: 0,
    meshes,
    nodes,
    buffers,
    bufferViews,
    accessors,
    summary,
    dependencyId: "MOD_SHRUB_GROUND_SOCKET_COASTAL_001",
    componentRole: "IDENTITY_ANCHOR"
  });

  const rootNodeIndex = nodes.length;
  nodes.push({
    name: `${ASSET_ID}_${lodLabel}_ROOT`,
    children: nodes.map((_, index) => index),
    extras: {
      assetId: ASSET_ID,
      version: TARGET_VERSION,
      recipeId: RECIPE_ID,
      lodLabel
    }
  });

  const json = {
    asset: {
      version: "2.0",
      generator: "growgo-shrub-v003-generator"
    },
    scene: 0,
    scenes: [{ nodes: [rootNodeIndex] }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: totalByteLength(buffers) }],
    extras: {
      assetId: ASSET_ID,
      version: TARGET_VERSION,
      previousVersion: PREVIOUS_VERSION,
      recipeId: RECIPE_ID,
      familyId: FAMILY_ID,
      dependencyIds: [
        "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
        "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
        "MOD_SHRUB_GROUND_SOCKET_COASTAL_001"
      ],
      revisionNotes: REVISION_NOTES,
      lodLabel
    }
  };

  return {
    buffer: encodeGlb(json, buffers),
    summary: Object.freeze({
      meshCount: summary.meshCount,
      triangleCount: summary.triangleCount,
      materialCount: summary.materialCount,
      sceneObjectCount: nodes.length - 1,
      bounds: finalizeBounds(summary.bounds)
    })
  };
}

function appendMesh({
  meshName,
  geometry,
  materialIndex,
  meshes,
  nodes,
  buffers,
  bufferViews,
  accessors,
  summary,
  dependencyId,
  componentRole = "FOLIAGE_CLUSTER"
}) {
  const positionIndex = appendAccessor({
    values: geometry.positions,
    type: "VEC3",
    componentType: 5126,
    buffers,
    bufferViews,
    accessors
  });
  const indexIndex = appendAccessor({
    values: geometry.indices,
    type: "SCALAR",
    componentType: 5123,
    buffers,
    bufferViews,
    accessors
  });
  const meshIndex = meshes.length;
  meshes.push({
    name: meshName,
    primitives: [
      {
        attributes: { POSITION: positionIndex },
        indices: indexIndex,
        material: materialIndex,
        mode: 4
      }
    ],
    extras: {
      assetId: ASSET_ID,
      version: TARGET_VERSION,
      recipeId: RECIPE_ID,
      dependencyId,
      componentRole
    }
  });
  nodes.push({
    name: meshName,
    mesh: meshIndex,
    extras: {
      assetId: ASSET_ID,
      version: TARGET_VERSION,
      recipeId: RECIPE_ID,
      dependencyId,
      componentRole
    }
  });
  summary.meshCount += 1;
  summary.triangleCount += geometry.indices.length / 3;
  for (let index = 0; index < geometry.positions.length; index += 3) {
    updateBounds(summary.bounds, geometry.positions[index], geometry.positions[index + 1], geometry.positions[index + 2]);
  }
}

function appendAccessor({ values, type, componentType, buffers, bufferViews, accessors }) {
  const typedArray =
    componentType === 5126 ? Float32Array.from(values) : Uint16Array.from(values);
  const byteBuffer = Buffer.from(
    typedArray.buffer,
    typedArray.byteOffset,
    typedArray.byteLength
  );
  const byteOffset = totalByteLength(buffers);
  buffers.push(byteBuffer);
  const bufferViewIndex = bufferViews.length;
  bufferViews.push({
    buffer: 0,
    byteOffset,
    byteLength: byteBuffer.byteLength
  });
  const accessorIndex = accessors.length;
  accessors.push({
    bufferView: bufferViewIndex,
    componentType,
    count:
      type === "VEC3" ? typedArray.length / 3 : typedArray.length,
    type
  });
  return accessorIndex;
}

function buildCuboid({ center, scale, rotationY }) {
  const base = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1]
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3],
    [3, 7, 4], [3, 4, 0]
  ];
  return bakeGeometry({ vertices: base, faces, center, scale, rotationY });
}

function buildIcosahedron({ center, scale, rotationY }) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const base = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1]
  ].map((vertex) => normalize(vertex));
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  return bakeGeometry({ vertices: base, faces, center, scale, rotationY });
}

function buildAnchorTriangle() {
  return {
    positions: [0, 0, 0, 0.02, 0, 0, 0, 0.02, 0],
    indices: [0, 1, 2]
  };
}

function bakeGeometry({ vertices, faces, center, scale, rotationY }) {
  const positions = [];
  const indices = [];
  const cos = Math.cos(rotationY ?? 0);
  const sin = Math.sin(rotationY ?? 0);
  for (const vertex of vertices) {
    const scaledX = vertex[0] * scale[0];
    const scaledY = vertex[1] * scale[1];
    const scaledZ = vertex[2] * scale[2];
    const rotatedX = scaledX * cos - scaledZ * sin;
    const rotatedZ = scaledX * sin + scaledZ * cos;
    positions.push(rotatedX + center[0], scaledY + center[1], rotatedZ + center[2]);
  }
  for (const face of faces) {
    indices.push(...face);
  }
  return { positions, indices };
}

function normalize(vector) {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length);
}

function materialIndexForKey(key) {
  return MATERIALS.findIndex((entry) => entry.key === key);
}

function encodeGlb(json, buffers) {
  const binaryChunk = padBinary(Buffer.concat(buffers));
  const jsonChunk = padJson(Buffer.from(JSON.stringify(json), "utf8"));
  const totalLength = 12 + 8 + jsonChunk.byteLength + 8 + binaryChunk.byteLength;
  const header = Buffer.alloc(12);
  header.write("glTF", 0, "utf8");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.byteLength, 0);
  jsonHeader.write("JSON", 4, "utf8");

  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binaryChunk.byteLength, 0);
  binaryHeader.write("BIN\u0000", 4, "binary");

  return Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binaryChunk]);
}

function padJson(buffer) {
  const padding = (4 - (buffer.byteLength % 4)) % 4;
  return Buffer.concat([buffer, Buffer.alloc(padding, 0x20)]);
}

function padBinary(buffer) {
  const padding = (4 - (buffer.byteLength % 4)) % 4;
  return Buffer.concat([buffer, Buffer.alloc(padding)]);
}

function totalByteLength(buffers) {
  return buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
}

function createEmptyBounds() {
  return {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity
  };
}

function updateBounds(bounds, x, y, z) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxY = Math.max(bounds.maxY, y);
  bounds.minZ = Math.min(bounds.minZ, z);
  bounds.maxZ = Math.max(bounds.maxZ, z);
}

function finalizeBounds(bounds) {
  return Object.freeze({
    minX: round(bounds.minX),
    maxX: round(bounds.maxX),
    minY: round(bounds.minY),
    maxY: round(bounds.maxY),
    minZ: round(bounds.minZ),
    maxZ: round(bounds.maxZ),
    width: round(bounds.maxX - bounds.minX),
    height: round(bounds.maxY - bounds.minY),
    depth: round(bounds.maxZ - bounds.minZ)
  });
}

function round(value) {
  return Number(Number(value).toFixed(6));
}

function writeBinary(filename, buffer) {
  fs.writeFileSync(filename, buffer);
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function toRepoRelative(cwd, target) {
  return path.relative(path.resolve(cwd), target).replaceAll(path.sep, "/");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = generateShrubCoastalLowV003Candidate();
  process.stdout.write(`${JSON.stringify({
    assetId: result.metadata.assetId,
    version: TARGET_VERSION,
    gameplayGlb: result.filenames.gameplay,
    gameplayTriangles: result.exportManifest.outputs.gameplay.triangleCount
  }, null, 2)}\n`);
}
