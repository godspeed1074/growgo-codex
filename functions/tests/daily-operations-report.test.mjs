import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("daily Mission Control reports are stored once per UTC day", async () => {
  const report = await import(path.join(repoRoot, "functions/lib/domain/admin/dailyOperationsReport.js"));
  const built = report.buildDailyOperationsReport({
    utcDay: "2026-09-04",
    generatedAt: new Date("2026-09-05T00:15:00.000Z"),
    firebase: {
      status: "setup-required",
      yesterdayCost: null,
      monthToDateCost: null,
      currency: null,
      detail: "Connect billing."
    },
    vercel: {
      status: "available",
      yesterdayCost: 0.1,
      monthToDateCost: 0.4,
      currency: "USD",
      detail: "Imported."
    }
  });
  assert.equal(report.DAILY_OPERATIONS_REPORTS_COLLECTION, "adminDailyOperationsReports");
  assert.equal(built.utcDay, "2026-09-04");
  assert.equal(built.services.gameBackend, "healthy");
  assert.equal(built.providers.vercel.monthToDateCost, 0.4);
});

test("billing connections are optional and never require a browser token", async () => {
  const operations = await import(path.join(repoRoot, "functions/lib/api/refreshDailyOperationsReport.js"));
  assert.deepEqual(operations.readDailyOperationsBillingConfiguration({}), {
    firebaseBillingExportTable: null,
    vercelBillingToken: null,
    vercelTeamId: null
  });
  const configured = operations.readDailyOperationsBillingConfiguration({
    GROWGO_GCP_BILLING_EXPORT_TABLE: "growgo-development.billing.gcp_billing_export_v1_123",
    GROWGO_VERCEL_BILLING_API_TOKEN: "a_very_long_server_only_vercel_token",
    GROWGO_VERCEL_TEAM_ID: "team_abc123"
  });
  assert.equal(configured.firebaseBillingExportTable, "growgo-development.billing.gcp_billing_export_v1_123");
  assert.equal(configured.vercelBillingToken, "a_very_long_server_only_vercel_token");
  assert.equal(configured.vercelTeamId, "team_abc123");
});

test("Vercel billing totals reject mixed currencies rather than silently converting", async () => {
  const operations = await import(path.join(repoRoot, "functions/lib/api/refreshDailyOperationsReport.js"));
  assert.deepEqual(
    operations.sumVercelCostForRange([
      { BillingCurrency: "USD", BilledCost: 0.04 },
      { BillingCurrency: "USD", BilledCost: 0.06 }
    ]),
    { currency: "USD", cost: 0.1 }
  );
  assert.equal(
    operations.sumVercelCostForRange([{ BillingCurrency: "AUD", BilledCost: 0 }]),
    null,
    "a provider response with no positive usable charge rows is treated as no reported cost"
  );
});

test("Mission Control passes live status to the Owner but not provider costs to Admins", () => {
  const source = read("functions/src/api/adminControlCenter.ts");
  const client = read("script.js");
  assert.match(source, /dailyOperationsReportRef\(db, yesterdayKey\)\.get\(\)/);
  assert.match(source, /gameBackend: "connected"/);
  assert.match(source, /account\.role === "owner"[\s\S]*\? dailyOperations/);
  assert.match(client, /renderAdminDailyServerReport/);
  assert.match(client, /no estimates or silent currency conversions/i);
});
