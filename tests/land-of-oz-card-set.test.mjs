import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = join(repoRoot, "assets/cards/land-of-oz");
const manifest = JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8"));
const script = readFileSync(join(repoRoot, "script.js"), "utf8");
const styles = readFileSync(join(repoRoot, "style.css"), "utf8");

test("Land of Oz collection matches the approved 40-card manifest", () => {
  const manifestBlock = script.match(/const LAND_OF_OZ_CARD_MANIFEST = \[([\s\S]*?)\]\.map\(/);
  assert.ok(manifestBlock, "Land of Oz card manifest exists in the app");

  const appCards = [...manifestBlock[1].matchAll(/\["([^"]+)", "([^"]+)"\]/g)]
    .map(([, id, title]) => ({ id, title }));
  assert.equal(manifest.cardCount, 40);
  assert.equal(manifest.cards.length, 40);
  assert.deepEqual(appCards, manifest.cards.map(({ id, title }) => ({ id, title })));
});

test("all Land of Oz artwork is present, unique, and under 50 KB", () => {
  const expected = [...manifest.cards.map((card) => `${card.id}.jpg`), "land-of-oz-card-back.jpg"].sort();
  const actual = readdirSync(assetDir).filter((file) => file.endsWith(".jpg")).sort();
  assert.deepEqual(actual, expected);

  const hashes = manifest.cards.map((card) => `${card.id}.jpg`).map((file) => createHash("sha256")
    .update(readFileSync(join(assetDir, file))).digest("hex"));
  assert.equal(new Set(hashes).size, 40, "each card image is distinct");
  assert.ok(actual.every((file) => statSync(join(assetDir, file)).size < 50 * 1024));
});

test("collection UI hides unowned card art and styles the Oz set", () => {
  assert.match(script, /hideUnownedArt: true/);
  assert.match(script, /card\.hideUnownedArt \? null : card\.image/);
  assert.match(script, /setId: "land-of-oz"[\s\S]*?themeClass: "land-of-oz"/);
  assert.match(script, /setId: "land-of-oz"[\s\S]*?coverImage: "assets\/cards\/land-of-oz\/land-of-oz-card-back\.jpg\?v=1"/);
  assert.match(script, /ghostImage: "assets\/cards\/land-of-oz\/land-of-oz-card-back\.jpg\?v=1"/);
  assert.match(styles, /\.card-set-back\.land-of-oz/);
});

test("Land of Oz is eligible for the existing random pack pool", () => {
  assert.match(script, /setId: "land-of-oz"[\s\S]*?packEligible: true[\s\S]*?cards: LAND_OF_OZ_CARD_MANIFEST/);
  assert.match(script, /getAllCards\(\)\.filter\(\(card\) => getCardSet\(card\.setId\)\?\.packEligible !== false\)/);
});
