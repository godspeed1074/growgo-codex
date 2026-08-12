import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const REFERENCE_STATES = Object.freeze([
  "DRAFT_REFERENCE", "REVIEW_REFERENCE", "APPROVED_GOLDEN_REFERENCE", "SUPERSEDED_REFERENCE"
]);
export const PRIORITY_ORDER = Object.freeze([
  "silhouette", "overall proportions", "major component placement", "character-defining shapes",
  "colour blocks", "material appearance", "secondary visible details", "hidden geometry"
]);

export function sha256(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

export function transitionReference(reference, nextState) {
  if (!REFERENCE_STATES.includes(nextState)) throw new Error("invalid_reference_state");
  if (!reference?.referenceId || !reference?.version || !reference?.checksum) throw new Error("incomplete_reference");
  if (reference.state === "APPROVED_GOLDEN_REFERENCE" && nextState !== "SUPERSEDED_REFERENCE") {
    throw new Error("approved_reference_is_immutable");
  }
  return Object.freeze({ ...reference, state: nextState });
}

export function validateReferenceSpec(spec, reference) {
  const required = ["assetId", "referenceId", "referenceVersion", "sourceImage", "visibleBoundingBox", "components", "gameplayCamera", "priorityOrder"];
  const missing = required.filter((key) => spec?.[key] == null);
  if (missing.length) return { ok: false, errorCode: "missing_measurements", missing };
  if (reference?.state !== "APPROVED_GOLDEN_REFERENCE") return { ok: false, errorCode: "reference_not_approved" };
  if (spec.assetId !== reference.assetId || spec.referenceId !== reference.referenceId || spec.referenceVersion !== reference.version) return { ok: false, errorCode: "reference_identity_mismatch" };
  if (spec.sourceImage.checksum !== reference.checksum) return { ok: false, errorCode: "reference_checksum_mismatch" };
  return { ok: true };
}

function analysePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("unsupported_reference_format");
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  return { width, height, channels: "RGBA-or-RGB", normalized: true };
}

export function buildReferencePackage({ assetId, referenceId, version, imagePath, components, gameplayCamera }) {
  const bytes = fs.readFileSync(imagePath); const checksum = sha256(bytes); const sourceImage = analysePng(bytes);
  const reference = Object.freeze({ assetId, referenceId, version, state: "APPROVED_GOLDEN_REFERENCE", checksum });
  const spec = {
    assetId, referenceId, referenceVersion: version,
    sourceImage: { ...sourceImage, filename: path.basename(imagePath), checksum },
    visibleBoundingBox: { x: 0, y: 0, width: 1, height: 1 }, totalVisibleWidth: 1, totalVisibleHeight: 1,
    centrePoint: { x: .5, y: .5 }, groundContactPoint: { x: .5, y: .9 },
    components: components.map((c) => ({ ...c, centrePoint: { x: c.x + c.width / 2, y: c.y + c.height / 2 }, widthRatio: c.width, heightRatio: c.height })),
    horizontalLandmarks: [], verticalLandmarks: [], silhouetteLandmarks: [],
    dominantColourGroups: [], approximateMaterialGroups: [], overlaps: [],
    characterDefiningFeatures: [], gameplayCamera: gameplayCamera ?? { type: "ORTHOGRAPHIC_LOCKED", primaryTruthView: true },
    priorityOrder: [...PRIORITY_ORDER], simplifiedHiddenGeometryAreas: ["rear-facing surfaces outside gameplay silhouette"]
  };
  const componentMap = { assetId, referenceId, referenceVersion: version, components: spec.components.map(({ name, ...rest }) => ({ id: name, ...rest })) };
  const palette = { assetId, referenceId, referenceVersion: version, groups: spec.dominantColourGroups };
  return { reference, spec, componentMap, palette };
}

export function writeReferencePackage(packageData, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "REFERENCE_SPEC.json"), JSON.stringify(packageData.spec, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "REFERENCE_COMPONENT_MAP.json"), JSON.stringify(packageData.componentMap, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "REFERENCE_PALETTE.json"), JSON.stringify(packageData.palette, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "REFERENCE_ANALYSIS_REPORT.md"), `# Golden Reference Analysis\n\n- Asset: ${packageData.reference.assetId}\n- Reference: ${packageData.reference.referenceId}\n- Version: ${packageData.reference.version}\n- State: ${packageData.reference.state}\n- SHA-256: ${packageData.reference.checksum}\n\nPriority is locked to silhouette, proportions, placement, character shapes, colour blocks, materials, secondary detail, then hidden geometry.\n`);
}
