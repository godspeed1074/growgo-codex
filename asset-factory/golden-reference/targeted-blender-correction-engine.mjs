import fs from "node:fs";
import path from "node:path";

export const CORRECTION_ENGINE_VERSION = "TARGETED_BLENDER_CORRECTION_ENGINE_001";
export const ERROR_IDS = Object.freeze({ protected: "PROTECTED_COMPONENT_MODIFICATION_BLOCKED", magnitude: "CORRECTION_MAGNITUDE_REVIEW_REQUIRED", budget: "VISUAL_PASS_BUDGET_FAIL", duplicate: "UNNECESSARY_MODULE_DUPLICATION", camera: "CAMERA_ALIGNMENT_FAIL", mapping: "COMPONENT_OBJECT_MAPPING_MISSING", regression: "VISUAL_REGRESSION" });
export const DEFAULT_LIMITS = Object.freeze({ scaleMin: .75, scaleMax: 1.35, moveMax: .25, rotationMax: 25 });

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function now() { return new Date().toISOString(); }

export function validateCorrectionInput(input) {
  const required = ["reference", "referenceSpec", "componentMap", "correctionPlan", "componentComparison", "budget", "sourceBuild", "buildId"];
  const missing = required.filter((k) => input?.[k] == null);
  if (missing.length) return { ok: false, errorCode: "MISSING_CORRECTION_INPUT", missing };
  if (input.reference.state !== "APPROVED_GOLDEN_REFERENCE") return { ok: false, errorCode: "REFERENCE_NOT_APPROVED" };
  if (input.reference.assetId !== input.referenceSpec.assetId || input.reference.referenceId !== input.referenceSpec.referenceId || input.reference.version !== input.referenceSpec.referenceVersion) return { ok: false, errorCode: "REFERENCE_IDENTITY_MISMATCH" };
  if (input.referenceSpec.sourceImage?.checksum !== input.reference.checksum) return { ok: false, errorCode: "REFERENCE_CHECKSUM_MISMATCH" };
  if (input.camera && input.referenceSpec.gameplayCamera?.id && input.camera.id !== input.referenceSpec.gameplayCamera.id) return { ok: false, errorCode: ERROR_IDS.camera };
  return { ok: true };
}

export function mapComponents(componentMap, objects = {}) {
  const mappings = {}; const missing = [];
  for (const c of componentMap.components ?? []) { const id = c.id ?? c.name; const objectId = c.blenderObjectId ?? c.objectId ?? objects[id]?.objectId; if (!objectId) missing.push(id); else mappings[id] = { componentId: id, objectId, module: c.module ?? null }; }
  return { ok: missing.length === 0, mappings, missing, errorCode: missing.length ? ERROR_IDS.mapping : null };
}

function getOperation(issue) { if (issue.recommendedAction === "INCREASE_WIDTH" || issue.type === "COMPONENT_WIDTH_FAIL") return "SCALE_X"; if (issue.recommendedAction === "INCREASE_HEIGHT" || issue.type === "COMPONENT_HEIGHT_FAIL") return "SCALE_Z"; if (issue.type === "COMPONENT_POSITION_FAIL") return "MOVE_X"; return null; }
function magnitude(op, issue) { if (op.startsWith("SCALE")) return 1 + (issue.magnitude ?? Math.abs(issue.difference ?? 0)); return issue.magnitude ?? Math.hypot(issue.horizontalOffset ?? 0, issue.verticalOffset ?? 0); }

