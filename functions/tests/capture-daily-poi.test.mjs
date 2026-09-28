import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadDailyPoiModule() {
  return import(path.join(repoRoot, "functions/lib/api/captureDailyPoi.js"));
}

test("daily green POIs use the approved base rewards", async () => {
  const { DAILY_GREEN_POI_COINS, DAILY_GREEN_POI_POINTS } = await loadDailyPoiModule();

  assert.equal(DAILY_GREEN_POI_POINTS, 20);
  assert.equal(DAILY_GREEN_POI_COINS, 10);
});

test("daily green POI captures accept only a complete location request", async () => {
  const { validateDailyPoiCaptureRequest } = await loadDailyPoiModule();
  const request = {
    data: {
      pinId: "poi:osm:node:200",
      latitude: -38.45,
      longitude: 145.24,
      accuracyMetres: 8,
      deviceId: "alpha-device-session"
    }
  };

  assert.deepEqual(validateDailyPoiCaptureRequest(request), request.data);
  assert.throws(
    () => validateDailyPoiCaptureRequest({ data: { ...request.data, bonusCoins: 1 } }),
    /unsupported keys/i
  );
});

test("legacy normal churches and parks remain daily capturable", async () => {
  const { isDailyGreenPoi } = await loadDailyPoiModule();

  assert.equal(isDailyGreenPoi({
    id: "poi:church:legacy",
    type: "poi",
    category: "Places",
    subcategory: "Church",
    icon: "church",
    lat: -38.45,
    lng: 145.24
  }, "poi:church:legacy"), true);

  assert.equal(isDailyGreenPoi({
    id: "poi:park:current",
    type: "poi",
    category: "Places",
    rarity: "normal",
    subcategory: "Park",
    icon: "park",
    lat: -38.45,
    lng: 145.24
  }, "poi:park:current"), true);

  assert.equal(isDailyGreenPoi({
    id: "poi:park:special",
    type: "poi",
    category: "Places",
    rarity: "special",
    subcategory: "Park",
    icon: "park",
    lat: -38.45,
    lng: 145.24
  }, "poi:park:special"), false);
});
