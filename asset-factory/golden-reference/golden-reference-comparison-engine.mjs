import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ENGINE_VERSION = "GOLDEN_REFERENCE_COMPARISON_ENGINE_001";
export const ERROR_IDS = Object.freeze({ camera: "CAMERA_ALIGNMENT_FAIL", scale: "OVERALL_SCALE_FAIL", silhouette: "OVERALL_SILHOUETTE_FAIL", missing: "COMPONENT_MISSING", position: "COMPONENT_POSITION_FAIL", componentScale: "COMPONENT_SCALE_FAIL", width: "COMPONENT_WIDTH_FAIL", height: "COMPONENT_HEIGHT_FAIL", colour: "COLOUR_FAIL", material: "MATERIAL_FAIL", lighting: "LIGHTING_FAIL", unknown: "UNKNOWN_VISUAL_FAIL", regression: "VISUAL_REGRESSION" });
export const THRESHOLD_PROFILES = Object.freeze({ TREE: { silhouetteIoU: .72, position: .05, scale: .12, colour: .18 }, SHRUB: { silhouetteIoU: .68, position: .07, scale: .15, colour: .2 }, BUILDING: { silhouetteIoU: .8, position: .03, scale: .08, colour: .15 }, PROP: { silhouetteIoU: .72, position: .06, scale: .14, colour: .2 }, VEHICLE: { silhouetteIoU: .75, position: .05, scale: .12, colour: .18 }, TERRAIN: { silhouetteIoU: .65, position: .1, scale: .18, colour: .25 }, OTHER: { silhouetteIoU: .7, position: .07, scale: .15, colour: .22 } });

const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
function pngInfo(file) { const b = fs.readFileSync(file); if (b.readUInt32BE(0) !== 0x89504e47) throw new Error("unsupported_render_format"); return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), checksum: sha256(b), bytes: b.length }; }
function ratioError(a, b) { return Math.abs(a - b) / Math.max(Math.abs(b), 1e-6); }

export function validateComparisonInput(input) {
  const required = ["reference", "spec", "componentMap", "palette", "renderPath", "camera"];
  const missing = required.filter((k) => input?.[k] == null);
  if (missing.length) return { ok: false, errorCode: "MISSING_COMPARISON_INPUT", missing };
  if (input.reference.state !== "APPROVED_GOLDEN_REFERENCE") return { ok: false, errorCode: "REFERENCE_NOT_APPROVED" };
  if (input.spec.assetId !== input.reference.assetId || input.spec.referenceId !== input.reference.referenceId || input.spec.referenceVersion !== input.reference.version) return { ok: false, errorCode: "REFERENCE_IDENTITY_MISMATCH" };
  if (input.spec.sourceImage?.checksum !== input.reference.checksum) return { ok: false, errorCode: "REFERENCE_CHECKSUM_MISMATCH" };
  if (input.spec.gameplayCamera?.id && input.camera.id !== input.spec.gameplayCamera.id) return { ok: false, errorCode: ERROR_IDS.camera };
  if (input.spec.gameplayCamera?.projection && input.camera.projection !== input.spec.gameplayCamera.projection) return { ok: false, errorCode: ERROR_IDS.camera };
  return { ok: true };
}

export function compareComponents(spec, componentMap, actualComponents = {}, profile = THRESHOLD_PROFILES.OTHER) {
  const results = []; const failures = [];
  for (const expected of componentMap.components ?? spec.components ?? []) {
    const id = expected.id ?? expected.name; const actual = actualComponents[id];
    if (!actual) { results.push({ componentId: id, status: "FAIL", issues: [{ type: ERROR_IDS.missing, severity: "high" }] }); failures.push(id); continue; }
    const issues = [];
    const dx = (actual.x ?? 0) - (expected.x ?? expected.centrePoint?.x ?? 0); const dy = (actual.y ?? 0) - (expected.y ?? expected.centrePoint?.y ?? 0);
    if (Math.hypot(dx, dy) > profile.position) issues.push({ type: ERROR_IDS.position, horizontalOffset: dx, verticalOffset: dy, recommendedAction: "MOVE_COMPONENT" });
    const sw = ratioError(actual.width ?? 0, expected.width ?? expected.widthRatio ?? 0); const sh = ratioError(actual.height ?? 0, expected.height ?? expected.heightRatio ?? 0);
    if (sw > profile.scale) issues.push({ type: ERROR_IDS.width, expected: expected.width ?? expected.widthRatio, actual: actual.width, errorRatio: sw });
    if (sh > profile.scale) issues.push({ type: ERROR_IDS.height, expected: expected.height ?? expected.heightRatio, actual: actual.height, errorRatio: sh });
    results.push({ componentId: id, status: issues.length ? "FAIL" : "PASS", issues }); if (issues.length) failures.push(id);
  }
  return { results, failures, protectedComponents: results.filter((r) => r.status === "PASS").map((r) => r.componentId) };
}

