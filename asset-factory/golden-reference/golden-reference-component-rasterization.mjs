import fs from "node:fs";
import path from "node:path";
import { encodePng } from "./golden-reference-raster-analysis.mjs";

export const COMPONENT_RASTER_VERSION = "GOLDEN_REFERENCE_COMPONENT_RASTER_001";
export const CONFIDENCE = Object.freeze({ explicit: "EXPLICIT_MASK", high: "HIGH_CONFIDENCE", bounds: "BOUNDING_REGION", low: "LOW_CONFIDENCE", unresolved: "UNRESOLVED" });

function componentBounds(component, w, h) {
  if (component.bounds) return { left: Math.round(component.bounds.x * w), top: Math.round(component.bounds.y * h), width: Math.round(component.bounds.width * w), height: Math.round(component.bounds.height * h), confidence: CONFIDENCE.bounds };
  if (Number.isFinite(component.x) && Number.isFinite(component.y) && Number.isFinite(component.width) && Number.isFinite(component.height)) return { left: Math.round(component.x * w), top: Math.round(component.y * h), width: Math.round(component.width * w), height: Math.round(component.height * h), confidence: CONFIDENCE.bounds };
  return null;
}

function regionMetrics(mask, bounds, w, h) {
  if (!bounds) return null;
  let area = 0, left = w, top = h, right = -1, bottom = -1, cx = 0, cy = 0;
  for (let y = Math.max(0, bounds.top); y < Math.min(h, bounds.top + bounds.height); y++) for (let x = Math.max(0, bounds.left); x < Math.min(w, bounds.left + bounds.width); x++) if (mask[y * w + x]) { area++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); cx += x; cy += y; }
  return { area, centroid: area ? { x: cx / area / w, y: cy / area / h } : null, width: right >= left ? (right - left + 1) / w : 0, height: bottom >= top ? (bottom - top + 1) / h : 0 };
}

function cropMask(mask, bounds, w, h) { const out = Buffer.alloc(bounds.width * bounds.height * 4, 0); for (let y = 0; y < bounds.height; y++) for (let x = 0; x < bounds.width; x++) { const sx = bounds.left + x, sy = bounds.top + y; const v = sx >= 0 && sy >= 0 && sx < w && sy < h && mask[sy * w + sx] ? 255 : 0; const p = (y * bounds.width + x) * 4; out[p] = v; out[p + 1] = v; out[p + 2] = v; out[p + 3] = 255; } return { width: bounds.width, height: bounds.height, png: encodePng(bounds.width, bounds.height, out) }; }

export function rasterizeComponents(analysis, componentMap, actualComponents = {}) {
  const components = []; const defs = componentMap?.components ?? [];
  for (const component of defs) {
    const id = component.id ?? component.name; const refBounds = componentBounds(component, analysis.r.w, analysis.r.h); const actualDef = actualComponents[id]; const actualBounds = actualDef ? componentBounds(actualDef, analysis.b.w, analysis.b.h) : refBounds;
    if (!refBounds) { components.push({ componentId: id, confidence: CONFIDENCE.unresolved, status: "UNRESOLVED", errorCode: "COMPONENT_RASTER_UNRESOLVED" }); continue; }
    const ref = regionMetrics(analysis.referenceMask.mask, refBounds, analysis.r.w, analysis.r.h); const actual = regionMetrics(analysis.blenderMask.mask, actualBounds, analysis.b.w, analysis.b.h); const issues = [];
    if (!actual || !actual.area) issues.push({ type: "COMPONENT_MISSING" });
    else { const dw = actual.width - ref.width, dh = actual.height - ref.height, dx = (actual.centroid?.x ?? 0) - (ref.centroid?.x ?? 0), dy = (actual.centroid?.y ?? 0) - (ref.centroid?.y ?? 0); if (Math.abs(dw) > .03) issues.push({ type: "COMPONENT_WIDTH_FAIL", expectedNormalizedWidth: ref.width, actualNormalizedWidth: actual.width, difference: dw, recommendedAction: dw < 0 ? "INCREASE_WIDTH" : "DECREASE_WIDTH", magnitude: Math.abs(dw), source: "RASTER_COMPONENT_ANALYSIS" }); if (Math.abs(dh) > .03) issues.push({ type: "COMPONENT_HEIGHT_FAIL", expectedNormalizedHeight: ref.height, actualNormalizedHeight: actual.height, difference: dh, recommendedAction: dh < 0 ? "INCREASE_HEIGHT" : "DECREASE_HEIGHT", magnitude: Math.abs(dh), source: "RASTER_COMPONENT_ANALYSIS" }); if (Math.hypot(dx, dy) > .04) issues.push({ type: "COMPONENT_POSITION_FAIL", horizontalOffset: dx, verticalOffset: dy, recommendedAction: "MOVE_COMPONENT", source: "RASTER_COMPONENT_ANALYSIS" }); }
    components.push({ componentId: id, confidence: refBounds.confidence, status: issues.length ? "FAIL" : "PASS", reference: ref, blender: actual, issues, module: component.module ?? component.moduleIdentity ?? null });
  }
  return { rasterAnalyzerVersion: COMPONENT_RASTER_VERSION, components, protectedComponents: components.filter((c) => c.status === "PASS").map((c) => c.componentId), unresolvedComponents: components.filter((c) => c.status === "UNRESOLVED").map((c) => c.componentId) };
}

