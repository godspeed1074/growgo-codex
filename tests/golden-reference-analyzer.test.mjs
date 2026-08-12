import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildReferencePackage, transitionReference, validateReferenceSpec, writeReferencePackage } from "../asset-factory/golden-reference/golden-reference-analyzer.mjs";

test("reference states preserve approved immutability", () => {
  const ref = { assetId: "TREE", referenceId: "REF", version: "v1", checksum: "abc", state: "REVIEW_REFERENCE" };
  assert.equal(transitionReference(ref, "APPROVED_GOLDEN_REFERENCE").state, "APPROVED_GOLDEN_REFERENCE");
  assert.throws(() => transitionReference({ ...ref, state: "APPROVED_GOLDEN_REFERENCE" }, "REVIEW_REFERENCE"), /immutable/);
});

test("analyzer creates spec, component map, palette and report", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "golden-ref-"));
  const image = path.join(dir, "reference.png");
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfc000000301010018dd8db00000000049454e44ae426082", "hex");
  fs.writeFileSync(image, png);
  const pkg = buildReferencePackage({ assetId: "TREE", referenceId: "REF", version: "v1", imagePath: image, components: [{ name: "TRUNK_MAIN", x: .4, y: .3, width: .2, height: .6 }], gameplayCamera: { type: "ORTHOGRAPHIC_LOCKED" } });
  writeReferencePackage(pkg, path.join(dir, "analysis"));
  assert.equal(validateReferenceSpec(pkg.spec, pkg.reference).ok, true);
  assert.equal(fs.existsSync(path.join(dir, "analysis", "REFERENCE_SPEC.json")), true);
});

test("validator rejects missing and mismatched references", () => {
  const ref = { assetId: "TREE", referenceId: "REF", version: "v1", checksum: "abc", state: "APPROVED_GOLDEN_REFERENCE" };
  assert.equal(validateReferenceSpec({}, ref).errorCode, "missing_measurements");
  const spec = { assetId: "TREE", referenceId: "OTHER", referenceVersion: "v1", sourceImage: { checksum: "abc" }, visibleBoundingBox: {}, components: [], gameplayCamera: {}, priorityOrder: [] };
  assert.equal(validateReferenceSpec(spec, ref).errorCode, "reference_identity_mismatch");
});
