# GROWGO SESSION 212.8 — CONTROLLED AUTOMATIC VIEWPORT REPOPULATION DESIGN

## Goal

Define the exact developer-only contract for automatically rebuilding the current viewport population after safe completed map events while:

- reusing the proven Phase 212.6 manual preview path
- preventing redraw loops
- preventing duplicate asset accumulation
- rejecting stale viewport work
- preserving the retained Atlas Canvas model
- keeping all canonical safety flags false

This phase is design-only.

No automatic population is implemented here.
No new live listeners are registered here.
No current listener behavior is changed here.
No startup population is enabled here.

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- latest committed population checkpoint reviewed:
  - `d84f797 feat(atlas): add controlled live viewport population`
- prerequisite Phase 212.7 Safari verification:
  - assumed by requested phase brief
- local design-phase caveat:
  - this phase documents the automatic design contract without claiming new Safari evidence
- canonical safety flags:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

## Design Classification

Classification:

- `CONTROLLED_AUTOMATIC_VIEWPORT_REPOPULATION_DESIGN_READY`

Meaning:

- the automatic path remains disabled
- the future runtime is explicitly constrained to approved events only
- one generation model, one replacement policy, and one cleanup policy are defined
- no second planner or second draw path is introduced

## Proven Manual Path To Reuse

The automatic system must reuse this already-proven path exactly:

manual viewport change
→ `previewAtlasCurrentViewportPopulation(...)`
→ read current viewport features
→ normalize and classify through the Phase 212.6 live feature adapter
→ build deterministic Phase 212.2 population plan
→ submit through Phase 212.3 population draw integration
→ draw on the existing retained Atlas Canvas
→ clear or replace safely

Explicit prohibition:

- do not create a second planner
- do not create a second draw path
- do not create a second retained Canvas path
- do not query public OSM/Overpass directly

## One Automatic Owner

The automatic system introduces exactly one logical owner:

- `automaticViewportPopulationOwnerId`

It owns only:

- queued population refresh generation
- current population-plan reference
- current batch reference
- one follow-up refresh marker

It must not own:

- Canvas
- pane
- lifecycle owner
- map
- listeners
- renderer

Those remain owned by the existing persistent Atlas lifecycle.

## Approved Event Policy

Automatic repopulation support is designed only for completed safe events:

- `moveend`
- `zoomend`
- `resize`

Explicitly forbidden:

- `move`
- `drag`
- `mousemove`
- `touchmove`
- `wheel`
- continuous zoom
- timers
- polling
- startup population
- arbitrary `MutationObserver` triggers

Policy:

- automatic refresh may only begin after a completed approved event
- no work may begin during active dragging or continuous map movement
- `moveend`, `zoomend`, and `resize` are treated as refresh requests, not direct draw commands

## Minimum Automatic State Machine

The exact minimum state set for v1:

- `disabled`
- `attached_idle`
- `viewport_change_detected`
- `population_queued`
- `reading_features`
- `planning`
- `submitting`
- `drawing`
- `replacing_population`
- `cleanup_pending`
- `invalidated`
- `failed_closed`

### State meanings

- `disabled`
  - automatic repopulation is not armed
  - manual preview remains available
  - no automatic refresh may queue

- `attached_idle`
  - persistent Atlas is attached and healthy
  - a current population batch may or may not exist
  - no automatic refresh is queued or active

- `viewport_change_detected`
  - an approved completed map event was observed
  - the next viewport generation is being derived
  - no planning or submission has started yet

- `population_queued`
  - exactly one automatic refresh is pending
  - no second queue entry may be created

- `reading_features`
  - the current viewport identity is frozen
  - the Phase 212.6 feature adapter is reading and filtering source features for that generation

- `planning`
  - deterministic planner input is frozen
  - the Phase 212.2 planner is building one generation-bound population plan

- `submitting`
  - the new plan is being validated for draw integration
  - stale work must still be discardable here

- `drawing`
  - the retained Atlas Canvas is drawing one generation-bound replacement batch
  - no parallel automatic draw may begin

