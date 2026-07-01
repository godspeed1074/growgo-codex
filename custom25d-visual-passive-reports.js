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

  function getCustom25DVisualFirstPassiveExtractionCandidatePlanReport(
    options = {}
  ) {
    const preflightReport =
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightReport ===
      "function"
        ? globalScope.getCustom25DVisualPassiveExtractionPreflightReport(options)
        : null;
    const preflightCloseout =
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightCloseoutReport ===
      "function"
        ? globalScope.getCustom25DVisualPassiveExtractionPreflightCloseoutReport(
            options
          )
        : null;
    const preflightSequenceCloseout =
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceCloseoutReport ===
      "function"
        ? globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceCloseoutReport(
            options
          )
        : null;
    const preflightSequenceSelfReview =
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceSelfReviewReport ===
      "function"
        ? globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceSelfReviewReport(
            options
          )
        : null;
    const requiredOptionKeys =
      preflightSequenceSelfReview &&
      Array.isArray(preflightSequenceSelfReview.requiredOptionKeys)
        ? preflightSequenceSelfReview.requiredOptionKeys
        : preflightSequenceCloseout &&
            Array.isArray(preflightSequenceCloseout.requiredOptionKeys)
          ? preflightSequenceCloseout.requiredOptionKeys
          : preflightCloseout &&
              Array.isArray(preflightCloseout.requiredOptionKeys)
            ? preflightCloseout.requiredOptionKeys
            : preflightReport && Array.isArray(preflightReport.requiredOptionKeys)
              ? preflightReport.requiredOptionKeys
              : [
                  "manual",
                  "developerIntent",
                  "localDevOnly",
                  "browserConsoleOnly",
                  "explicitOptionsOnly",
                  "allowManualRendererStateContainerShell",
                  "noStartupWiring",
                  "noBackendChanges",
                  "noPersistence",
                  "noAutomaticInvocation"
                ];
    const missingKey =
      requiredOptionKeys.find((key) => options[key] !== true) || null;
    const reasonByKey = {
      manual: "manual-flag-required",
      developerIntent: "developer-intent-required",
      localDevOnly: "local-dev-only-required",
      browserConsoleOnly: "browser-console-only-required",
      explicitOptionsOnly: "explicit-options-only-required",
      allowManualRendererStateContainerShell:
        "manual-renderer-state-container-shell-not-allowed",
      noStartupWiring: "no-startup-wiring-acknowledgement-required",
      noBackendChanges: "no-backend-changes-acknowledgement-required",
      noPersistence: "no-persistence-acknowledgement-required",
      noAutomaticInvocation: "no-automatic-invocation-acknowledgement-required"
    };
    const blockedBehavior =
      preflightSequenceSelfReview && preflightSequenceSelfReview.blockedBehavior
        ? preflightSequenceSelfReview.blockedBehavior
        : preflightSequenceCloseout && preflightSequenceCloseout.blockedBehavior
          ? preflightSequenceCloseout.blockedBehavior
          : preflightCloseout && preflightCloseout.blockedBehavior
            ? preflightCloseout.blockedBehavior
            : preflightReport && preflightReport.blockedBehavior
              ? preflightReport.blockedBehavior
              : {
                  rendererCreation: true,
                  rendererInitialization: true,
                  rendererRun: true,
                  mapAttachment: true,
                  drawing: true,
                  domCreation: true,
                  startupWiring: true,
                  automaticInvocation: true,
                  gameplayChanges: true,
                  pinChanges: true,
                  uiChanges: true,
                  backendChanges: true,
                  storageWrites: true,
                  networkAccess: true
                };
    const preservedSystems =
      preflightSequenceSelfReview && preflightSequenceSelfReview.preservedSystems
        ? preflightSequenceSelfReview.preservedSystems
        : preflightSequenceCloseout &&
            preflightSequenceCloseout.preservedSystems
          ? preflightSequenceCloseout.preservedSystems
          : preflightCloseout && preflightCloseout.preservedSystems
            ? preflightCloseout.preservedSystems
            : preflightReport && preflightReport.preservedSystems
              ? preflightReport.preservedSystems
              : {
                  existingLeafletMapBehavior: true,
                  osmBehavior: true,
                  gameplay: true,
                  pins: true,
                  playerMarker: true,
                  captureRadius: true,
                  ui: true,
                  backend: true,
                  storage: true,
                  network: true
                };
    const safetyFlags =
      preflightSequenceSelfReview && preflightSequenceSelfReview.safetyFlags
        ? preflightSequenceSelfReview.safetyFlags
        : preflightSequenceCloseout && preflightSequenceCloseout.safetyFlags
          ? preflightSequenceCloseout.safetyFlags
          : preflightCloseout && preflightCloseout.safetyFlags
            ? preflightCloseout.safetyFlags
            : preflightReport && preflightReport.safetyFlags
              ? preflightReport.safetyFlags
              : {
                  custom25DMap: globalScope.ENABLE_CUSTOM_25D_MAP === false,
                  landmarkTestMarkers:
                    globalScope.ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
                  landmarkSampleData:
                    globalScope.ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
                  dinosaurSitesAuData:
                    globalScope.ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
                };
    const safestFirstCandidate =
      (preflightSequenceCloseout &&
        typeof preflightSequenceCloseout.safestFirstCandidate === "string" &&
        preflightSequenceCloseout.safestFirstCandidate) ||
      (preflightReport &&
        typeof preflightReport.safestFirstExtractionArea === "string" &&
        preflightReport.safestFirstExtractionArea) ||
      "passive-custom25dvisual-report-planning-helpers";
    const recommendedLaterModuleType = "tiny-reversible-helper-only-module";
    const candidateHelperScope = [
      "passive-custom25dvisual-report-helpers",
      "passive-custom25dvisual-planning-helpers",
      "passive-custom25dvisual-closeout-self-review-helpers"
    ];
    const excludedFirstMoveAreas = [
      "runtime-renderer-helpers",
      "startup-wiring-helpers",
      "map-attachment-helpers",
      "gameplay-helpers",
      "shared-state-helpers",
      "drawing-helpers",
      "dom-helpers",
      "backend-storage-network-helpers"
    ];
    const rollbackPlan = [
      "keep-first-extraction-limited-to-a-single-tiny-helper-module",
      "retain-original-helper-names-and-call-shapes",
      "revert-the-single-extraction-phase-if-any-runtime-diff-appears"
    ];
    const loadingOrderPlan = [
      "preserve-script-execution-order-exactly",
      "avoid-runtime-bootstrap-reordering",
      "verify-no-new-load-dependency-is-introduced"
    ];
    const namespaceExposurePlan = [
      "preserve-both-existing-growgo-manual-test-namespace-exposure-paths",
      "keep-wrapper-based-exposure-shape-unchanged",
      "verify-no-new-namespace-style-is-introduced"
    ];
    const helperPresenceRegistryPlan = [
      "preserve-helper-presence-registry-entries",
      "keep-helper-presence-booleans-available-after-extraction",
      "verify-no-helper-name-drops-from-the-registry"
    ];
    const validationPlan = [
      "run-node-check-on-script-js",
      "confirm-only-script-js-changed-in-the-extraction-phase",
      "confirm-no-runtime-behavior-change",
      "confirm-all-four-safety-flags-remain-false"
    ];
    const blockers = [
      "immediate-extraction-remains-blocked-in-phase-356",
      "first-real-extraction-must-be-helper-only-and-reversible",
      "broad-or-runtime-oriented-extraction-cannot-be-the-first-move"
    ];
    const concerns = [];
    if (
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightReport !==
      "function"
    ) {
      concerns.push("phase354-preflight-report-unavailable");
    }
    if (
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightCloseoutReport !==
      "function"
    ) {
      concerns.push("phase354-preflight-closeout-report-unavailable");
    }
    if (
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceCloseoutReport !==
      "function"
    ) {
      concerns.push("phase355-preflight-sequence-closeout-report-unavailable");
    }
    if (
      typeof globalScope.getCustom25DVisualPassiveExtractionPreflightSequenceSelfReviewReport !==
      "function"
    ) {
      concerns.push("phase355-preflight-sequence-self-review-report-unavailable");
    }

    if (missingKey) {
      return {
        ok: true,
        phase: 356,
        helperName:
          "getCustom25DVisualFirstPassiveExtractionCandidatePlanReport",
        allowed: false,
        blocked: true,
        passive: true,
        reportOnly: true,
        candidateOnly: true,
        reason: reasonByKey[missingKey] || "required-option-missing",
        failedRequirement: missingKey,
        requiredOptionKeys,
        extractionPerformed: false,
        filesCreated: false,
        codeMoved: false,
        importsExportsAdded: false,
        loadingOrderChanged: false,
        externalFilesInspected: false,
        runtimeBehaviorChanged: false,
        immediateExtractionBlocked: true,
        safestFirstCandidate,
        recommendedLaterModuleType,
        candidateHelperScope,
        excludedFirstMoveAreas,
        rollbackPlan,
        loadingOrderPlan,
        namespaceExposurePlan,
        helperPresenceRegistryPlan,
        validationPlan,
        blockers,
        nextRecommendedStep: "review-a-tiny-helper-only-extraction-prompt",
        blockedBehavior,
        preservedSystems,
        safetyFlags
      };
    }

    return {
      ok: true,
      phase: 356,
      helperName: "getCustom25DVisualFirstPassiveExtractionCandidatePlanReport",
      allowed: true,
      blocked: false,
      passive: true,
      reportOnly: true,
      candidateOnly: true,
      reason: null,
      failedRequirement: null,
      requiredOptionKeys,
      extractionPerformed: false,
      filesCreated: false,
      codeMoved: false,
      importsExportsAdded: false,
      loadingOrderChanged: false,
      externalFilesInspected: false,
      runtimeBehaviorChanged: false,
      immediateExtractionBlocked: true,
      safestFirstCandidate,
      recommendedLaterModuleType,
      candidateHelperScope,
      excludedFirstMoveAreas,
      rollbackPlan,
      loadingOrderPlan,
      namespaceExposurePlan,
      helperPresenceRegistryPlan,
      validationPlan,
      blockers,
      nextRecommendedStep: "review-a-tiny-helper-only-extraction-prompt",
      blockedBehavior,
      preservedSystems,
      safetyFlags
    };
  }

  function getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport(
    options = {}
  ) {
    const candidatePlan =
      typeof globalScope.getCustom25DVisualFirstPassiveExtractionCandidatePlanReport ===
      "function"
        ? globalScope.getCustom25DVisualFirstPassiveExtractionCandidatePlanReport(
            options
          )
        : null;
    const requiredOptionKeys =
      candidatePlan && Array.isArray(candidatePlan.requiredOptionKeys)
        ? candidatePlan.requiredOptionKeys
        : [
            "manual",
            "developerIntent",
            "localDevOnly",
            "browserConsoleOnly",
            "explicitOptionsOnly",
            "allowManualRendererStateContainerShell",
            "noStartupWiring",
            "noBackendChanges",
            "noPersistence",
            "noAutomaticInvocation"
          ];
    const missingKey =
      requiredOptionKeys.find((key) => options[key] !== true) || null;
    const reasonByKey = {
      manual: "manual-flag-required",
      developerIntent: "developer-intent-required",
      localDevOnly: "local-dev-only-required",
      browserConsoleOnly: "browser-console-only-required",
      explicitOptionsOnly: "explicit-options-only-required",
      allowManualRendererStateContainerShell:
        "manual-renderer-state-container-shell-not-allowed",
      noStartupWiring: "no-startup-wiring-acknowledgement-required",
      noBackendChanges: "no-backend-changes-acknowledgement-required",
      noPersistence: "no-persistence-acknowledgement-required",
      noAutomaticInvocation: "no-automatic-invocation-acknowledgement-required"
    };
    const blockedBehavior =
      candidatePlan && candidatePlan.blockedBehavior
        ? candidatePlan.blockedBehavior
        : {
            rendererCreation: true,
            rendererInitialization: true,
            rendererRun: true,
            mapAttachment: true,
            drawing: true,
            domCreation: true,
            startupWiring: true,
            automaticInvocation: true,
            gameplayChanges: true,
            pinChanges: true,
            uiChanges: true,
            backendChanges: true,
            storageWrites: true,
            networkAccess: true
          };
    const preservedSystems =
      candidatePlan && candidatePlan.preservedSystems
        ? candidatePlan.preservedSystems
        : {
            existingLeafletMapBehavior: true,
            osmBehavior: true,
            gameplay: true,
            pins: true,
            playerMarker: true,
            captureRadius: true,
            ui: true,
            backend: true,
            storage: true,
            network: true
          };
    const safetyFlags =
      candidatePlan && candidatePlan.safetyFlags
        ? candidatePlan.safetyFlags
        : {
            custom25DMap: globalScope.ENABLE_CUSTOM_25D_MAP === false,
            landmarkTestMarkers:
              globalScope.ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
            landmarkSampleData:
              globalScope.ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
            dinosaurSitesAuData:
              globalScope.ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
          };
    const blockers = [
      "broad-extraction-remains-blocked",
      "runtime-startup-map-gameplay-shared-state-dom-drawing-extraction-remains-blocked",
      "readiness-only-supports-preparing-a-tiny-extraction-prompt-next"
    ];
    const concerns = [];
    if (
      typeof globalScope.getCustom25DVisualFirstPassiveExtractionCandidatePlanReport !==
      "function"
    ) {
      concerns.push("first-passive-extraction-candidate-plan-report-unavailable");
    }
    const readyToPrepareTinyExtractionPrompt = !!(
      candidatePlan &&
      candidatePlan.candidateOnly === true &&
      candidatePlan.immediateExtractionBlocked === true
    );

    if (missingKey) {
      return {
        ok: true,
        phase: 356,
        helperName:
          "getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport",
        allowed: false,
        blocked: true,
        passive: true,
        reportOnly: true,
        readinessOnly: true,
        reason: reasonByKey[missingKey] || "required-option-missing",
        failedRequirement: missingKey,
        requiredOptionKeys,
        readyToPrepareTinyExtractionPrompt,
        readyForBroadExtraction: false,
        broadExtractionBlocked: true,
        runtimeExtractionBlocked: true,
        startupExtractionBlocked: true,
        mapExtractionBlocked: true,
        gameplayExtractionBlocked: true,
        sharedStateExtractionBlocked: true,
        drawingExtractionBlocked: true,
        domExtractionBlocked: true,
        backendStorageNetworkExtractionBlocked: true,
        blockers,
        concerns,
        blockedBehavior,
        preservedSystems,
        safetyFlags
      };
    }

    return {
      ok: true,
      phase: 356,
      helperName:
        "getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport",
      allowed: true,
      blocked: false,
      passive: true,
      reportOnly: true,
      readinessOnly: true,
      reason: null,
      failedRequirement: null,
      requiredOptionKeys,
      readyToPrepareTinyExtractionPrompt,
      readyForBroadExtraction: false,
      broadExtractionBlocked: true,
      runtimeExtractionBlocked: true,
      startupExtractionBlocked: true,
      mapExtractionBlocked: true,
      gameplayExtractionBlocked: true,
      sharedStateExtractionBlocked: true,
      drawingExtractionBlocked: true,
      domExtractionBlocked: true,
      backendStorageNetworkExtractionBlocked: true,
      blockers,
      concerns,
      blockedBehavior,
      preservedSystems,
      safetyFlags
    };
  }

  passiveReportsNamespace.helpersMoved = 2;
  passiveReportsNamespace.movedHelperNames = [
    "getCustom25DVisualFirstPassiveExtractionCandidatePlanReport",
    "getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport"
  ];
  passiveReportsNamespace.getCustom25DVisualFirstPassiveExtractionCandidatePlanReport =
    getCustom25DVisualFirstPassiveExtractionCandidatePlanReport;
  passiveReportsNamespace.getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport =
    getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport;

  globalScope.getCustom25DVisualFirstPassiveExtractionCandidatePlanReport =
    getCustom25DVisualFirstPassiveExtractionCandidatePlanReport;
  globalScope.getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport =
    getCustom25DVisualFirstPassiveExtractionCandidateReadinessReport;

  globalScope.GrowGoCustom25DVisualPassiveReports = passiveReportsNamespace;
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null
);
