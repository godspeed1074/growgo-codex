import { onSchedule } from "firebase-functions/v2/scheduler";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  buildDailyOperationsReport,
  dailyOperationsReportRef,
  type DailyOperationsProvider
} from "../domain/admin/dailyOperationsReport";
import { getAdminFirestore, getFirebaseAdminApp } from "../firebaseAdmin";

const GCP_BILLING_EXPORT_TABLE_ENV = "GROWGO_GCP_BILLING_EXPORT_TABLE" as const;
const VERCEL_BILLING_TOKEN_ENV = "GROWGO_VERCEL_BILLING_API_TOKEN" as const;
const VERCEL_TEAM_ID_ENV = "GROWGO_VERCEL_TEAM_ID" as const;
const VERCEL_BILLING_ENDPOINT = "https://api.vercel.com/v1/billing/charges";

type CostTotals = {
  yesterdayCost: number;
  monthToDateCost: number;
  currency: string;
};

export function readDailyOperationsBillingConfiguration(
  env: Readonly<Record<string, string | undefined>> = process.env
) {
  return {
    firebaseBillingExportTable: normalizeBigQueryTable(env[GCP_BILLING_EXPORT_TABLE_ENV]),
    vercelBillingToken: normalizeSecret(env[VERCEL_BILLING_TOKEN_ENV]),
    vercelTeamId: normalizeVercelTeamId(env[VERCEL_TEAM_ID_ENV])
  };
}

export async function refreshDailyOperationsReportAt(
  now: Date = new Date(),
  env: Readonly<Record<string, string | undefined>> = process.env
) {
  const reportDay = getPreviousUtcDay(now);
  const config = readDailyOperationsBillingConfiguration(env);
  const [firebase, vercel] = await Promise.all([
    readFirebaseCostReport({ reportDay, config }),
    readVercelCostReport({ reportDay, config })
  ]);
  const report = buildDailyOperationsReport({
    utcDay: reportDay,
    generatedAt: now,
    firebase,
    vercel
  });
  await dailyOperationsReportRef(getAdminFirestore(), reportDay).set(
    {
      ...serializeForStorage(report),
      updatedAt: new Date()
    },
    { merge: true }
  );
  return report;
}

async function readFirebaseCostReport(params: {
  reportDay: string;
  config: ReturnType<typeof readDailyOperationsBillingConfiguration>;
}): Promise<DailyOperationsProvider> {
  if (!params.config.firebaseBillingExportTable) {
    return setupRequired("Connect Google Cloud Billing export to show Firebase costs.");
  }
  try {
    const totals = await fetchFirebaseCostTotals({
      reportDay: params.reportDay,
      billingExportTable: params.config.firebaseBillingExportTable
    });
    return totalsToProvider(
      totals,
      "Imported from Google Cloud Billing export data.",
      "No billable Google Cloud charges were reported for this day."
    );
  } catch (error) {
    console.warn("Firebase daily billing import failed", error);
    return unavailable("Firebase billing export could not be reached for this daily report.");
  }
}

async function readVercelCostReport(params: {
  reportDay: string;
  config: ReturnType<typeof readDailyOperationsBillingConfiguration>;
}): Promise<DailyOperationsProvider> {
  const { vercelBillingToken, vercelTeamId } = params.config;
  if (!vercelBillingToken || !vercelTeamId) {
    return setupRequired("Connect a secure Vercel billing token to show Vercel costs.");
  }

  try {
    const totals = await fetchVercelCostTotals({
      reportDay: params.reportDay,
      token: vercelBillingToken,
      teamId: vercelTeamId
    });
    return totalsToProvider(
      totals,
      "Imported from Vercel's daily billing data.",
      "No billable Vercel charges were reported for this day."
    );
  } catch (error) {
    console.warn("Vercel daily billing import failed", error);
    return unavailable("Vercel billing data could not be reached for this daily report.");
  }
}

