import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("Farmer Market attendance uses a rotating, location-verified code", async () => {
  const markets = await import(path.join(repoRoot, "functions/lib/api/farmerMarkets.js"));
  const source = fs.readFileSync(path.join(repoRoot, "functions/src/api/farmerMarkets.ts"), "utf8");

  assert.equal(markets.FARMER_MARKET_CHECK_IN_RADIUS_METRES, 100);
  assert.equal(markets.FARMER_MARKET_CHECK_IN_QR_ROTATION_MS, 10 * 60 * 1_000);
  assert.equal(markets.FARMER_MARKET_EVENT_PEW_PEW_CHARGES, 5);
  assert.match(source, /GGM1:\$\{input\.marketId\}:\$\{token\}/);
  assert.match(source, /assertPlayerIsAtMarket/);
  assert.match(source, /Check in first before showing this market's code/);
});

test("only a live Farmer Market Pew-Pew pass with charges is selected", async () => {
  const markets = await import(path.join(repoRoot, "functions/lib/api/farmerMarkets.js"));
  const now = new Date("2026-09-05T12:00:00.000Z");
  const pass = markets.getActiveFarmerMarketEventPewPewPass({
    passes: {
      FM00000000000001: {
        marketName: "Earlier market",
        endsAt: new Date("2026-09-05T14:00:00.000Z"),
        chargesAvailable: 3
      },
      FM00000000000002: {
        marketName: "Empty market",
        endsAt: new Date("2026-09-05T13:00:00.000Z"),
        chargesAvailable: 0
      },
      FM00000000000003: {
        marketName: "Expired market",
        endsAt: new Date("2026-09-05T11:00:00.000Z"),
        chargesAvailable: 5
      }
    }
  }, now);

  assert.equal(pass?.marketId, "FM00000000000001");
  assert.equal(pass?.chargesAvailable, 3);
});

test("event charges are consumed before normal Pew-Pew charges", () => {
  const source = fs.readFileSync(path.join(repoRoot, "functions/src/api/fireAlphaPewPewBeam.ts"), "utf8");
  assert.match(source, /const useEventPewPewCharge = eventPewPewPass !== null/);
  assert.match(source, /chargesAvailable: useEventPewPewCharge\n        \? chargeState\.chargesAvailable/);
  assert.match(source, /eventChargesAvailable: nextEventChargesAvailable/);
});

test("Farmer Market RSVPs are distinct from verified on-site attendance", () => {
  const source = fs.readFileSync(path.join(repoRoot, "functions/src/api/farmerMarkets.ts"), "utf8");

  assert.match(source, /FARMER_MARKET_RSVP_STATES_COLLECTION/);
  assert.match(source, /setFarmerMarketWillAttendHandler/);
  assert.match(source, /willAttendCount/);
  assert.match(source, /hostWillAttend: true/);
  assert.match(source, /Will attend list closes when this Farmer Market begins/);
  assert.match(source, /only the existing GPS-and-QR check-in can/);
});