export function planCorrection(input, options = {}) {
  const gate = validateCorrectionInput(input); if (!gate.ok) return { status: "REJECTED", ...gate };
  const mapping = mapComponents(input.componentMap, input.objects); if (!mapping.ok) return { status: "REJECTED", ...mapping };
  const protectedSet = new Set([...(input.correctionPlan.protectedComponents ?? []), ...(input.componentComparison.protectedComponents ?? [])]); const dependencies = input.dependencies ?? {}; const limits = { ...DEFAULT_LIMITS, ...(options.limits ?? {}) }; const operations = []; const blocked = [];
  for (const failed of input.correctionPlan.failedComponents ?? []) { const id = failed.componentId; if (protectedSet.has(id) && !options.operatorOverride) { blocked.push({ componentId: id, errorCode: ERROR_IDS.protected }); continue; } const map = mapping.mappings[id]; if (!map) { blocked.push({ componentId: id, errorCode: ERROR_IDS.mapping }); continue; } for (const issue of failed.issues ?? []) { const op = getOperation(issue); if (!op) continue; const value = magnitude(op, issue); if ((op.startsWith("SCALE") && (value < limits.scaleMin || value > limits.scaleMax)) || (op.startsWith("MOVE") && Math.abs(value) > limits.moveMax)) { blocked.push({ componentId: id, errorCode: ERROR_IDS.magnitude, requestedOperation: op, value }); continue; } operations.push({ componentId: id, objectId: map.objectId, module: map.module, issueType: issue.type, operation: op, value, axis: op.slice(-1), dependencies: dependencies[id] ?? [] }); } }
  return { status: blocked.length && !operations.length ? "REJECTED" : "PLANNED", mode: options.mode ?? "DRY_RUN", assetId: input.reference.assetId, buildId: input.buildId, parentBuildId: input.sourceBuild.buildId, protectedComponents: [...protectedSet], operations, blocked, budget: input.budget, camera: input.camera ?? input.referenceSpec.gameplayCamera };
}

function budgetCheck(scene, budget) { const counts = scene.budget ?? {}; for (const key of ["triangles", "vertices", "materials", "fileSizeBytes"]) if (budget?.[key]?.hardCeiling != null && counts[key] > budget[key].hardCeiling) return { ok: false, errorCode: ERROR_IDS.budget, key, value: counts[key], ceiling: budget[key].hardCeiling }; return { ok: true }; }

export function applyCorrection(input, plan, outputRoot) {
  if (plan.status !== "PLANNED") return { status: "REJECTED", reason: "plan_not_executable" };
  const nextBuild = `${input.buildId}_correction_${String((input.iteration ?? 0) + 1).padStart(3, "0")}`; const outDir = path.join(outputRoot, nextBuild); fs.mkdirSync(outDir, { recursive: true }); const scene = clone(input.sourceBuild.scene); const audit = [];
  for (const op of plan.operations) { const obj = scene.objects?.[op.objectId]; if (!obj) return { status: "REJECTED", errorCode: ERROR_IDS.mapping, objectId: op.objectId }; const old = clone(obj.transform ?? { location: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rotation: { x: 0, y: 0, z: 0 } }); obj.transform ??= clone(old); if (op.operation.startsWith("SCALE")) obj.transform.scale[op.axis.toLowerCase()] *= op.value; else if (op.operation.startsWith("MOVE")) obj.transform.location[op.axis.toLowerCase()] += op.value; audit.push({ assetId: input.reference.assetId, buildId: nextBuild, parentBuildId: input.buildId, componentId: op.componentId, blenderObjectId: op.objectId, moduleId: op.module?.moduleId ?? null, moduleVersion: op.module?.moduleVersion ?? null, issueId: op.issueType, requestedCorrection: op.value, appliedCorrection: op.operation, axis: op.axis, oldTransform: old, newTransform: obj.transform, budgetBefore: input.sourceBuild.scene.budget ?? {}, budgetAfter: scene.budget ?? {}, protectedComponents: plan.protectedComponents, dependencies: op.dependencies, timestamp: now(), correctionEngineVersion: CORRECTION_ENGINE_VERSION }); }
  const budget = budgetCheck(scene, input.budget); if (!budget.ok) return { status: "REJECTED", ...budget, preservedSource: true };
  fs.writeFileSync(path.join(outDir, "scene.json"), JSON.stringify(scene, null, 2) + "\n"); fs.writeFileSync(path.join(outDir, "BLENDER_CORRECTION_AUDIT.json"), JSON.stringify({ engineVersion: CORRECTION_ENGINE_VERSION, buildId: nextBuild, parentBuildId: input.buildId, operations: audit, budget }, null, 2) + "\n"); return { status: "APPLIED", buildId: nextBuild, parentBuildId: input.buildId, outputDir: outDir, audit, budget, oneIterationStop: true };
}

export function compareCorrectionIterations(previous, next) { if (!previous || !next) return { status: "UNKNOWN" }; const regressed = (previous.protectedComponents ?? []).filter((id) => !(next.protectedComponents ?? []).includes(id)); if (regressed.length) return { status: "REJECTED", errorCode: ERROR_IDS.regression, regressedComponents: regressed }; if ((next.metrics?.silhouetteIoU ?? 0) > (previous.metrics?.silhouetteIoU ?? 0)) return { status: "IMPROVED" }; return { status: "NO_MEANINGFUL_CHANGE" }; }
