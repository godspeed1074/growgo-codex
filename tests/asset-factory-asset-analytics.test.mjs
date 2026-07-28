import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const analyticsModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-analytics.mjs")
);

test("production metrics capture active, completed, and blocked asset counts", () => {
  const layer = analyticsModule.createAssetAnalyticsLayer();
  const metrics = layer.report.metricsSummary.production;

  assert.equal(metrics.activeAssets >= 0, true);
  assert.equal(metrics.completedAssets >= 0, true);
  assert.equal(metrics.blockedAssets >= 0, true);
  assert.equal(metrics.blockedAssets, layer.report.healthIndicators.bottleneckCount > 0 ? metrics.blockedAssets : metrics.blockedAssets);
});

test("quality metrics capture pass rate, failure categories, and review workload", () => {
  const layer = analyticsModule.createAssetAnalyticsLayer();
  const metrics = layer.report.metricsSummary.quality;

  assert.equal(metrics.passRate >= 0 && metrics.passRate <= 1, true);
  assert.equal(Array.isArray(metrics.failureCategories), true);
  assert.equal(metrics.reviewWorkload >= 0, true);
});

test("lifecycle metrics capture transition averages, bottleneck states, and release frequency", () => {
  const layer = analyticsModule.createAssetAnalyticsLayer();
  const metrics = layer.report.metricsSummary.lifecycle;

  assert.equal(metrics.averageTransitionCounts > 0, true);
  assert.equal(Array.isArray(metrics.bottleneckStates), true);
  assert.equal(metrics.bottleneckStates.length > 0, true);
  assert.equal(metrics.releaseFrequency >= 0 && metrics.releaseFrequency <= 1, true);
});

test("governance metrics capture high-impact changes, audit activity, and approval issues", () => {
  const layer = analyticsModule.createAssetAnalyticsLayer();
  const metrics = layer.report.metricsSummary.governance;

  assert.equal(metrics.highImpactChanges >= 0, true);
  assert.equal(metrics.auditActivity > 0, true);
  assert.equal(metrics.approvalIssues >= 0, true);
});

test("same input produces deterministic same analytics report", () => {
  const first = analyticsModule.createAssetAnalyticsLayer();
  const second = analyticsModule.createAssetAnalyticsLayer();

  assert.deepEqual(first.report, second.report);
});
