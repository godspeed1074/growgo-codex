import { Timestamp } from "firebase-admin/firestore";

export const DAILY_OPERATIONS_REPORTS_COLLECTION = "adminDailyOperationsReports";
export const DAILY_OPERATIONS_REPORT_SCHEMA_VERSION = 1;

export type OperationsProviderStatus =
  | "available"
  | "no-charges"
  | "setup-required"
  | "delayed"
  | "unavailable";

export type DailyOperationsProvider = {
  status: OperationsProviderStatus;
  yesterdayCost: number | null;
  monthToDateCost: number | null;
  currency: string | null;
  detail: string;
};

export type DailyOperationsReport = {
  schemaVersion: number;
  utcDay: string;
  generatedAt: Date;
  services: {
    gameBackend: "healthy" | "unavailable";
    dailyReport: "ready";
  };
  providers: {
    firebase: DailyOperationsProvider;
    vercel: DailyOperationsProvider;
  };
};

export function dailyOperationsReportRef(db: FirebaseFirestore.Firestore, utcDay: string) {
  return db.collection(DAILY_OPERATIONS_REPORTS_COLLECTION).doc(utcDay);
}

export function buildDailyOperationsReport(params: {
  utcDay: string;
  generatedAt: Date;
  firebase: DailyOperationsProvider;
  vercel: DailyOperationsProvider;
}): DailyOperationsReport {
  return {
    schemaVersion: DAILY_OPERATIONS_REPORT_SCHEMA_VERSION,
    utcDay: params.utcDay,
    generatedAt: params.generatedAt,
    services: {
      gameBackend: "healthy",
      dailyReport: "ready"
    },
    providers: {
      firebase: sanitizeProvider(params.firebase),
      vercel: sanitizeProvider(params.vercel)
    }
  };
}

export function serializeDailyOperationsReport(report: DailyOperationsReport) {
  return {
    schemaVersion: DAILY_OPERATIONS_REPORT_SCHEMA_VERSION,
    utcDay: report.utcDay,
    generatedAt: Timestamp.fromDate(report.generatedAt),
    services: report.services,
    providers: report.providers
  };
}

export function readDailyOperationsReport(value: unknown): DailyOperationsReport | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (source.schemaVersion !== DAILY_OPERATIONS_REPORT_SCHEMA_VERSION) return null;
  if (!isUtcDay(source.utcDay)) return null;
  const generatedAt = readDate(source.generatedAt);
  if (!generatedAt) return null;
  const services = source.services as Record<string, unknown> | null;
  const providers = source.providers as Record<string, unknown> | null;
  if (!services || !providers) return null;
  if (services.gameBackend !== "healthy" && services.gameBackend !== "unavailable") return null;
  if (services.dailyReport !== "ready") return null;
  const firebase = readProvider(providers.firebase);
  const vercel = readProvider(providers.vercel);
  if (!firebase || !vercel) return null;
  return {
    schemaVersion: DAILY_OPERATIONS_REPORT_SCHEMA_VERSION,
    utcDay: source.utcDay,
    generatedAt,
    services: {
      gameBackend: services.gameBackend,
      dailyReport: "ready"
    },
    providers: { firebase, vercel }
  };
}

export function createAwaitingDailyOperationsReport(params: {
  utcDay: string;
  now: Date;
  firebaseConfigured: boolean;
  vercelConfigured: boolean;
}): DailyOperationsReport {
  return buildDailyOperationsReport({
    utcDay: params.utcDay,
    generatedAt: params.now,
    firebase: pendingProvider(
      params.firebaseConfigured,
      "The first saved daily Firebase report has not run yet."
    ),
    vercel: pendingProvider(
      params.vercelConfigured,
      "The first saved daily Vercel report has not run yet."
    )
  });
}

function pendingProvider(configured: boolean, configuredDetail: string): DailyOperationsProvider {
  return {
    status: configured ? "delayed" : "setup-required",
    yesterdayCost: null,
    monthToDateCost: null,
    currency: null,
    detail: configured
      ? configuredDetail
      : "Secure billing connection has not been configured."
  };
}

function sanitizeProvider(provider: DailyOperationsProvider): DailyOperationsProvider {
  return {
    status: provider.status,
    yesterdayCost: sanitizeCost(provider.yesterdayCost),
    monthToDateCost: sanitizeCost(provider.monthToDateCost),
    currency: normalizeCurrency(provider.currency),
    detail: typeof provider.detail === "string" && provider.detail.trim().length > 0
      ? provider.detail.trim().slice(0, 220)
      : "No provider detail was reported."
  };
}

function readProvider(value: unknown): DailyOperationsProvider | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (!isProviderStatus(source.status)) return null;
  if (typeof source.detail !== "string") return null;
  return sanitizeProvider({
    status: source.status,
    yesterdayCost: readCost(source.yesterdayCost),
    monthToDateCost: readCost(source.monthToDateCost),
    currency: normalizeCurrency(source.currency),
    detail: source.detail
  });
}

function isProviderStatus(value: unknown): value is OperationsProviderStatus {
  return value === "available" ||
    value === "no-charges" ||
    value === "setup-required" ||
    value === "delayed" ||
    value === "unavailable";
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
}

function sanitizeCost(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value * 1000000) / 1000000
    : null;
}

function readCost(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeCurrency(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value)
    ? value.toUpperCase()
    : null;
}

function isUtcDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