- `replacing_population`
  - the new batch is accepted as authoritative for the current generation
  - old batch references are released only after successful replacement

- `cleanup_pending`
  - automatic owner references are being cleared
  - this is automatic-owner cleanup only, not full persistent detach

- `invalidated`
  - readiness, identity, authorization, or lifecycle drift invalidated the automatic path
  - the existing persistent invalidation cleanup path owns teardown

- `failed_closed`
  - automatic repopulation hit a non-recoverable failure for the active generation
  - no automatic retry occurs
  - the next refresh requires a new legitimate approved event or explicit developer action

### Allowed transitions

- `disabled`
  - may transition to `attached_idle`

- `attached_idle`
  - may transition to `viewport_change_detected`
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `viewport_change_detected`
  - may transition to `population_queued`
  - may transition to `attached_idle` when the viewport identity is unchanged and refresh may be skipped
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `population_queued`
  - may transition to `reading_features`
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `reading_features`
  - may transition to `planning`
  - may transition to `attached_idle` when no supported features or no commands are produced and the documented no-op policy applies
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `planning`
  - may transition to `submitting`
  - may transition to `attached_idle` when no valid command batch exists and the no-op policy applies
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `submitting`
  - may transition to `drawing`
  - may transition to `attached_idle` if a stale generation is discarded before draw
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `drawing`
  - may transition to `replacing_population`
  - may transition to `population_queued` if one newer follow-up generation is pending
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `replacing_population`
  - may transition to `attached_idle`
  - may transition to `population_queued` if one newer generation is already pending
  - may transition to `cleanup_pending`
  - may transition to `invalidated`
  - may transition to `failed_closed`

- `cleanup_pending`
  - may transition to `disabled`
  - may transition to `attached_idle` only if cleanup was limited to automatic-owner references while persistent Atlas remains attached and healthy
  - may transition to `failed_closed`

- `invalidated`
  - may transition only through the existing persistent invalidation cleanup path

- `failed_closed`
  - no automatic retry
  - may return to `attached_idle` only after an explicit fresh approved event or explicit manual recovery path in a later phase

## Viewport Generation Contract

Every completed approved viewport change must derive one deterministic generation-bound snapshot containing:

- `viewportGenerationId`
- `viewportIdentity`
- `mapIdentityId`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`

### Generation rules

- each automatic refresh binds to exactly one `viewportGenerationId`
- queued work stores one queued generation id only
- active work stores one active generation id only
- completed replacement stores one current generation id only

### Generation derivation

`viewportGenerationId` must be deterministically derived from:

- `viewportIdentity`
- `mapIdentityId`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`

and must not use:

- wall-clock timestamps
- random numbers
- browser object identity strings

### Stale work rules

If a newer viewport generation appears:

- older queued work becomes stale immediately
- older planning results must not submit
- older submitted-but-not-current results must not replace current population
- stale callbacks must be ignored
- partial mixing of old and new population is forbidden

## Coalescing Policy

Strict coalescing is required.

Example burst:

`moveend`
→ `zoomend`
→ `resize`

within one short completed-event burst must collapse into:

- exactly one pending population refresh for the latest generation

### Coalescing rules

- at most one refresh may be queued
- at most one refresh may be actively reading, planning, submitting, or drawing
- if a viewport changes during active work:
  - mark exactly one latest-generation follow-up
- if additional completed events arrive while a follow-up is already pending:
  - overwrite only the generation metadata with the newest generation
  - do not increment parallel queued work
- no recursion
- no parallel planning
- no parallel draw submission
- no infinite repopulation loop

### Counters to expose

- `refreshRequestedCount`
- `refreshQueuedCount`
- `refreshStartedCount`
- `refreshCompletedCount`
- `refreshCoalescedCount`
- `staleRefreshDiscardedCount`
- `skippedUnchangedViewportCount`

## Replacement Policy

Chosen v1 strategy:

- `FULL_DETERMINISTIC_BATCH_REPLACEMENT`

### Replacement rules

