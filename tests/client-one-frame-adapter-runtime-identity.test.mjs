import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const adapterModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"
  )
);

test("phase 211.50am keeps the page and module graph pointed at atlas21150am and atlas21150al", () => {
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs\?v=atlas21150am"><\/script>/
  );
  assert.match(
    developmentAlphaAppSource,
    /from "\.\/developer-only-growgo-custom25d-live-one-frame-adapter\.mjs\?v=atlas21150am"/
  );
});

test("phase 211.50am adapter runtime identity reports atlas21150am and installed post-callback trace fields", () => {
  const adapter = adapterModule.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    rawLeafletMapReference: { id: "identity-map" },
    leafletProvider: () => ({
      DomUtil: {
        create() {},
        setPosition() {}
      }
    }),
    surfaceOperationsFactory: () => ({
      prepareOneFrameSurface() {
        return {
          outcome: "prepared",
          reasonCode: "LIVE_SURFACE_PREPARED",
          surface: {
            map: { id: "identity-map" },
            pane: { dataset: { owner: "custom25DMapPane" } },
            canvas: { className: "custom-25d-map-canvas" }
          }
        };
      },
      rollbackPreparedSurface() {
        return {
          outcome: "rolled_back",
          reasonCode: "ROLLBACK_COMPLETED",
          rollbackCompleted: true,
          rollbackFailureReason: null
        };
      }
    }),
    lifecycleTranslationFactory: () => ({
      translatePreparedSurfaceToLifecycleBundle({ preparedSurface }) {
        return {
          outcome: "translated",
          reasonCode: "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED",
          lifecycleRegistrationAttempted: true,
          lifecycleRegistrationSucceeded: true,
          lifecycleBundle: {
            ownershipMode: "ONE_FRAME_SURFACE_ONLY",
            map: preparedSurface.map,
            pane: preparedSurface.pane,
            canvas: preparedSurface.canvas
          }
        };
      }
    }),
    lifecycleOwnerFactory: () => ({
      registerOwnedResources() {
        return {
          outcome: "registered",
          reasonCode: "OWNERSHIP_REGISTERED",
          status: { ownershipRegistered: true }
        };
      },
      disposeOwnedResources() {
        return {
          outcome: "disposed",
          reasonCode: "CLEANUP_COMPLETED",
          status: {
            cleanupCompleted: true,
            cleanupFailed: false,
            cleanupFailureReasons: []
          }
        };
      }
    }),
    frameSnapshotProvider: () => () => ({
      outcome: "snapshot_created",
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
      frameViewportSnapshot: {
        logicalWidth: 1,
        logicalHeight: 1,
        backingWidth: 1,
        backingHeight: 1,
        devicePixelRatio: 1,
        zoom: 1
      }
    }),
    drawFunctionProvider: () => () => ({
      outcome: "drawn",
      reasonCode: "FRAME_DRAW_COMPLETED"
    }),
    drawOperationFactory: ({ drawFunctionProvider }) => ({
      drawPreparedSurfaceExactlyOnce(input) {
        const draw = drawFunctionProvider();
        const bridgeResult = draw(input);
        return {
          outcome: bridgeResult?.outcome === "drawn" ? "completed" : "failed_closed",
          reasonCode:
            bridgeResult?.outcome === "drawn"
              ? "LIVE_ONE_FRAME_DRAW_COMPLETED"
              : bridgeResult?.reasonCode ?? "DRAW_BRIDGE_FAILED",
          drawAttemptCount: 1,
          completedFrameCount: bridgeResult?.outcome === "drawn" ? 1 : 0
        };
      }
    })
  });

  const identity = adapter.getCustom25DOneFrameAdapterRuntimeIdentity();

  assert.equal(identity.adapterVersionTag, "atlas21150am");
  assert.equal(
    identity.adapterSourceTag,
    "client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150am"
  );
  assert.equal(identity.postCallbackTraceFieldsInstalled, true);
  assert.equal(typeof identity.moduleLoadTimestamp, "string");
  assert.ok(identity.moduleLoadTimestamp.length > 0);
});

