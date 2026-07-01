(function initializeGrowGoCustom25DVisualPassiveReports(globalScope) {
  if (!globalScope || typeof globalScope !== "object") {
    return;
  }

  var passiveReportsNamespace =
    globalScope.GrowGoCustom25DVisualPassiveReports || {};

  passiveReportsNamespace.phase358LoadPathAvailable = true;
  passiveReportsNamespace.phase = 358;
  passiveReportsNamespace.inert = true;
  passiveReportsNamespace.reportOnly = true;
  passiveReportsNamespace.helpersMoved = 0;

  globalScope.GrowGoCustom25DVisualPassiveReports = passiveReportsNamespace;
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null
);