export async function fetchVercelCostTotals(params: {
  reportDay: string;
  token: string;
  teamId: string;
  fetchImpl?: typeof fetch;
}): Promise<CostTotals | null> {
  const monthStart = `${params.reportDay.slice(0, 8)}01`;
  const [yesterdayEvents, monthEvents] = await Promise.all([
    fetchVercelBillingEvents({ ...params, fromDay: params.reportDay, toDay: getNextUtcDay(params.reportDay) }),
    fetchVercelBillingEvents({ ...params, fromDay: monthStart, toDay: getNextUtcDay(params.reportDay) })
  ]);
  const yesterday = sumVercelCostForRange(yesterdayEvents);
  const monthToDate = sumVercelCostForRange(monthEvents);
  if (!yesterday && !monthToDate) return null;
  if (yesterday && monthToDate && yesterday.currency !== monthToDate.currency) {
    throw new Error("Vercel returned costs in multiple currencies.");
  }
  const currency = yesterday?.currency ?? monthToDate?.currency;
  if (!currency) return null;
  return {
    yesterdayCost: yesterday?.cost ?? 0,
    monthToDateCost: monthToDate?.cost ?? 0,
    currency
  };
}

async function fetchVercelBillingEvents(params: {
  reportDay: string;
  token: string;
  teamId: string;
  fetchImpl?: typeof fetch;
  fromDay: string;
  toDay: string;
}): Promise<Record<string, unknown>[]> {
  const fetchImpl = params.fetchImpl ?? fetch;
  const from = `${params.fromDay}T00:00:00.000Z`;
  const to = `${params.toDay}T00:00:00.000Z`;
  const url = new URL(VERCEL_BILLING_ENDPOINT);
  url.searchParams.set("teamId", params.teamId);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${params.token}`,
      Accept: "application/x-ndjson"
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Vercel billing response ${response.status}`);
  return parseJsonLines(await response.text());
}

export function sumVercelCostForRange(events: readonly Record<string, unknown>[]): {
  cost: number;
  currency: string;
} | null {
  let currency: string | null = null;
  let total = 0;
  let foundCost = false;
  for (const event of events) {
    const eventCurrency = readCurrency(event.BillingCurrency) ?? readCurrency(event.Currency);
    const cost = readFiniteNumber(event.BilledCost) ?? readFiniteNumber(event.EffectiveCost);
    if (!eventCurrency || cost === null) continue;
    if (currency && currency !== eventCurrency) return null;
    currency = eventCurrency;
    total += cost;
    foundCost = true;
  }
  if (!foundCost || !currency || total <= 0) return null;
  return { cost: total, currency };
}

export async function fetchFirebaseCostTotals(params: {
  reportDay: string;
  billingExportTable: string;
  fetchImpl?: typeof fetch;
}): Promise<CostTotals | null> {
  const projectId = params.billingExportTable.split(".")[0];
  const credential = getFirebaseAdminApp().options.credential;
  if (!credential) throw new Error("Firebase runtime credentials are unavailable.");
  const accessToken = await credential.getAccessToken();
  if (!accessToken.access_token) throw new Error("Firebase runtime access token is unavailable.");
  const monthStart = `${params.reportDay.slice(0, 8)}01`;
  const query = [
    "SELECT currency,",
    "SUM(IF(DATE(usage_start_time) = @reportDay, cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0), 0)) AS yesterdayCost,",
    "SUM(cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS monthToDateCost",
    `FROM \`${params.billingExportTable}\``,
    "WHERE DATE(usage_start_time) >= @monthStart",
    "AND DATE(usage_start_time) < @nextDay",
    "GROUP BY currency"
  ].join(" ");
  const fetchImpl = params.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/queries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        useLegacySql: false,
        parameterMode: "NAMED",
        queryParameters: [
          dateQueryParameter("reportDay", params.reportDay),
          dateQueryParameter("monthStart", monthStart),
          dateQueryParameter("nextDay", getNextUtcDay(params.reportDay))
        ]
      }),
      signal: AbortSignal.timeout(20000)
    }
  );
  if (!response.ok) throw new Error(`Google Cloud Billing response ${response.status}`);
  const payload = await response.json() as {
    jobComplete?: unknown;
    rows?: unknown;
  };
  if (payload.jobComplete !== true) throw new Error("Google Cloud Billing query is still running.");
  return readFirebaseCostRows(payload.rows);
}

