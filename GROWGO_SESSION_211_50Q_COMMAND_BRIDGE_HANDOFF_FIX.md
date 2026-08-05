GROWGO SESSION 211.50q — Diagnose Missing Bridge During Command Execution

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Find why the global developer bridge existed in Safari, but the manual one-frame command path still reached the adapter with no usable bridge or raw map reference.

Incoming Safari evidence

- `reasonCode = MAP_UNAVAILABLE`
- `adapterInvoked = true`
- `adapterReady = true`
- `hasBridge = false`
- `hasRawLeafletMapReference = false`
- `mapObjectType = "unresolved"`
- `mapValidationResult = "unresolved"`
- `surfacePreparationInputReady = false`
- `surfacePrepared = false`

At the same time, bridge debug had already shown:

- `hasRawLeafletMapReference = true`
- `usesRawLeafletMapReference = true`

Diagnosis

The live global bridge existed, but the command path could still lose it through early-captured adapter inputs.

Two stale handoff points were possible:

1. the adapter could be created before the live bridge was fully usable
2. the adapter could receive provider functions that were themselves bound to stale `null` bridge methods

That meant:

- the command could still validate and invoke the adapter
- the bridge could still exist globally
- but the adapter execution lane could enter with no usable bridge/map handoff

Fix applied

The runtime handoff is now restored at execution time:

- the command records whether the global bridge is available before adapter execution
- the adapter resolves the live developer bridge at execution time
- if startup-captured snapshot/draw bridge providers are stale or non-functional, the adapter falls back to the live runtime bridge methods
- raw Leaflet map resolution can now use:
  - explicit `rawLeafletMapReference`
  - runtime bridge `rawLeafletMapReference`
  - runtime raw map provider

New diagnostics now exposed in command results

- `commandBridgeAvailable`
- `adapterBridgeAvailable`
- `bridgeSource`
- `adapterReceivedBridge`
- `adapterBridgeResolutionFunction`
- `hasRawLeafletMapReference`
- `mapObjectType`
- `mapValidationResult`
- `mapValidationFailureReason`
- `mapAvailabilityFailureFunction`
- `surfacePreparationInputReady`

What this phase proves

Before:

- command path could lose the bridge handoff
- adapter could still report `MAP_UNAVAILABLE`

After:

- command sees the global bridge
- adapter receives the live bridge at execution time
- snapshot/draw can recover from stale startup capture

Focused verification target

The updated regression now proves:

- lost startup bridge handoff can be recovered from the runtime global bridge
- one snapshot occurs
- one draw occurs
- one cleanup occurs
- canonical safety flags remain false

Next Safari evidence to capture

Run the real one-frame command again and preserve:

- `reasonCode`
- `commandBridgeAvailable`
- `adapterBridgeAvailable`
- `bridgeSource`
- `adapterReceivedBridge`
- `adapterBridgeResolutionFunction`
- `hasRawLeafletMapReference`
- `mapObjectType`
- `mapValidationResult`
- `mapValidationFailureReason`
- `mapAvailabilityFailureFunction`
- `surfacePreparationInputReady`
- `surfacePrepared`
- `frameSnapshotCreated`
- `drawAttemptCount`
- `completedFrameCount`

Classification

- `COMMAND_BRIDGE_HANDOFF_FIXED` if Safari now reaches snapshot/draw
- `BLOCKED_BY_POST_HANDOFF_RUNTIME_FAILURE` if the bridge is present but failure moves later
