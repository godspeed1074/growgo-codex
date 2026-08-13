import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const COMPONENT_ID_ANALYZER_VERSION = "COMPONENT_ID_RENDER_ANALYZER_001";

function paeth(a, b, c) {
  const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodeComponentIdPng(file) {
  const bytes = fs.readFileSync(file); if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error("unsupported_render_format");
  let offset = 8; let width = 0; let height = 0; let bitDepth = 0; let colorType = 0; let interlace = 0; const data = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset); const type = bytes.toString("ascii", offset + 4, offset + 8); const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") { width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); bitDepth = chunk[8]; colorType = chunk[9]; interlace = chunk[12]; }
    if (type === "IDAT") data.push(chunk); offset += length + 12;
  }
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) throw new Error("component_id_png_requires_noninterlaced_rgba8");
  const stride = width * 4; const raw = zlib.inflateSync(Buffer.concat(data)); const rgba = Buffer.alloc(width * height * 4); let cursor = 0; let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[cursor++]; const row = Buffer.from(raw.subarray(cursor, cursor + stride)); cursor += stride;
    for (let x = 0; x < stride; x++) { const left = x >= 4 ? row[x - 4] : 0; const up = previous[x] ?? 0; const upLeft = x >= 4 ? previous[x - 4] ?? 0 : 0; if (filter === 1) row[x] = (row[x] + left) & 255; else if (filter === 2) row[x] = (row[x] + up) & 255; else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255; else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 255; else if (filter !== 0) throw new Error(`unsupported_png_filter_${filter}`); }
    row.copy(rgba, y * stride); previous = row;
  }
  return { width, height, rgba };
}

export function extractComponentBounds({ image, componentMap, componentId, exact = true }) {
  const entry = componentMap?.[componentId]; if (!entry?.rgb) return { status: "UNRESOLVED", reason: "COMPONENT_ID_NOT_REGISTERED", componentId };
  const target = entry.rgb; let left = image.width; let top = image.height; let right = -1; let bottom = -1; let area = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) { const p = (y * image.width + x) * 4; const same = image.rgba[p] === target[0] && image.rgba[p + 1] === target[1] && image.rgba[p + 2] === target[2]; if (same) { area++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); } }
  if (!area) return { status: "UNRESOLVED", reason: exact ? "NO_EXACT_ID_PIXELS" : "NO_ID_PIXELS", componentId, confidence: "UNRESOLVED" };
  return { status: "PASS", componentId, x: left / image.width, y: top / image.height, width: (right - left + 1) / image.width, height: (bottom - top + 1) / image.height, area, confidence: "EXPLICIT_RENDER_ID", analyzerVersion: COMPONENT_ID_ANALYZER_VERSION };
}

export function extractAllComponentBounds({ image, componentMap }) { return Object.fromEntries(Object.keys(componentMap ?? {}).map(componentId => [componentId, extractComponentBounds({ image, componentMap, componentId })])); }

export function readComponentIdResult(resultRoot, result) {
  const actual = result ?? JSON.parse(fs.readFileSync(path.join(resultRoot, "BLENDER_WORKER_RESULT.json"), "utf8")); const mapPath = path.isAbsolute(actual.componentIdMapPath ?? "") ? actual.componentIdMapPath : path.join(resultRoot, actual.componentIdMapPath ?? "COMPONENT_ID_MAP.json"); const renderPath = path.isAbsolute(actual.componentIdRender.path) ? actual.componentIdRender.path : path.join(resultRoot, actual.componentIdRender.path); const map = JSON.parse(fs.readFileSync(mapPath, "utf8")); const image = decodeComponentIdPng(renderPath); return { map, image, bounds: extractAllComponentBounds({ image, componentMap: map }) };
}
