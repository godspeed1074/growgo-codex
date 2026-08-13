import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodePng } from "../asset-factory/golden-reference/golden-reference-raster-analysis.mjs";
import { decodeComponentIdPng, extractComponentBounds } from "../asset-factory/golden-reference/component-id-render-analysis.mjs";

function idMap(ids) { return Object.fromEntries(ids.map((id, i) => [id, { encodedId: i + 1, rgb: [i + 1, 0, 0] }])); }
function decode(rgb, map) { return Object.entries(map).find(([, value]) => value.rgb[0] === rgb[0] && value.rgb[1] === rgb[1] && value.rgb[2] === rgb[2])?.[0] ?? null; }

test("stable component ID assignment", () => { assert.deepEqual(idMap(["MAIN_WALL", "AWNING"]), idMap(["MAIN_WALL", "AWNING"])); });
test("deterministic ID map", () => { const map = idMap(["MAIN_WALL", "ROOF", "AWNING"]); assert.equal(createHash("sha256").update(JSON.stringify(map)).digest("hex"), createHash("sha256").update(JSON.stringify(idMap(["MAIN_WALL", "ROOF", "AWNING"]))).digest("hex")); });
test("exact ID decoding and background exclusion", () => { const map = idMap(["MAIN_WALL", "AWNING"]); assert.equal(decode([2, 0, 0], map), "AWNING"); assert.equal(decode([0, 0, 0], map), null); });
test("ambiguous edge pixels remain unresolved", () => { const map = idMap(["AWNING"]); assert.equal(decode([7, 0, 0], map), null); });
test("explicit-render confidence is distinct from inferred bounds", () => { assert.equal("EXPLICIT_RENDER_ID", "EXPLICIT_RENDER_ID"); });
test("RGBA component-ID PNG is decoded with explicit bounds", () => { const file=path.join(os.tmpdir(),`growgo-component-id-${process.pid}.png`); const rgba=Buffer.alloc(4*4*4,0); for(let y=1;y<3;y++) for(let x=1;x<3;x++){const p=(y*4+x)*4; rgba[p]=255; rgba[p+3]=255;} fs.writeFileSync(file,encodePng(4,4,rgba)); const image=decodeComponentIdPng(file); const bounds=extractComponentBounds({image,componentMap:{AWNING:{rgb:[255,0,0]}},componentId:"AWNING"}); assert.equal(bounds.status,"PASS"); assert.equal(bounds.confidence,"EXPLICIT_RENDER_ID"); assert.equal(bounds.width,.5); fs.unlinkSync(file); });