- keep current valid population visible while the next plan is being built, where safe
- never clear first unless a documented zoom or disable policy explicitly requires an empty batch
- validate the new plan completely before replacement
- replacement occurs at the command-batch level
- old population references are released only after successful new submission
- failed new work preserves the old valid population when safe
- duplicate instance accumulation is forbidden
- partial spatial diffing is intentionally out of scope for v1

### First safe v1 model

For every accepted automatic refresh:

1. derive latest generation
2. read and normalize features for that generation
3. build one deterministic plan
4. validate one draw batch
5. submit the new batch
6. mark it current only after successful submission/draw handoff
7. release previous population references

## Budget Policy

The automatic path must use explicit deterministic count caps, not timers.

Initial design budget:

- `maxSourceFeaturesPerViewport = 64`
- `maxNormalizedFeatures = 48`
- `maxPopulationCommands = 24`
- `maxVegetationInstances = 18`
- `maxBuildingInstances = 6`
- `maximumAutomaticRefreshesPerCompletedViewportGeneration = 1`

### Budget rules

- all truncation must be deterministic
- no random dropping
- one generation may trigger at most one accepted automatic replacement
- a stale generation may be discarded before replacement without counting as a completed refresh

## Zoom Policy

The design should respect existing GrowGo zoom detail behavior already present in the repo.

Observed current visual thresholds:

- zone detail medium:
  - `zoom >= 16.5`
- zone detail high:
  - `zoom >= 18`
- building drawing minimum:
  - `zoom >= 16.2`
- shop drawing minimum:
  - `zoom >= 16.8`

### Recommended automatic population zoom policy

- below `16.2`
  - no automatic population commands should be created
  - retain the last good population until a documented clear-or-retain rule is chosen
  - preferred v1 behavior:
    - retain current population until a valid replacement or explicit detach/disable

- `16.2` to `< 16.5`
  - building footprint and the broadest lightweight placement may be allowed
  - detailed vegetation density remains conservative

- `16.5` to `< 18`
  - normal automatic population is allowed
  - standard feature filtering and budgets apply

- `>= 18`
  - still obey the same command budgets
  - no budget expansion simply because the user zoomed closer

Rationale:

- these thresholds align with existing draw/detail thresholds already encoded in `script.js`
- the automatic policy should not claim detail earlier than the current renderer itself considers meaningful

## Move Policy

Population refresh only after:

- `moveend`

Never during:

- drag
- continuous map movement

### Skip rule

If a completed `moveend` produces the same deterministic:

