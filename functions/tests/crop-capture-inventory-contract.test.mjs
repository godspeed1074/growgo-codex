import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("a capture reward maps every supported planted crop to its inventory resource", async () => {
  const capture = await import(
    path.join(repoRoot, "functions/lib/domain/captures/privateAlphaCapture.js")
  );

  assert.equal(capture.getCropHarvestItemId("wheat_seed"), "wheat");
  assert.equal(capture.getCropHarvestItemId("corn_seed"), "corn");
  assert.equal(capture.getCropHarvestItemId("sugar_cane_seed"), "sugar_cane");
  assert.equal(capture.getCropHarvestItemId("tomato_seed"), "tomato");
  assert.equal(capture.getCropHarvestItemId("cocoa_bean_seed"), "cocoa_beans");
  assert.equal(capture.getCropHarvestItemId("unknown_seed"), null);
});