function dateQueryParameter(name: string, value: string) {
  return {
    name,
    parameterType: { type: "DATE" },
    parameterValue: { value }
  };
}

function readFirebaseCostRows(rows: unknown): CostTotals | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let totals: CostTotals | null = null;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const fields = (row as { f?: unknown }).f;
    if (!Array.isArray(fields) || fields.length < 3) continue;
    const currency = readCurrency(readBigQueryValue(fields[0]));
    const yesterdayCost = readFiniteNumber(Number(readBigQueryValue(fields[1])));
    const monthToDateCost = readFiniteNumber(Number(readBigQueryValue(fields[2])));
    if (!currency || yesterdayCost === null || monthToDateCost === null) continue;
    if (totals) throw new Error("Google Cloud Billing returned multiple currencies.");
    totals = { currency, yesterdayCost, monthToDateCost };
  }
  return totals;
}

function readBigQueryValue(value: unknown): unknown {
  return value && typeof value === "object" ? (value as { v?: unknown }).v : undefined;
}

function totalsToProvider(
  totals: CostTotals | null,
  detail: string,
  noChargesDetail: string
): DailyOperationsProvider {
  if (!totals) {
    return {
      status: "no-charges",
      yesterdayCost: 0,
      monthToDateCost: null,
      currency: null,
      detail: noChargesDetail
    };
  }
  return {
    status: "available",
    yesterdayCost: totals.yesterdayCost,
    monthToDateCost: totals.monthToDateCost,
    currency: totals.currency,
    detail
  };
}

function setupRequired(detail: string): DailyOperationsProvider {
  return {
    status: "setup-required",
    yesterdayCost: null,
    monthToDateCost: null,
    currency: null,
    detail
  };
}

function unavailable(detail: string): DailyOperationsProvider {
  return {
    status: "unavailable",
    yesterdayCost: null,
    monthToDateCost: null,
    currency: null,
    detail
  };
}

function serializeForStorage(report: ReturnType<typeof buildDailyOperationsReport>) {
  return {
    schemaVersion: report.schemaVersion,
    utcDay: report.utcDay,
    generatedAt: report.generatedAt,
    services: report.services,
    providers: report.providers
  };
}

function parseJsonLines(value: string): Record<string, unknown>[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? [parsed as Record<string, unknown>]
          : [];
      } catch {
        return [];
      }
    });
}

function normalizeBigQueryTable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+$/.test(normalized)
    ? normalized
    : null;
}

function normalizeSecret(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 20 ? value.trim() : null;
}

function normalizeVercelTeamId(value: unknown): string | null {
  return typeof value === "string" && /^team_[A-Za-z0-9]+$/.test(value.trim())
    ? value.trim()
    : null;
}

function readCurrency(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value)
    ? value.toUpperCase()
    : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function getPreviousUtcDay(now: Date): string {
  const priorDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return toUtcDay(priorDay);
}

function getNextUtcDay(day: string): string {
  const parsed = new Date(`${day}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return toUtcDay(parsed);
}

function toUtcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export const refreshDailyOperationsReport = onSchedule(
  {
    region: runtimeConfig.region,
    schedule: "15 0 * * *",
    timeZone: "Etc/UTC"
  },
  async () => {
    const report = await refreshDailyOperationsReportAt();
    console.info("Daily operations report refreshed", { utcDay: report.utcDay });
  }
);