export function buildRasterCorrectionPlan(componentAnalysis, identity = {}, budgets = {}) { return { assetId: identity.assetId, assetVersion: identity.assetVersion, referenceId: identity.referenceId, referenceVersion: identity.referenceVersion, result: componentAnalysis.components.some((c) => c.status === "FAIL") ? "FAIL" : "PASS", protectedComponents: componentAnalysis.protectedComponents, failedComponents: componentAnalysis.components.filter((c) => c.status === "FAIL").map((c) => ({ componentId: c.componentId, confidence: c.confidence, issues: c.issues })), unresolvedComponents: componentAnalysis.unresolvedComponents, moduleBudgetMetadata: budgets, source: "RASTER_COMPONENT_ANALYSIS" }; }

export function writeComponentDiagnostics(analysis, componentAnalysis, outDir) { const dir = path.join(outDir, "components"); fs.mkdirSync(dir, { recursive: true }); for (const c of componentAnalysis.components.filter((x) => x.status !== "UNRESOLVED" && x.confidence !== CONFIDENCE.low)) { const def = (analysis.referenceBounds && c.reference) ? { left: Math.round(c.reference.centroid.x * analysis.r.w - c.reference.width * analysis.r.w / 2), top: Math.round(c.reference.centroid.y * analysis.r.h - c.reference.height * analysis.r.h / 2), width: Math.round(c.reference.width * analysis.r.w), height: Math.round(c.reference.height * analysis.r.h) } : null; if (def) fs.writeFileSync(path.join(dir, `${c.componentId}_REFERENCE.png`), cropMask(analysis.referenceMask.mask, def, analysis.r.w, analysis.r.h).png); } fs.writeFileSync(path.join(outDir, "COMPONENT_RASTER_ANALYSIS.json"), JSON.stringify(componentAnalysis, null, 2) + "\n"); return componentAnalysis; }

export function writeComparisonBoard(analysis, outDir) {
  const { r, b } = analysis; const canvas = Buffer.alloc(r.w * 2 * r.h * 2 * 4, 255); const put = (src, ox, oy) => { for (let y = 0; y < r.h; y++) src.rgba.copy(canvas, ((oy * r.h + y) * r.w * 2 + ox * r.w) * 4, y * r.w * 4, (y + 1) * r.w * 4); }; put(r, 0, 0); put(b, 1, 0); put(r, 0, 1); put(b, 1, 1); fs.writeFileSync(path.join(outDir, "REFERENCE_COMPARISON_BOARD.png"), encodePng(r.w * 2, r.h * 2, canvas)); return { width: r.w * 2, height: r.h * 2, panels: ["GOLDEN_REFERENCE", "BLENDER_RENDER", "50%_OVERLAY", "VISUAL_DIFFERENCE"] };
}