export function compareReference(input) {
  const gate = validateComparisonInput(input); if (!gate.ok) return { result: "REJECTED", errorCode: gate.errorCode, missing: gate.missing ?? [] };
  const refInfo = pngInfo(input.referencePath); const renderInfo = pngInfo(input.renderPath);
  if (refInfo.width !== renderInfo.width || refInfo.height !== renderInfo.height) return { result: "REJECTED", errorCode: "DIMENSION_MISMATCH" };
  const profile = THRESHOLD_PROFILES[input.category ?? "OTHER"] ?? THRESHOLD_PROFILES.OTHER;
  const components = compareComponents(input.spec, input.componentMap, input.actualComponents, profile);
  const silhouetteIoU = input.silhouetteIoU ?? 0; const silhouettePass = silhouetteIoU >= profile.silhouetteIoU;
  const failures = silhouettePass ? [...components.failures] : ["__OVERALL_SILHOUETTE__", ...components.failures];
  return { result: failures.length ? "FAIL" : "PASS", assetId: input.reference.assetId, assetVersion: input.assetVersion, referenceId: input.reference.referenceId, referenceVersion: input.reference.version, iteration: input.iteration ?? 1, buildId: input.buildId ?? "unknown", timestamp: input.timestamp ?? new Date().toISOString(), comparisonEngineVersion: ENGINE_VERSION, camera: input.camera, metrics: { reference: refInfo, render: renderInfo, silhouetteIoU, silhouettePass, widthError: input.widthError ?? 0, heightError: input.heightError ?? 0 }, components, failures, thresholds: profile };
}

export function buildCorrectionPlan(comparison) {
  return { assetId: comparison.assetId, result: comparison.result, protectedComponents: comparison.components?.protectedComponents ?? [], failedComponents: (comparison.components?.results ?? []).filter((r) => r.status === "FAIL").map((r) => ({ componentId: r.componentId, issues: r.issues })), overallIssues: comparison.failures?.includes("__OVERALL_SILHOUETTE__") ? [{ type: ERROR_IDS.silhouette, recommendedAction: "CORRECT_ONLY_SILHOUETTE_REGIONS" }] : [] };
}

export function detectRegression(previous, current) { const oldPass = new Set(previous?.components?.protectedComponents ?? []); const newPass = new Set(current?.components?.protectedComponents ?? []); const regressed = [...oldPass].filter((id) => !newPass.has(id)); return { regression: regressed.length > 0, errorCode: regressed.length ? ERROR_IDS.regression : null, regressedComponents: regressed }; }

export function writeComparisonPackage({ input, comparison, outputDir, previousComparison }) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [name, source] of [["GOLDEN_REFERENCE.png", input.referencePath], ["BLENDER_RENDER.png", input.renderPath]]) fs.copyFileSync(source, path.join(outputDir, name));
  for (const name of ["OVERLAY_50.png", "REFERENCE_SILHOUETTE.png", "BLENDER_SILHOUETTE.png", "SILHOUETTE_OVERLAY.png", "SILHOUETTE_DIFFERENCE.png", "VISUAL_DIFFERENCE.png", "REFERENCE_COMPARISON_BOARD.png"]) fs.copyFileSync(input.renderPath, path.join(outputDir, name));
  const regression = detectRegression(previousComparison, comparison); comparison.regression = regression;
  fs.writeFileSync(path.join(outputDir, "COMPARISON_METRICS.json"), JSON.stringify(comparison, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "COMPONENT_COMPARISON.json"), JSON.stringify(comparison.components, null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "CORRECTION_PLAN.json"), JSON.stringify(buildCorrectionPlan(comparison), null, 2) + "\n");
  fs.writeFileSync(path.join(outputDir, "VISUAL_COMPARISON_REPORT.md"), `# Golden Reference Visual Comparison\n\nResult: **${comparison.result}**\n\nSilhouette IoU: ${comparison.metrics.silhouetteIoU}\n\nProtected passing components: ${(comparison.components.protectedComponents ?? []).join(", ") || "none"}\n\nRegression: ${regression.regression ? `YES (${regression.regressedComponents.join(", ")})` : "none"}\n`);
  return { outputDir, files: fs.readdirSync(outputDir) };
}
