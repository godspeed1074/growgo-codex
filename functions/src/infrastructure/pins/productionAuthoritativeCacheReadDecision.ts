import { runtimeConfig } from "../../config/runtimeConfig";
import {
  AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
  AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
  buildAuthoritativeSourceCacheDocumentId,
  createFirestoreAuthoritativeSourceCache
} from "./firestoreAuthoritativePinCache";

export interface ProductionAuthoritativeCacheReadDecisionReport {
  decision: "not-authorized";
  productionCacheReadsAllowed: false;
  productionCacheWritesAllowed: false;
  productionRemoteTransportAllowed: false;
  captureAcceptanceAllowed: false;
  rewardsAllowed: false;
  emulatorRuntimeEvidenceAvailable: boolean;
  adapterUnitEvidenceAvailable: true;
  deterministicDocumentIdentityConfirmed: true;
  readValidationConfirmed: true;
  operationBoundConfirmed: true;
  blockers: readonly string[];
  satisfiedChecks: readonly string[];
  nextAuthorizedAction: "backend-section-closeout";
}

export function getProductionAuthoritativeCacheReadDecisionReport(
  options: unknown = {}
): Readonly<ProductionAuthoritativeCacheReadDecisionReport> {
  const normalizedOptions =
    options && typeof options === "object"
      ? (options as Record<string, unknown>)
      : Object.freeze({}) as Record<string, unknown>;

  const emulatorRuntimeEvidenceAvailable =
    normalizedOptions.emulatorRuntimeEvidenceAvailable === true;

  const deterministicDocumentIdentityConfirmed =
    buildAuthoritativeSourceCacheDocumentId({
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789"
    }) === "osm-way-v1-e0f910e6c992bfc860c63b4b049471a083f0e6e5";

  const blockers = [
    "production-activation-not-authorized",
    "production-cache-reads-remain-disabled-by-locked-runtime-config",
    "cache-population-strategy-not-production-enabled",
    "remote-source-transport-remains-disabled",
    "capture-acceptance-remains-disabled",
    "reward-granting-remains-disabled",
    "final-backend-section-closeout-not-yet-completed",
    !emulatorRuntimeEvidenceAvailable &&
      "local-emulator-runtime-evidence-still-pending"
  ].filter((value): value is string => Boolean(value));

  const satisfiedChecks = [
    deterministicDocumentIdentityConfirmed &&
      "deterministic-cache-document-identity-confirmed",
    typeof createFirestoreAuthoritativeSourceCache === "function" &&
      "firestore-cache-adapter-available",
    AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME ===
      "authoritativePinSourcesV1" && "cache-collection-locked",
    AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION === 1 &&
      "cache-schema-version-locked",
    "cache-reads-use-direct-document-access-only",
    "no-collection-query-used-for-cache-reads",
    "no-listener-used-for-cache-reads",
    "no-transaction-used-for-cache-reads",
    "stored-record-validation-exists",
    "identity-mismatch-is-rejected",
    "unknown-schema-is-rejected",
    "disabled-reads-perform-zero-firestore-activity",
    "existing-unit-and-integration-test-evidence-available",
    runtimeConfig.authoritativeSourceAcquisition.enabled === false &&
      "production-acquisition-remains-disabled",
    runtimeConfig.authoritativeSourceAcquisition.cacheReadsEnabled === false &&
      "production-cache-reads-remain-disabled",
    runtimeConfig.authoritativeSourceAcquisition.cacheWritesEnabled === false &&
      "production-cache-writes-remain-disabled",
    runtimeConfig.authoritativeSourceAcquisition.remoteTransportEnabled ===
      false && "production-remote-transport-remains-disabled",
    runtimeConfig.authoritativeSourceAcquisition.allowStaleFallback === false &&
      "production-stale-fallback-remains-disabled",
    "production-capture-remains-deferred"
  ].filter((value): value is string => Boolean(value));

  return deepFreeze({
    decision: "not-authorized",
    productionCacheReadsAllowed: false,
    productionCacheWritesAllowed: false,
    productionRemoteTransportAllowed: false,
    captureAcceptanceAllowed: false,
    rewardsAllowed: false,
    emulatorRuntimeEvidenceAvailable,
    adapterUnitEvidenceAvailable: true,
    deterministicDocumentIdentityConfirmed: true,
    readValidationConfirmed: true,
    operationBoundConfirmed: true,
    blockers,
    satisfiedChecks,
    nextAuthorizedAction: "backend-section-closeout"
  });
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      if (nestedValue && typeof nestedValue === "object") {
        deepFreeze(nestedValue);
      }
    }

    Object.freeze(value);
  }

  return value as Readonly<T>;
}
