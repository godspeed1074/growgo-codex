GROWGO SESSION 211.50r — Fix Command to Adapter Runtime Bridge Injection

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Ensure the exact live one-frame bridge object seen by the command is injected into the adapter at execution time.

Incoming Safari evidence

- `commandBridgeAvailable = true`
- `bridgeSource = phase-211.50m-freeze-raw-leaflet-map-object`
- `adapterBridgeAvailable = false`
- `adapterReceivedBridge = false`
- `adapterBridgeResolutionFunction = null`
- `hasBridge = false`
- `hasRawLeafletMapReference = false`
- `mapObjectType = unresolved`
- `reasonCode = MAP_UNAVAILABLE`

Conclusion from that evidence

The command could see the live bridge, but the adapter invocation was not receiving that same bridge object.

Diagnosis

Before this phase, the command only used the bridge for diagnostics. The adapter then attempted its own later bridge lookup or relied on stale startup capture.

That meant:

- command bridge visibility could be `true`
- adapter bridge visibility could still be `false`

Fix applied

The runtime path is now explicit:

command
→ live bridge object
→ adapter execution options
→ injected bridge
→ `bridge.rawLeafletMapReference`
→ snapshot/draw handoff

Implementation details

- command now passes:
  - `bridge`
  - `bridgeSource`
  - `hasRawLeafletMapReference`
- adapter now resolves:
  - injected bridge first
  - global runtime bridge only as fallback

New expected diagnostics after fix

- `commandBridgeAvailable = true`
- `adapterBridgeAvailable = true`
- `adapterReceivedBridge = true`
- `adapterBridgeResolutionFunction = adapter.resolveInjectedRuntimeOneFrameBridge`

Focused regression coverage

This phase adds proof that:

- command sees the bridge
- adapter receives the same bridge
- raw map is available from the injected bridge
- snapshot and draw can complete from the injected handoff path
- safety flags remain false

Next Safari evidence to capture

- `commandBridgeAvailable`
- `adapterBridgeAvailable`
- `bridgeSource`
- `adapterReceivedBridge`
- `adapterBridgeResolutionFunction`
- `hasRawLeafletMapReference`
- `mapObjectType`
- `mapValidationResult`
- `surfacePreparationInputReady`
- `surfacePrepared`
- `frameSnapshotCreated`
- `drawAttemptCount`
- `completedFrameCount`

Classification

- `COMMAND_TO_ADAPTER_BRIDGE_INJECTION_FIXED` if Safari now reaches snapshot or later
- `BLOCKED_BY_POST_INJECTION_RUNTIME_FAILURE` if the injected bridge is present but failure moves downstream