test("phase 211.50am lifecycle translation runtime identity reports the cycle-safe atlas21150al module", () => {
  const adapter = adapterModule.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    lifecycleTranslationFactory: undefined
  });

  const identity =
    adapter.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity();

  assert.deepEqual(identity, {
    translationVersionTag: "atlas21150al",
    translationSourceTag:
      "client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs?v=atlas21150al",
    moduleLoadTimestamp: identity.moduleLoadTimestamp,
    cycleSafeDeepFreezeInstalled: true,
    weakSetCycleProtectionInstalled: true,
    translationTraceInstalled: true
  });
  assert.equal(typeof identity.moduleLoadTimestamp, "string");
  assert.ok(identity.moduleLoadTimestamp.length > 0);
});

test("phase 211.50z adapter execution identity reports the live instrumented execute function and entry flags", () => {
  const adapter = adapterModule.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    rawLeafletMapReference: { id: "identity-map" },
    leafletProvider: () => ({
      DomUtil: {
        create() {},
        setPosition() {}
      }
    }),
    surfaceOperationsFactory: () => ({
      prepareOneFrameSurface() {
        return {
          outcome: "prepared",
          reasonCode: "LIVE_SURFACE_PREPARED",
          surface: {
            map: { id: "identity-map" },
            pane: { dataset: { owner: "custom25DMapPane" } },
            canvas: { className: "custom-25d-map-canvas" }
          }
        };
      },
      rollbackPreparedSurface() {
        return {
          outcome: "rolled_back",
          reasonCode: "ROLLBACK_COMPLETED",
          rollbackCompleted: true,
          rollbackFailureReason: null
        };
      }
    }),
    lifecycleTranslationFactory: () => ({
      translatePreparedSurfaceToLifecycleBundle({ preparedSurface }) {
        return {
          outcome: "translated",
          reasonCode: "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED",
          lifecycleRegistrationAttempted: true,
          lifecycleRegistrationSucceeded: true,
          lifecycleBundle: {
            ownershipMode: "ONE_FRAME_SURFACE_ONLY",
            map: preparedSurface.map,
            pane: preparedSurface.pane,
            canvas: preparedSurface.canvas
          }
        };
      }
    }),
    lifecycleOwnerFactory: () => ({
      registerOwnedResources() {
        return {
          outcome: "registered",
          reasonCode: "OWNERSHIP_REGISTERED",
          status: { ownershipRegistered: true }
        };
      },
      disposeOwnedResources() {
        return {
          outcome: "disposed",
          reasonCode: "CLEANUP_COMPLETED",
          status: {
            cleanupCompleted: true,
            cleanupFailed: false,
            cleanupFailureReasons: []
          }
        };
      }
    }),
    frameSnapshotProvider: () => () => ({
      outcome: "snapshot_created",
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
      frameViewportSnapshot: {
        logicalWidth: 1,
        logicalHeight: 1,
        backingWidth: 1,
        backingHeight: 1,
        devicePixelRatio: 1,
        zoom: 1
      }
    }),
    drawFunctionProvider: () => () => ({
      outcome: "drawn",
      reasonCode: "FRAME_DRAW_COMPLETED"
    }),
    drawOperationFactory: ({ drawFunctionProvider }) => ({
      drawPreparedSurfaceExactlyOnce(input) {
        const draw = drawFunctionProvider();
        const bridgeResult = draw(input);
        return {
          outcome: bridgeResult?.outcome === "drawn" ? "completed" : "failed_closed",
          reasonCode:
            bridgeResult?.outcome === "drawn"
              ? "LIVE_ONE_FRAME_DRAW_COMPLETED"
              : bridgeResult?.reasonCode ?? "DRAW_BRIDGE_FAILED",
          drawAttemptCount: 1,
          completedFrameCount: bridgeResult?.outcome === "drawn" ? 1 : 0
        };
      }
    })
  });

  const before = adapter.getCustom25DOneFrameAdapterExecutionIdentity();
  assert.equal(
    before.adapterExecuteFunctionName,
    "executeDeveloperOnlyLiveOneFrameAdapter"
  );
  assert.equal(
    before.adapterExecuteFunctionSourceTag,
    "client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150am"
  );
  assert.equal(before.adapterEntryReached, false);
  assert.equal(before.adapterEntryFunctionName, "executeDeveloperOnlyLiveOneFrameAdapter");
  assert.equal(before.adapterEntryReturnPath, null);
  assert.equal(before.adapterEarlyReturnReason, null);
  assert.equal(before.nextFunctionAfterAdapterEntry, null);
  assert.equal(before.bridgeResolutionStarted, false);
  assert.equal(before.snapshotBridgeResolutionStarted, false);
  assert.equal(before.drawBridgeResolutionStarted, false);
  assert.equal(before.postCallbackInstrumentationWrapperEntered, false);
  assert.equal(before.payloadAssemblyInstrumentationEntered, false);
  assert.equal(before.activeAdapterFunctionReferenceMatchesInstrumentedModuleExport, true);

  const result = adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const after = adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "completed");
  assert.equal(after.adapterEntryReached, true);
  assert.equal(after.adapterEntryFunctionName, "executeDeveloperOnlyLiveOneFrameAdapter");
  assert.equal(after.adapterEntryReturnPath, null);
  assert.equal(after.adapterEarlyReturnReason, null);
  assert.equal(after.nextFunctionAfterAdapterEntry, "adapter.invokeSnapshotCallback");
  assert.equal(after.bridgeResolutionStarted, true);
  assert.equal(after.snapshotBridgeResolutionStarted, true);
  assert.equal(after.drawBridgeResolutionStarted, true);
  assert.equal(after.postCallbackInstrumentationWrapperEntered, true);
  assert.equal(after.postCallbackWrapperNextFunction, "adapter.assembleSnapshotHandoffPayload");
  assert.equal(after.postCallbackWrapperExitReason, null);
  assert.equal(after.createDrawOperationEntered, true);
  assert.equal(after.createDrawOperationFunctionName, "adapter.createDrawOperation");
  assert.equal(after.createDrawOperationFactoryAvailable, true);
  assert.equal(after.createDrawOperationFactoryCallable, true);
  assert.equal(after.createDrawOperationInputCanvasPresent, false);
  assert.equal(after.createDrawOperationInputMapPresent, true);
  assert.equal(after.createDrawOperationInputDrawCallbackPresent, true);
  assert.equal(after.createDrawOperationReturned, true);
  assert.equal(after.createDrawOperationResultType, "object:Object");
  assert.equal(after.createDrawOperationFailureReason, null);
  assert.equal(after.createDrawOperationLastFunction, "adapter.createDrawOperation");
  assert.equal(after.createDrawOperationPreviousFunction, null);
  assert.equal(after.createDrawOperationExceptionName, null);
  assert.equal(after.createDrawOperationExceptionMessage, null);
  assert.equal(after.createDrawOperationExceptionReasonCode, null);
  assert.equal(after.postDrawOperationContinuationEntered, true);
  assert.equal(after.drawOperationLocalAssignmentAttempted, true);
  assert.equal(after.drawOperationLocalAssignmentCompleted, true);
  assert.equal(after.currentRefsMapAssignmentAttempted, true);
  assert.equal(after.currentRefsMapAssignmentCompleted, true);
  assert.equal(after.currentRefsLifecycleOwnerAssignmentAttempted, true);
  assert.equal(after.currentRefsLifecycleOwnerAssignmentCompleted, true);
  assert.equal(after.currentRefsDrawOperationAssignmentAttempted, true);
  assert.equal(after.currentRefsDrawOperationAssignmentCompleted, true);
  assert.equal(after.prepareOneFrameSurfaceSelected, true);
  assert.equal(after.prepareOneFrameSurfaceCallAttempted, true);
  assert.equal(after.prepareOneFrameSurfaceCallEntered, true);
  assert.equal(after.prepareOneFrameSurfaceCallReturned, true);
  assert.equal(after.prepareOneFrameSurfaceResultType, "object:Object");
  assert.equal(after.surfacePreparationInputReadyStatusWriteAttempted, true);
  assert.equal(after.surfacePreparationInputReadyStatusWriteCompleted, true);
  assert.equal(
    after.postDrawOperationLastCompletedStep,
    "surfaceOperations.prepareOneFrameSurface returned"
  );
  assert.equal(after.postDrawOperationNextExpectedStep, "payload assembly entry");
  assert.equal(after.postDrawOperationFailureFunction, null);
  assert.equal(after.postDrawOperationExceptionName, null);
  assert.equal(after.postDrawOperationExceptionMessage, null);
  assert.equal(after.postDrawOperationExceptionReasonCode, null);
  assert.equal(after.preparedSurfaceLocalAssignmentAttempted, true);
  assert.equal(after.preparedSurfaceLocalAssignmentCompleted, true);
  assert.equal(after.preparedSurfacePresent, true);
  assert.equal(after.preparedSurfaceType, "object:Object");
  assert.deepEqual(after.preparedSurfaceKeys, ["outcome", "reasonCode", "surface"]);
  assert.equal(after.preparedSurfaceStatusReadAttempted, true);
  assert.equal(after.preparedSurfaceStatusReadCompleted, true);
  assert.equal(after.preparedSurfaceStatusValue, "prepared");
  assert.equal(after.preparedSurfaceReasonReadAttempted, true);
  assert.equal(after.preparedSurfaceReasonReadCompleted, true);
  assert.equal(after.preparedSurfaceReasonValue, "LIVE_SURFACE_PREPARED");
  assert.equal(after.preparedSurfaceCanvasReadAttempted, true);
  assert.equal(after.preparedSurfaceCanvasReadCompleted, true);
  assert.equal(after.preparedSurfaceCanvasPresent, true);
  assert.equal(after.preparedSurfaceMapReadAttempted, true);
  assert.equal(after.preparedSurfaceMapReadCompleted, true);
  assert.equal(after.preparedSurfaceMapPresent, true);
  assert.equal(after.postPreparedSurfaceMapReadContinuationEntered, true);
  assert.equal(
    after.postPreparedSurfaceMapReadNextFunction,
    "payload entry marker write"
  );
  assert.equal(after.preparedSurfacePayloadLocalCreationAttempted, true);
  assert.equal(after.preparedSurfacePayloadLocalCreationCompleted, true);
  assert.equal(after.preparedSurfacePayloadLocalType, "object:Object");
  assert.equal(after.preparedSurfaceMapLocalAssignmentAttempted, true);
  assert.equal(after.preparedSurfaceMapLocalAssignmentCompleted, true);
  assert.equal(after.preparedSurfaceCanvasLocalAssignmentAttempted, true);
  assert.equal(after.preparedSurfaceCanvasLocalAssignmentCompleted, true);
  assert.equal(after.preparedSurfaceOwnerLocalAssignmentAttempted, true);
  assert.equal(after.preparedSurfaceOwnerLocalAssignmentCompleted, true);
  assert.equal(after.payloadEntryTraceMutationAttempted, true);
  assert.equal(after.payloadEntryTraceMutationCompleted, true);
  assert.equal(
    after.postMapReadLastCompletedStatement,
    "payload entry trace mutation"
  );
  assert.equal(
    after.postMapReadNextExpectedStatement,
    "payload entry marker write"
  );
  assert.equal(after.postMapReadFailureFunction, null);
  assert.equal(after.postMapReadExceptionName, null);
  assert.equal(after.postMapReadExceptionMessage, null);
  assert.equal(after.postMapReadExceptionReasonCode, null);
  assert.equal(after.postMapReadObjectSpreadInvoked, true);
  assert.equal(after.postMapReadStructuredCloneInvoked, false);
  assert.equal(after.postMapReadObjectFreezeInvoked, false);
  assert.equal(after.postMapReadJsonSerializationInvoked, false);
  assert.equal(after.postMapReadPropertyEnumerationInvoked, false);
  assert.equal(after.postMapReadGetterInvoked, false);
  assert.equal(after.postMapReadSetterInvoked, false);
  assert.equal(after.postMapReadProxyTrapInvoked, false);
  assert.equal(after.postMapReadRecursiveCallbackInvoked, false);
  assert.equal(after.postMapReadDiagnosticsLookupInvoked, false);
  assert.equal(after.lifecycleRegistrationStateAssignmentAttempted, true);
  assert.equal(after.lifecycleRegistrationStateAssignmentCompleted, true);
  assert.equal(after.lifecycleRegistrationStateValue, true);
  assert.equal(after.lifecycleTranslationGateEntered, true);
  assert.equal(after.lifecycleTranslationGateOperandOneEvaluated, true);
  assert.equal(after.lifecycleTranslationGateOperandOneValue, false);
  assert.equal(after.lifecycleTranslationGateOperandTwoEvaluated, true);
  assert.equal(after.lifecycleTranslationGateOperandTwoValue, false);
  assert.equal(after.lifecycleTranslationObjectSpreadAttempted, true);
  assert.equal(after.lifecycleTranslationObjectSpreadCompleted, true);
  assert.equal(after.lifecycleTranslationFunctionSelected, true);
  assert.equal(after.lifecycleTranslationFunctionEntered, true);
  assert.equal(after.lifecycleTranslationFunctionReturned, true);
  assert.equal(after.lifecycleTranslationResultType, "object:Object");
  assert.equal(after.lifecycleTranslationResultStatus, "translated");
  assert.equal(after.lifecycleTranslationTraceEntered, false);
  assert.equal(after.lifecycleTranslationTraceExited, false);
  assert.equal(after.lifecycleTranslationTraceCurrentDepth, 0);
  assert.equal(after.lifecycleTranslationTraceMaxDepth, 0);
  assert.equal(after.lifecycleTranslationTraceLast100Calls, null);
  assert.equal(after.lifecycleTranslationRepeatedCallChain, null);
  assert.equal(after.lifecycleTranslationRecursionDetected, false);
  assert.equal(after.lifecycleTranslationOverflowPrevented, false);
  assert.equal(after.lifecycleTranslationLastFunction, null);
  assert.equal(after.lifecycleTranslationPreviousFunction, null);
  assert.equal(after.lifecycleRegisteredStatusWriteAttempted, true);
  assert.equal(after.lifecycleRegisteredStatusWriteCompleted, true);
  assert.equal(
    after.lifecycleGateLastCompletedStep,
    "lifecycleRegistered status write"
  );
  assert.equal(
    after.lifecycleGateNextExpectedStep,
    "payload-entry trace mutation"
  );
  assert.equal(after.lifecycleGateFailureFunction, null);
  assert.equal(after.lifecycleGateExceptionName, null);
  assert.equal(after.lifecycleGateExceptionMessage, null);
  assert.equal(after.lifecycleGateExceptionReasonCode, null);
  assert.equal(after.lifecycleGateObjectSpreadInvoked, true);
  assert.equal(after.lifecycleGateGetterInvoked, false);
  assert.equal(after.lifecycleGateSetterInvoked, false);
  assert.equal(after.lifecycleGateProxyTrapInvoked, false);
  assert.equal(after.lifecycleGateRecursiveCallbackInvoked, false);
  assert.equal(after.lifecycleGateDiagnosticsLookupInvoked, false);
  assert.equal(after.lifecycleGateJsonSerializationInvoked, false);
  assert.equal(after.lifecycleGateObjectFreezeInvoked, false);
  assert.equal(after.lifecycleGateStructuredCloneInvoked, false);
  assert.equal(after.preparedSurfaceLifecycleOwnerReadAttempted, true);
  assert.equal(after.preparedSurfaceLifecycleOwnerReadCompleted, true);
  assert.equal(after.preparedSurfaceLifecycleOwnerPresent, false);
  assert.equal(after.preparedSurfaceLifecycleOwnerSource, null);
  assert.equal(after.preparedSurfaceLifecycleOwnerPropertyName, null);
  assert.equal(after.preparedSurfaceNestedLifecycleOwnerPresent, false);
  assert.equal(after.currentRefsLifecycleOwnerPresentAfterSurfacePreparation, true);
  assert.equal(after.payloadLifecycleOwnerResolved, true);
  assert.equal(
    after.payloadLifecycleOwnerResolutionSource,
    "currentRefs.lifecycleOwner"
  );
  assert.equal(after.payloadLifecycleOwnerResolutionFailureReason, null);
  assert.equal(after.resolvedLifecycleOwnerLocalAssignmentAttempted, true);
  assert.equal(after.resolvedLifecycleOwnerLocalAssignmentCompleted, true);
  assert.equal(after.resolvedLifecycleOwnerMatchesCurrentRefs, true);
  assert.equal(after.resolvedLifecycleOwnerIdentityType, "object:Object");
  assert.equal(after.postLifecycleOwnerContinuationEntered, true);
  assert.equal(after.payloadEntryMarkerWriteAttempted, true);
  assert.equal(after.payloadEntryMarkerWriteCompleted, true);
  assert.equal(after.payloadContextConstructorSelected, true);
  assert.equal(after.payloadContextConstructorEntered, true);
  assert.equal(after.payloadContextConstructorReturned, true);
  assert.equal(after.payloadContextConstructorResultType, "object:Object");
  assert.equal(
    after.postLifecycleOwnerLastCompletedStep,
    "payload guard evaluation entered"
  );
  assert.equal(
    after.postLifecycleOwnerNextExpectedStep,
    "payload guard evaluation completed"
  );
  assert.equal(after.postLifecycleOwnerFailureFunction, null);
  assert.equal(after.postLifecycleOwnerExceptionName, null);
  assert.equal(after.postLifecycleOwnerExceptionMessage, null);
  assert.equal(after.postLifecycleOwnerExceptionReasonCode, null);
  assert.equal(after.postLifecycleOwnerGetterInvoked, false);
  assert.equal(after.postLifecycleOwnerSetterInvoked, false);
  assert.equal(after.postLifecycleOwnerProxyTrapInvoked, false);
  assert.equal(after.postLifecycleOwnerRecursiveCallbackInvoked, false);
  assert.equal(after.postLifecycleOwnerDiagnosticsLookupInvoked, false);
  assert.equal(after.payloadAssemblyEntryAttempted, true);
  assert.equal(after.payloadAssemblyEntryCompleted, true);
  assert.equal(
    after.preparedSurfaceContinuationLastCompletedStep,
    "payload assembly entry"
  );
  assert.equal(
    after.preparedSurfaceContinuationNextExpectedStep,
    "payload assembly guard evaluation"
  );
  assert.equal(after.preparedSurfaceContinuationFailureFunction, null);
  assert.equal(after.preparedSurfaceContinuationExceptionName, null);
  assert.equal(after.preparedSurfaceContinuationExceptionMessage, null);
  assert.equal(after.preparedSurfaceContinuationExceptionReasonCode, null);
  assert.equal(after.preparedSurfaceGetterInvoked, false);
  assert.equal(after.preparedSurfaceProxyTrapInvoked, false);
  assert.equal(after.preparedSurfaceRecursiveCallbackInvoked, false);
  assert.equal(after.preparedSurfaceDiagnosticsLookupInvoked, false);
  assert.equal(
    after.payloadAssemblyEntryFunction,
    "adapter.assembleSnapshotHandoffPayload"
  );
  assert.equal(after.payloadAssemblyContextCreationAttempted, true);
  assert.equal(after.payloadAssemblyContextCreationCompleted, true);
  assert.equal(after.payloadGuardEvaluationAttempted, true);
  assert.equal(after.payloadGuardEvaluationCompleted, true);
  assert.equal(after.payloadGuardResult, true);
  assert.equal(after.payloadGuardFailureReason, null);
  assert.equal(after.payloadContextHasMap, true);
  assert.equal(after.payloadContextHasCanvas, true);
  assert.equal(after.payloadContextHasViewport, true);
  assert.equal(after.payloadContextHasDrawOperation, true);
  assert.equal(after.payloadContextHasCallbacks, true);
  assert.equal(after.handoffCreationAfterGuardAttempted, true);
  assert.equal(after.handoffCreationAfterGuardCompleted, true);
  assert.equal(after.payloadAssemblyNextFunction, "snapshot callback invocation");
  assert.equal(after.payloadAssemblyLastCompletedStep, "handoff object creation");
  assert.equal(after.payloadAssemblyFailureFunction, null);
  assert.equal(after.payloadAssemblyExceptionName, null);
  assert.equal(after.payloadAssemblyExceptionMessage, null);
  assert.equal(after.payloadAssemblyExceptionReasonCode, null);
  assert.equal(after.payloadAssemblyGetterInvoked, false);
  assert.equal(after.payloadAssemblyProxyTrapInvoked, false);
  assert.equal(after.payloadAssemblyRecursiveCallbackInvoked, false);
  assert.equal(after.payloadAssemblyDiagnosticsLookupInvoked, false);
  assert.equal(after.payloadAssemblyGuardEvaluated, true);
  assert.equal(after.payloadAssemblyGuardResult, true);
  assert.equal(after.payloadAssemblySkippedReason, null);
  assert.equal(after.payloadAssemblyInstrumentationEntered, true);
  assert.equal(after.activeAdapterFunctionReferenceMatchesInstrumentedModuleExport, true);
});
