import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  buildAssetIdentityContract,
  inspectExportedGlbIdentityByPath
} from "./asset-identity-contract.mjs";

const DEFAULT_OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "production",
  "COASTAL_NATURE_FAMILY_001",
  "export"
);

export const TREE_EUCALYPTUS_CONTRACT = Object.freeze({
  assetId: "TREE_EUCALYPTUS_001",
  category: "nature",
  recipeId: "TREE_EUCALYPTUS_RECIPE_001",
  version: "v001",
  variantId: "DEFAULT",
  paletteId: "AU_NATIVE_GREEN_001",
  lodProfile: "NATURE_STANDARD_001",
  source: {
    generator: "Asset Factory",
    authoringTool: "Blender"
  },
  dependencies: [
    {
      dependencyId: "MOD_TREE_LEAF_CLUSTER_001",
      category: "module"
    }
  ],
  identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
  identityAnchor: {
    componentRole: "IDENTITY_ANCHOR",
    required: true
  },
  anchorRequired: true,
  anchorValidation: "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
  exportedIdentitySource: "IDENTITY_ANCHOR"
});

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    files: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      options.cwd = path.resolve(argv[index + 1] ?? process.cwd());
      index += 1;
      continue;
    }
    if (value === "--file") {
      options.files ??= [];
      options.files.push(path.resolve(argv[index + 1] ?? ""));
      index += 1;
      continue;
    }
    throw new Error(`Unsupported argument: ${value}`);
  }

  return options;
}

function parseGlbJson(buffer) {
  if (buffer.length < 20) {
    throw new Error("GLB was too small to contain a JSON chunk.");
  }

  const magic = buffer.subarray(0, 4).toString("utf8");
  if (magic !== "glTF") {
    throw new Error("GLB header magic was not glTF.");
  }

  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.subarray(16, 20).toString("utf8");
  if (jsonType !== "JSON") {
    throw new Error(`First GLB chunk was ${jsonType}, expected JSON.`);
  }

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonLength;
  const jsonChunk = buffer.subarray(jsonStart, jsonEnd).toString("utf8").replace(/\0+$/, "");
  return JSON.parse(jsonChunk);
}

function collectStrings(value, hits = []) {
  if (typeof value === "string") {
    hits.push(value);
    return hits;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, hits));
    return hits;
  }

  if (!value || typeof value !== "object") {
    return hits;
  }

  Object.values(value).forEach((entry) => collectStrings(entry, hits));
  return hits;
}

function collectExtras(entries = []) {
  const extras = [];
  entries.forEach((entry, index) => {
    if (entry && typeof entry === "object" && entry.extras) {
      extras.push({
        index,
        keys: Object.keys(entry.extras),
        strings: collectStrings(entry.extras)
      });
    }
  });
  return extras;
}

export function inspectTreeEucalyptusGlbIdentity(filename) {
  const contract = buildAssetIdentityContract(TREE_EUCALYPTUS_CONTRACT);
  const data = fs.readFileSync(filename);
  const gltfJson = parseGlbJson(data);
  const validatorInspection = inspectExportedGlbIdentityByPath(contract, filename);

  const sceneNames = (gltfJson.scenes ?? []).map((entry) => entry?.name).filter(Boolean);
  const nodeNames = (gltfJson.nodes ?? []).map((entry) => entry?.name).filter(Boolean);
  const meshNames = (gltfJson.meshes ?? []).map((entry) => entry?.name).filter(Boolean);
  const materialNames = (gltfJson.materials ?? []).map((entry) => entry?.name).filter(Boolean);

  const sceneExtras = collectExtras(gltfJson.scenes ?? []);
  const nodeExtras = collectExtras(gltfJson.nodes ?? []);
  const meshExtras = collectExtras(gltfJson.meshes ?? []);
  const materialExtras = collectExtras(gltfJson.materials ?? []);
  const assetExtras =
    gltfJson.asset && gltfJson.asset.extras
      ? [{ keys: Object.keys(gltfJson.asset.extras), strings: collectStrings(gltfJson.asset.extras) }]
      : [];

  const allStrings = [
    ...sceneNames,
    ...nodeNames,
    ...meshNames,
    ...materialNames,
    ...sceneExtras.flatMap((entry) => entry.strings),
    ...nodeExtras.flatMap((entry) => entry.strings),
    ...meshExtras.flatMap((entry) => entry.strings),
    ...materialExtras.flatMap((entry) => entry.strings),
    ...assetExtras.flatMap((entry) => entry.strings)
  ];

  const assetId = contract.assetId;

  return Object.freeze({
    filename: path.resolve(filename),
    sizeBytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
    sceneNames,
    nodeNames,
    meshNames,
    materialNames,
    anchorNodeNames: nodeNames.filter((name) => name.includes("IDENTITY_ANCHOR")),
    anchorMeshNames: meshNames.filter((name) => name.includes("IDENTITY_ANCHOR")),
    assetExtrasKeys: assetExtras.flatMap((entry) => entry.keys),
    sceneExtrasCount: sceneExtras.length,
    nodeExtrasCount: nodeExtras.length,
    meshExtrasCount: meshExtras.length,
    materialExtrasCount: materialExtras.length,
    extrasStringHits: allStrings.filter((value) => value.includes(assetId)),
    validatorInspection,
    conclusions: Object.freeze({
      identityAnchorMeshExistsInGlb: meshNames.some((name) => name.includes("IDENTITY_ANCHOR")),
      identityAnchorNodeExistsInGlb: nodeNames.some((name) => name.includes("IDENTITY_ANCHOR")),
      gltfExtrasPresent:
        assetExtras.length > 0 ||
        sceneExtras.length > 0 ||
        nodeExtras.length > 0 ||
        meshExtras.length > 0 ||
        materialExtras.length > 0,
      validatorReadsStructuredNames:
        validatorInspection.namedIdentityHits.length > 0 ||
        validatorInspection.anchorIdentityHits.length > 0,
      validatorReadsMetadata: validatorInspection.metadataIdentityHits.length > 0,
      exactAssetIdStringPresent: allStrings.some((value) => value.includes(assetId))
    })
  });
}

export function inspectDefaultTreeEucalyptusGlbs(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const contract = buildAssetIdentityContract(TREE_EUCALYPTUS_CONTRACT);
  const defaultFiles = [
    "TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
    "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    "TREE_EUCALYPTUS_001_LOD_MAP.glb"
  ].map((entry) => path.resolve(cwd, DEFAULT_OUTPUT_DIR, entry));

  const files = options.files?.length ? options.files : defaultFiles;
  return Object.freeze({
    contract,
    files: files.map((entry) => inspectTreeEucalyptusGlbIdentity(entry))
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  const options = parseArguments(process.argv.slice(2));
  const report = inspectDefaultTreeEucalyptusGlbs({
    cwd: options.cwd,
    files: options.files
  });
  console.log(JSON.stringify(report, null, 2));
}