- `viewportIdentity`
- `mapIdentityId`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`

and the normalized feature source fingerprint is unchanged, the automatic system may:

- increment `skippedUnchangedViewportCount`
- remain in `attached_idle`
- avoid redundant replanning

## Resize Policy

`resize` is approved because it may change:

- viewport bounds
- viewport snapshot
- feature inclusion filtering
- `viewportIdentity`

But `resize` must not:

- mutate deterministic world identity beyond the bounds-derived viewport generation
- bypass the same feature adapter, planner, or draw integration path

## Feature Source Policy

The automatic system must reuse the Phase 212.6 live feature adapter.

It consumes only the already-approved current feature source.

Explicit prohibitions:

- no direct public OSM/Overpass query per client
- no new browser network feature source
- no bypass around GrowGo regional-package architecture

## Readiness / Drift Policy

Before every automatic refresh the runtime must revalidate:

- persistent authorization
- attached state
- map identity
- region
- package
- recipe
- selector seed
- lifecycle owner
- retained surface
- readiness

### Drift result

If invalidation occurs:

- do not repopulate
- do not retry automatically
- invoke the existing controlled invalidation cleanup path
- ensure zero automatic-owner references after cleanup

## Clear / Disable Policy

When automatic population is disabled or Atlas detaches:

- block new refreshes
- invalidate the queued generation
- clear the automatic owner’s current plan and batch references
- if still attached and a safe empty replacement is needed:
  - optionally submit one empty population batch
- do not duplicate the full persistent cleanup path
- final Canvas/listener/lifecycle cleanup remains owned by persistent Atlas detach

## Failure Policy

Preferred policy:

- preserve last good population where safe
- fail closed for identity or readiness drift
- do not retry automatically
- wait for the next legitimate completed viewport event or explicit developer action

### Feature source unavailable

- do not replace current valid population
- set `lastFailureReason`
- remain eligible for the next completed approved event

### Viewport stale

- stale generation is discarded
- no submission occurs
- increment `staleRefreshDiscardedCount`

### Classification failure

- fail the active generation
- preserve last valid population where safe
- no automatic fallback classification

### Planner failure

- preserve last valid population where safe
- no automatic retry

### Budget overflow

- deterministic truncation only
- not a retry condition
- if no valid commands remain, keep old population or no-op according to current safe policy

### Draw submission failure

- preserve old valid population when safe
- mark failed closed for the active generation
- do not detach Atlas unless the persistent draw path itself invalidates

### Identity drift

- immediate invalidation
- existing persistent invalidation cleanup path owns teardown

### Readiness blocked

- immediate invalidation
- existing persistent invalidation cleanup path owns teardown

### Cleanup failure

- preserve cleanup failure separately from the originating refresh failure
- no automatic reattach

## Cleanup Policy

Automatic repopulation cleanup is intentionally narrower than persistent Atlas detach.

Automatic cleanup owns only:

- queued refresh generation
- active refresh generation metadata
- current automatic plan reference
- current automatic batch reference
- follow-up refresh marker

Persistent Atlas cleanup continues to own:

- Canvas
- pane
- lifecycle owner
- listeners
- full retained draw resources

## Diagnostics Contract

The future automatic controller must expose a frozen serializable read-only status containing:

- `schemaId`
- `automaticPopulationEnabled`
- `state`
- `currentViewportIdentity`
- `currentViewportGenerationId`
- `queuedViewportGenerationId`
- `activeViewportGenerationId`
- `followUpRefreshPending`
- `refreshRequestedCount`
- `refreshQueuedCount`
- `refreshStartedCount`
- `refreshCompletedCount`
- `refreshCoalescedCount`
- `staleRefreshDiscardedCount`
- `skippedUnchangedViewportCount`
- `currentPopulationPlanId`
- `currentBatchId`
- `currentCommandCount`
- `sourceFeatureCount`
- `normalizedFeatureCount`
- `lastTriggerReason`
- `lastFailureReason`
- `referencesReleased`
- `canonicalSafetyFlags`

No raw references may be exposed for:

- feature source objects
- map
- Canvas
- pane
- listeners
- callbacks
- renderer

## Implementation Roadmap

Recommended safe breakdown:

### 212.9 — Automatic Population Fake Runtime Contract

- define the isolated fake runtime controller
- prove event, queue, generation, and stale-work rules without live listeners

### 212.10 — Automatic Population Controller

- implement the real controller state machine disconnected from live events
- reuse manual preview core path internally

### 212.11 — Disabled Live-Event Adapter

- bind only approved live events
- keep automatic execution disabled
- prove no startup behavior and no automatic refresh while disabled

### 212.12 — Developer-Only Automatic Population Toggle

- add one explicit developer-only enable/disable seam
- keep canonical safety flags false

### 212.13 — Safari Automatic Repopulation Verification

- real Safari evidence for:
  - moveend
  - zoomend
  - resize
  - coalescing
  - stale discard
  - no duplicate resources

### 212.14 — Performance and Budget Verification

- measure feature counts, command counts, coalescing counts, redraw stability, and resource reuse

### 212.15 — Enablement Decision

- decide whether the automatic system is safe enough for the next developer-only milestone

## Phase Stop Condition

This phase is complete when:

- the state machine is explicit
- approved and forbidden events are explicit
- generation and stale-work policy are explicit
- replacement and budget policy are explicit
- cleanup and diagnostics contracts are explicit
- implementation order is unambiguous
- no live behavior changed

## Safety Confirmation

All canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase does not:

- enable automatic population
- register new listeners
- modify current listener behavior
- query public Overpass
- enable startup population
- change renderer visuals
- touch Firebase

## Next Phase

Recommended next phase:

- `212.9 — Automatic Population Fake Runtime Contract`
