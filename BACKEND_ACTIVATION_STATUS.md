# GrowGo Backend Activation Status

## 1. Phase 1 Result

- Phase 1 purpose: complete a passive Development Backend Activation and Private Alpha Readiness audit without activating backend traffic, client integration, or production behavior.
- Verified starting foundation: `feature/firebase-backend-foundation` at commit `2c097e1`, which includes the reconciled backend test-baseline repair.
- Repaired test baseline:
  - verified command: `cd functions && npm test`
  - deterministic prerequisite: `pretest` rebuilds `functions/lib` before the suite runs
  - verified result on 2026-07-22: `56 passed, 0 failed, 4 skipped`
- Audit status: complete
- Phase 1 closeout: PASS
- Authorization boundary for Phase 2: Phase 2 is not automatically authorized by this document. A separate explicit user-authorized branch and implementation phase is still required.

## 2. Verified Foundation Inventory

### Firebase configuration files

- `.firebaserc`
  - alias `dev` maps to project `growgo-development`
- `firebase.json`
  - Functions source: `functions`
  - Firestore rules: `firestore.rules`
  - Firestore indexes: `firestore.indexes.json`
  - Storage rules: `storage.rules`
  - Emulator ports:
    - UI `4002`
    - Hub `4402`
    - Logging `4502`
    - Auth `9099`
    - Functions `5003`
    - Firestore `8088`
    - Storage `9199`
    - Eventarc `9299`

### Callable exports

- `functions/src/index.ts`
  - `bootstrapPlayer`
  - `getPlayerSnapshot`
  - `capturePin`

### API handlers

- `functions/src/api/bootstrapPlayer.ts`
  - authenticated callable scaffold
  - bootstrap transaction for baseline player document creation or refresh
  - request validation limited to `requestId`
  - returns server-authoritative field rejection evidence
- `functions/src/api/getPlayerSnapshot.ts`
  - authenticated callable scaffold
  - accepts only an empty request object
  - returns the safe scaffold snapshot for the authenticated player
- `functions/src/api/capturePin.ts`
  - authenticated callable scaffold
  - validates only:
    - `requestId`
    - `pinId`
    - `latitude`
    - `longitude`
    - `accuracyMetres`
    - `clientCapturedAt`
  - uses authoritative pin verification inputs
  - persists deferred capture requests
  - preserves deferred, non-rewarding semantics

### Authentication guard

- `functions/src/security/requireAuthenticated.ts`
  - requires `request.auth.uid`
  - throws `unauthenticated` when missing
  - records App Check verification presence
  - App Check enforcement is prepared but disabled by runtime configuration

### Runtime configuration

- `functions/src/config/runtimeConfig.ts`
  - `firebaseAlias: "dev"`
  - `projectId: "growgo-development"`
  - `firestoreDatabaseId: "(default)"`
  - `region: "australia-southeast1"`
  - `appCheck.prepared: true`
  - `appCheck.enforceOnCallable: false`
  - authoritative acquisition gates all default `false`
  - server authority remains:
    - reward computation: server only
    - progression writes: server only
    - inventory writes: server only
    - capture history writes: server only
    - marketplace writes: server only

### Authoritative pin acquisition flow

- `functions/src/domain/pins/authoritativePinSource.ts`
  - provider returns `null` when acquisition gates are disabled
- `functions/src/domain/pins/authoritativePinAcquisition.ts`
  - returns fail-closed transport/cache outcomes
  - enforces:
    - maximum one transport request
    - zero automatic retries
    - deterministic negative-cache handling
    - optional stale fallback only when explicitly allowed

### Canonical pin identity logic

- canonical source and spacing contracts live under `functions/src/domain/pins/`
- authoritative identity remains tied to canonical source reference:
  - generator version
  - source type
  - source id
- locked numerical contract from handoff:
  - spacing `50 metres`
  - capture radius `100 metres`
  - coordinate tolerance `1 metre`

### Capture request flow

- `functions/src/domain/captures/captureRequestStore.ts`
  - deterministic request key hashing
  - deterministic request fingerprint hashing
  - deferred eligibility decision only
  - accepted remains `false`
  - rewardGranted remains `false`
  - replay returns the original deferred outcome without extra reward/write effects

### Current replay and idempotency scaffolding

- `functions/src/idempotency/idempotency.ts`
  - request envelope exists
  - deterministic reservation key uses authenticated UID, server-defined operation, and requestId
  - persistent Firestore-backed capture reservation transaction is implemented for deferred `capturePin`
  - bootstrap reservation path remains intentionally unsupported
  - capture reservation document stores:
    - authenticated UID
    - operation identifier
    - idempotency key
    - deterministic request fingerprint
    - reservation state
    - created timestamp
    - updated timestamp
    - `captureRequestKey`
    - deferred response metadata
  - retention decision:
    - reservation state: `capture-deferred`
    - retention days: `30`
    - reservation reuse remains denied unless the exact reservation is replayed
    - no cleanup job is implemented in this phase
  - bootstrap result remains:
    - `supported: false`
    - `strategy: "firestore-transaction-todo"`
    - `reservationState: "not-attempted"`

### Player bootstrap and snapshot flow

- `functions/src/domain/players/playerStore.ts`
  - player documents are scaffold-locked to:
    - `level: 1`
    - `xp: 0`
    - `coins: 0`
    - `displayName: null`
    - `avatarUrl: null`
  - snapshot serialization exposes only the safe baseline fields

### Firestore and Storage rules

- `firestore.rules`
  - default deny for all document paths
  - no public profile reads
  - curated owner-only `playerPrivate/{playerId}` get path
  - `captureRequests` remains server-only
- `storage.rules`
  - default deny
  - only owner avatar read/write scaffold under `player-avatars/{uid}/{fileName}`
  - image-only upload and size bound

### Emulator configuration

- `firebase.json` declares a single-project local emulator suite
- `functions/src/infrastructure/pins/firestoreEmulatorHost.ts`
  - only accepts loopback Firestore emulator host values
- emulator-backed tests now skip safely when emulators are unavailable

### Tests and test commands

- `functions/package.json`
  - `build`
  - `pretest`
  - `typecheck`
  - `test`
  - `test:authoritative-cache:emulator`
  - `test:authoritative-acquisition:emulator`
- representative test areas:
  - canonical pin identity and generation
  - authoritative acquisition and provider behavior
  - Firestore cache behavior
  - capture request replay/deferred semantics
  - player snapshot contract
  - scaffold rules/config contract
  - emulator-backed integration coverage

Unimplemented functionality is not treated as complete in this inventory. Persistent capture idempotency reservation is now implemented, but capture activation, rewards, totals mutation, and client integration remain unauthorized.

## 3. Development-Only Activation Boundary

The backend is currently separated into four practical states:

1. Passive foundation code
   - exists now
   - callable scaffolding and domain logic are present
   - production-denying behavior remains locked
2. Development backend execution
   - not yet authorized
   - must require both verified development environment identity and explicit fail-closed activation flags
3. Development client access
   - not yet connected
   - must require both client-side and server-side approval
4. Beta and production access
   - not implemented
   - must remain denied

Fail-closed requirements for later activation:

- missing environment identity: deny
- missing feature flags: deny
- invalid authentication: deny
- client/server environment mismatch: deny
- malformed pin requests: deny
- failed canonical identity verification: deny acceptance and deny rewards
- uncertain idempotency state: deny authoritative acceptance
- failed capture persistence: deny completion
- failed snapshot reads: deny response
- unavailable backend services: deny execution or return explicit unavailable/deferred errors without widening scope

## 4. Environment Isolation

### Current isolation evidence

- development:
  - Firebase alias `dev`
  - project id `growgo-development`
  - emulator ports explicitly configured
- beta:
  - no verified alias or project contract present
- production:
  - no activation contract present
  - remains fail closed

### Current and required boundaries

- environment-selection source of truth:
  - currently runtime config plus Firebase alias
  - later phases need a stricter explicit environment contract
- client configuration boundary:
  - not yet connected
  - client must not infer or discover production settings implicitly
- server configuration boundary:
  - currently hardcoded dev identity in runtime config
  - later phases need explicit environment-aware gating
- emulator boundary:
  - localhost only
  - loopback validation exists
- Firestore data boundary:
  - current scaffold points to one dev project or safe emulator path
  - beta and production data boundaries are still undefined
- deployment boundary:
  - no deployment activity authorized in this section
- cross-environment risks:
  - no formal beta/prod separation contract yet
  - later activation must not rely only on project naming conventions

Production must remain disabled and fail closed until a later explicitly authorized phase.

## 5. Client Integration Points

Minimum future client integration points only:

- authentication startup
- stable player identity acquisition and retention
- `bootstrapPlayer`
- authoritative pin acquisition result consumption
- canonical pin identity consumption
- `capturePin`
- replay and idempotency result handling
- `getPlayerSnapshot`
- totals refresh from safe snapshot state
- backend unavailable behavior
- offline behavior
- development-only enablement
- environment mismatch rejection

No client connection work is performed in this phase.

## 6. Feature-Flag Contract

Recommended minimal fail-closed flag set:

1. `developmentBackendEnabled`
2. `developmentAuthenticationEnabled`
3. `developmentAuthoritativePinAcquisitionEnabled`
4. `developmentPinCaptureEnabled`
5. `developmentPlayerSnapshotEnabled`

Flag contract for each:

- default value: `false`
- source of truth: explicit environment-scoped configuration, not implicit runtime discovery
- allowed environment: development only
- server evaluation: required for every backend capability
- client evaluation: required for every user-facing backend integration point
- evaluation order:
  1. verified environment identity
  2. server flag
  3. client flag where applicable
  4. authenticated/session checks
  5. request validation and capability-specific guards
- missing value behavior: deny
- logging behavior: log explicit disabled/mismatch decisions with bounded volume
- emergency rollback behavior: set flag false and deny immediately without schema or reward side effects

Client and server permission must both pass where applicable. No flag implementation is authorized in this phase.

## 7. Authentication Boundary

Safest minimum private-alpha recommendation:

- use Firebase Authentication
- do not depend on unauthenticated access
- keep callable token verification mandatory
- prefer invited or allowlisted accounts over broad anonymous access for the invited alpha
- preserve stable UID as the primary player identity
- keep development-only access restricted by environment and feature flags
- preserve App Check readiness but do not enforce it until later explicit verification
- require emulator-backed auth verification before any development activation approval

Anonymous authentication exists in the broader Firebase project setup, but the safer minimum path for a small invited alpha is invited or allowlisted authenticated users with stable UIDs.

## 8. Verification Matrix

### Tests currently passing

- unit and contract tests for:
  - callable scaffolds
  - auth guard behavior
  - canonical pin identity and generation
  - authoritative acquisition and provider behavior
  - cache behavior
  - overpass transport contract
  - runtime config fail-closed behavior
  - deferred capture semantics
  - player snapshot scaffold contract
  - rules/config contract

### Emulator-backed tests currently skipped when emulators are unavailable

- `functions/tests/authoritative-pin-acquisition-emulator-e2e.test.mjs`
- `functions/tests/capture-emulator.integration.test.mjs`
- `functions/tests/firestore-authoritative-pin-cache-emulator.test.mjs`
- `functions/tests/player-emulator.integration.test.mjs`

### Tests that must pass with emulators before private-alpha approval

- auth rejection tests in live emulator flow
- environment mismatch tests
- emulator-backed cache integration
- emulator-backed acquisition end-to-end verification
- emulator-backed capture replay/deferred persistence verification
- emulator-backed player bootstrap/snapshot isolation verification

### Tests not yet implemented or not yet proven complete

- full fail-closed feature-flag tests
- beta/production environment-isolation tests
- complete persistent idempotency reservation tests
- rollback procedure verification
- budget/quota alert verification
- no-production-contact verification under development client integration

### Required later verification categories

- unit tests
- contract tests
- auth rejection tests
- environment mismatch tests
- canonical pin identity tests
- authoritative acquisition tests
- malformed capture tests
- duplicate capture tests
- idempotency tests
- snapshot and totals tests
- fail-closed flag tests
- emulator-backed integration tests
- rollback tests
- cost and quota safeguard tests
- metadata-service isolation checks
- no-production-contact verification

## 9. Cost, Quotas, Observability, and Rollback

Budget ceiling target: approximately A$20 per month.

Minimum safeguards required for later phases:

- bounded authoritative-pin queries
- cache reuse before remote acquisition
- zero automatic retries unless explicitly reauthorized
- request timeout locked and reviewed before widening
- Firestore read reduction
- Firestore write reduction
- idempotent capture writes
- minimal snapshot reads
- per-player limits
- structured logging
- log-volume controls
- budget alerts
- quota alerts
- emergency disable flags
- rollback procedure
- environment-specific shutdown

Current helpful evidence already present:

- max transport requests per invocation: `1`
- automatic retries: `0`
- timeout: `5000 ms`
- positive freshness: `7 days`
- stale lifetime: `30 days`
- negative duration: `6 hours`

No new infrastructure is added in this phase.

## 10. Risks and Blockers

- beta isolation contract is incomplete
- production isolation contract is incomplete
- four emulator-backed integration tests are skipped when no safe local emulators are available
- development client integration is not implemented
- authentication access model for invited alpha still needs an explicit decision
- App Check is prepared but not enforced
- production authorization remains absent
- no development activation flags are implemented yet
- no production deployment or runtime activation path is authorized
- capture remains deferred, non-rewarding, and not client-activated despite the completed reservation path

## 11. Eight-Phase Bounded Section Plan

### Phase 1. Development activation audit and section plan

- objective: inventory the repaired backend foundation and define the development-only activation boundary
- expected files: status documents and evidence references only
- risk level: low
- required tests: typecheck plus verified backend baseline
- stopping condition: audit evidence is complete and passive closeout is recorded
- phase type: closeout

### Phase 2. Development configuration and feature-flag contract

- objective: define explicit environment identity and fail-closed flag wiring contract
- expected files: backend config contracts, status docs, possibly non-runtime contract files
- risk level: low to medium
- required tests: contract tests and fail-closed config validation
- stopping condition: environment and flag contract is fully specified without activation
- phase type: passive

### Phase 3. Development-only authoritative-pin backend activation

- objective: enable development-only backend execution gates for authoritative pin acquisition
- expected files: backend runtime config, guarded infrastructure wiring, targeted tests
- risk level: medium
- required tests: acquisition tests, no-production-contact proof, emulator-safe verification
- stopping condition: development execution works only in the allowed environment and still fails closed elsewhere
- phase type: implementation

### Phase 4. Client/backend integration contract and implementation

- objective: add minimum development-only client integration points for auth, bootstrap, capture, and snapshot use
- expected files: client/backend integration code and documentation
- risk level: medium
- required tests: contract tests, auth mismatch tests, unavailable-backend tests
- stopping condition: development client can call only the approved backend surface
- phase type: implementation

### Phase 5. Authentication, capture, idempotency, and snapshot verification

- objective: verify callable auth, capture replay behavior, idempotency boundaries, and snapshot safety
- expected files: targeted tests and narrowly scoped backend fixes if needed
- risk level: medium
- required tests: auth rejection, malformed input, duplicate capture, snapshot, partial idempotency tests
- stopping condition: all approved verification categories pass without production widening
- phase type: verification

### Phase 6. Emulator or controlled development integration testing

- objective: prove the development path in emulators or another explicitly controlled development environment
- expected files: tests, harness docs, verification evidence
- risk level: medium
- required tests: all emulator-backed integration tests and localhost-only proofs
- stopping condition: integration evidence is complete and no live production contact occurs
- phase type: verification

### Phase 7. Cost, quotas, observability, rollback, and fail-closed safeguards

- objective: add bounded operational safeguards and emergency disablement
- expected files: backend config, logs/observability docs, rollback docs, targeted tests
- risk level: medium
- required tests: quota, timeout, retry, rollback, and fail-closed flag tests
- stopping condition: development activation has bounded cost and a safe disable path
- phase type: implementation

### Phase 8. Private-alpha readiness final review and section closeout

- objective: perform final readiness review for the invited development alpha
- expected files: final status/closeout docs only unless a narrow repair is required
- risk level: low
- required tests: full approved backend verification matrix and explicit open-risk review
- stopping condition: either private-alpha readiness is approved or blockers are explicitly recorded
- phase type: closeout

## 12. Phase 2 Result

- Phase 2 objective: define the minimum typed development-only environment identity and fail-closed feature-flag contract needed for later activation without connecting any runtime consumer.
- Implemented configuration module:
  - `functions/src/config/developmentBackendActivation.ts`
- Implemented environment contract:
  - declared environment name
  - validated environment name
  - declared project identity
  - expected development project identity
  - emulator mode
  - validated loopback emulator identity
  - runtimeActivationPermitted contract value
- Implemented feature-flag contract:
  - `developmentBackendEnabled`
  - `developmentAuthenticationEnabled`
  - `developmentAuthoritativePinAcquisitionEnabled`
  - `developmentPinCaptureEnabled`
  - `developmentPlayerSnapshotEnabled`
- Exact defaults:
  - every flag defaults to disabled
  - missing values parse as disabled
  - invalid values parse as disabled
  - only explicit string `true` enables a flag
  - explicit string `false` disables a flag
- Evaluation order:
  1. parse declared environment
  2. validate environment name
  3. validate project identity
  4. validate emulator identity when present
  5. require development environment
  6. require global development backend flag
  7. require capability-specific flag
  8. return allow or deny with a stable reason code
- Stable reason codes:
  - `environment_missing`
  - `environment_unknown`
  - `project_missing`
  - `project_mismatch`
  - `emulator_host_invalid`
  - `environment_not_development`
  - `backend_flag_disabled`
  - `capability_flag_disabled`
  - `allowed`
- Beta and production denial:
  - beta remains denied even with all flags true
  - production remains denied even with all flags true
  - no project, emulator, or flag combination enables runtime activation outside development
- Emulator behavior:
  - emulator mode is permitted only for development
  - loopback-only emulator host validation is reused
  - emulator mode does not bypass project checks
  - emulator mode does not bypass the global backend flag
  - emulator mode does not bypass capability-specific flags
- Tests added:
  - `functions/tests/development-backend-activation.test.mjs`
- Remaining non-activation boundary:
  - no callable imports or consumes the evaluator
  - no Firebase Admin initialization is triggered by the evaluator
  - no Firestore access occurs
  - no external service calls occur
  - no client integration exists
  - no feature is active
- Phase 2 closeout: PASS
- Phase 3 authorization boundary:
  - Phase 3 still requires explicit user authorization
  - contract-level allow must not be treated as runtime activation
  - authoritative-pin acquisition, pin capture acceptance, and client connectivity all remain disabled until a later phase connects a guarded runtime consumer

## 13. Phase 3 Result

- Phase 3 objective: define the first passive runtime-consumer authorization plan for the Phase 2 development backend activation evaluator without wiring it into any callable, service, store, transport, or client path.
- Verified current no-consumer state:
  - no runtime callable or server entry point imports `functions/src/config/developmentBackendActivation.ts`
  - no runtime callable or server entry point imports the Phase 3 passive authorization helper
  - the Phase 2 evaluator remains pure and environment-variable-backed only
  - all Phase 2 flags still default to disabled
  - beta remains denied
  - production remains denied
  - emulator mode does not bypass identity or flag checks
- Implemented passive helper module:
  - `functions/src/config/developmentBackendRuntimeConsumerAuthorization.ts`
- Passive authorization-state model:
  - `not_applicable`
  - `candidate_identified`
  - `authorization_blocked`
  - `ready_for_future_wiring`
  - no `active` state exists
- Candidate consumer inventory:
  - authentication
    - `bootstrapPlayerCallable`
    - `getPlayerSnapshotCallable`
    - `capturePinCallable`
  - player snapshot
    - `bootstrapPlayerCallable`
    - `getPlayerSnapshotCallable`
  - pin capture
    - `capturePinCallable`
  - authoritative pin acquisition
    - `capturePinCallable`
    - `authoritativePinAcquisitionService`
- Proposed future evaluator wiring points:
  - `bootstrapPlayer`: immediately after `requireAuthenticated(request)` and before request payload validation
  - `getPlayerSnapshot`: immediately after `requireAuthenticated(request)` and before request payload validation
  - `capturePin`: immediately after `requireAuthenticated(request)` and before capture payload validation
  - authoritative acquisition service: only as a secondary fail-closed layer beneath a guarded public callable boundary
- Required future evaluation order:
  1. callable invocation received
  2. Firebase Authentication validated where required
  3. development environment identity validated
  4. global development backend flag evaluated
  5. capability-specific flag evaluated
  6. capability-specific input validation performed
  7. existing domain logic invoked
  8. existing fail-closed result returned
- Denial contract:
  - existing missing-auth behavior remains `unauthenticated`
  - future environment/flag/prerequisite denials should remain client-safe and use `failed-precondition`
  - stable passive prerequisite reason codes include:
    - `phase2_contract_incomplete`
    - `evaluator_unavailable`
    - `environment_scope_not_fail_closed`
    - `auth_guard_missing`
    - `idempotency_reservation_incomplete`
    - `idempotency_emulator_coverage_incomplete`
    - `future_implementation_authorization_missing`
    - `ready_for_future_wiring`
  - stable not-applicable reason codes include:
    - `unknown_capability`
    - `unknown_consumer`
    - `consumer_capability_mismatch`
- Authoritative-pin consumer recommendation:
  - use a minimum layered approach
  - primary future guard: `capturePin` callable boundary
  - secondary future guard: authoritative acquisition service boundary
  - do not expose a new public acquisition callable in this section
  - preserve one transport request maximum, zero automatic retries, existing timeout, cache behavior, canonical verification, and production/beta denial
- Authentication consumer recommendation:
  - `bootstrapPlayer`, `getPlayerSnapshot`, and `capturePin` should all keep Firebase Authentication mandatory
  - the future authentication capability flag should control development-backend availability only
  - disabled flags must not bypass, weaken, or downgrade identity verification
- Capture consumer recommendation and blockers:
  - future `capturePin` evaluator wiring belongs at the public callable boundary before payload validation
  - persistent idempotency reservation and emulator-backed transaction proof are now complete prerequisites
  - capture must still remain blocked from runtime wiring until a later explicit activation phase authorizes it
  - deferred-only, replay-protected, non-rewarding semantics must remain unchanged
- Snapshot consumer recommendation:
  - `bootstrapPlayer` and `getPlayerSnapshot` are the only approved future player-surface consumers in this section
  - both remain owner-scoped, scaffold-safe, minimal, and isolated to the verified development environment
- Tests added:
  - `functions/tests/development-backend-runtime-consumer-authorization.test.mjs`
- Explicit no-runtime-wiring statement:
  - no callable was modified
  - no runtime evaluator consumer was connected
  - no backend capability became active
  - no client integration was added
  - no production or beta behavior changed
- Phase 3 closeout: PASS
- Phase 4 authorization boundary:
  - Phase 4 still requires explicit user authorization
  - any future evaluator wiring must remain development-only and fail closed
  - runtime consumer implementation must remain separate from this passive planning section

## 14. Phase 4 Result

- Phase 4 objective: implement the first tightly controlled, development-only, fail-closed runtime consumer of the Phase 2 activation evaluator.
- Selected first runtime consumer:
  - `getPlayerSnapshot`
- Selection rationale:
  - read-only is lower risk than `bootstrapPlayer`
  - snapshot flow performs minimal Firestore activity
  - snapshot flow does not depend on incomplete idempotency reservation
  - snapshot flow does not invoke authoritative-pin transport
  - existing Firebase Authentication was already mandatory
- Implemented runtime guard:
  - `functions/src/security/developmentBackendCapabilityGuard.ts`
  - selected capability: `player_snapshot`
  - callable error code: `failed-precondition`
  - client-safe message: `This development backend capability is not available in the current environment.`
- Exact callable integration order:
  1. callable request received
  2. `requireAuthenticated(request)`
  3. existing App Check guard evaluation
  4. development backend capability guard
  5. existing payload validation
  6. existing player snapshot logic
  7. existing response returned
- Default fail-closed behavior:
  - with normal current configuration, `getPlayerSnapshot` now denies after authentication
  - denial occurs before any Firestore read
  - no snapshot data is returned
  - no production or beta activation is possible
- Development allow-path behavior:
  - allow requires valid development environment identity
  - allow requires matching development project identity
  - allow requires loopback-safe emulator identity when emulator mode is declared
  - allow requires `GROWGO_DEVELOPMENT_BACKEND_ENABLED === "true"`
  - allow requires `GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED === "true"`
  - allow preserves the existing snapshot response shape
- Evidence that no other consumer was wired:
  - only `functions/src/api/getPlayerSnapshot.ts` imports the runtime guard
  - `bootstrapPlayer` does not import the runtime guard
  - `capturePin` does not import the runtime guard
  - `functions/src/index.ts` remains unchanged
- Capture and authoritative-pin non-activation evidence:
  - `capturePin` remains deferred-only and unchanged
  - authoritative-pin transport remains disabled
  - persistent idempotency reservation remains incomplete, so `capturePin` is still not an approved runtime consumer
- Tests added:
  - `functions/tests/get-player-snapshot-development-guard.test.mjs`
- Explicit no-client-integration statement:
  - no client integration exists
  - no live Firebase traffic was enabled
  - no backend capability became broadly active
  - this phase only guarded one server-side callable
- Phase 4 closeout: PASS
- Phase 5 authorization boundary:
  - Phase 5 still requires explicit user authorization
  - any later guarded consumer beyond `getPlayerSnapshot` must be separately justified
  - `capturePin` remains blocked until persistent idempotency reservation and emulator evidence are complete

## 15. Phase 5 Result

- Phase 5 objective:
  - verify the current development-backend activation boundary across authentication, guarded snapshot access, capture safety, canonical pin identity, replay handling, and idempotency blockers without widening runtime activation
- Authentication verification result:
  - `bootstrapPlayer` still requires Firebase Authentication before idempotency reservation or player writes
  - `getPlayerSnapshot` still requires Firebase Authentication before development capability evaluation
  - `capturePin` still requires Firebase Authentication before payload validation, persistence, or authoritative verification
  - App Check behavior remains unchanged and unenforced by default
  - client-safe denials continue to avoid exposing internal environment or flag details
- Snapshot verification result:
  - `getPlayerSnapshot` remains the only guarded runtime consumer
  - default configuration still denies snapshot access
  - valid development-only configuration still reaches the existing owner-scoped snapshot logic
  - beta and production still deny even with flags set to true
  - project mismatch and invalid emulator identity still deny
  - denial still occurs before any Firestore read
  - the snapshot response shape remains unchanged
  - owner UID isolation remains covered by the local emulator integration path
- Capture verification result:
  - `capturePin` remains unguarded by the development backend capability gate in this phase
  - malformed payloads still reject before persistence and authoritative verification
  - capture remains `eligibility-deferred`
  - `accepted` remains `false`
  - `rewardGranted` remains `false`
  - identical replay remains deterministic and local
  - conflicting request reuse still rejects safely
  - cross-player reuse remains isolated by authenticated UID scoping
  - no totals mutation or reward grant was introduced
- Canonical identity verification result:
  - canonical pin identity remains derived server-side from canonical source identity
  - malformed, legacy, unsupported, mismatched, unavailable, invalid, and out-of-range canonical inputs still reject safely
  - equivalent canonical inputs still resolve consistently
  - client-provided arbitrary IDs still cannot bypass verification
  - remote authoritative transport still remains disabled by default fail-closed gates
- Exact idempotency classification:
  - incomplete but safely blockable
  - current repository evidence still shows `reserveIdempotencySlot(...)` is a stub only
  - current explicit result remains:
    - `supported: false`
    - `strategy: "firestore-transaction-todo"`
    - `reservationState: "not-attempted"`
    - `duplicateRequestDetected: false`
  - replay and conflict protection exists for deferred capture request recording, but persistent reservation atomicity is not yet implemented
  - capture must therefore remain blocked from any broader activation beyond the current deferred scaffold
- Any implementation completed:
  - no persistent idempotency reservation implementation was added in this phase
  - one narrow test seam was added to `bootstrapPlayer` so authentication order can be verified without live services
- Remaining blocker:
  - Firestore-backed persistent idempotency reservation remains incomplete
  - concurrent duplicate-attempt atomicity, uncertain-persistence fail-closed behavior, and emulator-backed reservation verification remain future work
- Focused tests added:
  - `functions/tests/backend-activation-phase5-verification.test.mjs`
- Focused verification coverage added:
  - unauthenticated `bootstrapPlayer` rejects before idempotency reservation and player transaction
  - authenticated `bootstrapPlayer` preserves its existing response shape while idempotency remains explicitly unsupported
  - unauthenticated `capturePin` rejects before payload validation, persistence, or authoritative verification
  - malformed `capturePin` payload rejects before persistence and authoritative verification
  - idempotency reservation remains explicitly incomplete and fail closed
  - `capturePin` remains unguarded by the development backend capability gate
- Emulator tests still pending for Phase 6:
  - persistent idempotency reservation transaction semantics once implemented
  - concurrent duplicate-attempt arbitration against a real emulator-backed store
  - uncertain-persistence fail-closed behavior once a reservation ledger exists
- Explicit no-client-integration statement:
  - no client integration was added
  - no live Firebase traffic was enabled
  - no additional runtime consumer was connected
- Explicit no-reward statement:
  - no reward behavior changed
  - no totals mutation was introduced
  - no capture acceptance was enabled
- Phase 5 closeout: PASS
- Phase 6 authorization boundary:
  - any future persistent idempotency implementation still requires explicit user authorization
  - any future `capturePin` runtime activation still requires emulator-backed reservation evidence
  - no beta, production, client, or live transport activation is authorized by this phase

## 16. Phase 5A Result

- Phase 5A objective:
  - implement and verify the minimum persistent Firestore-backed idempotency reservation required for safe deferred `capturePin` testing without activating capture, rewards, totals mutation, client integration, or live Firebase traffic
- Reservation schema and scope:
  - one deterministic reservation document per authenticated UID + server-defined operation + requestId
  - collection: `idempotency`
  - operation scope for this phase: `capturePin`
  - minimum stored fields:
    - `uid`
    - `operation`
    - `idempotencyKey`
    - `requestFingerprint`
    - `reservationState`
    - `createdAt`
    - `updatedAt`
    - `captureRequestKey`
    - deferred response metadata
- Deterministic fingerprint contract:
  - derived only from validated capture intent fields that materially affect the deferred result
  - stable across equivalent requests
  - unaffected by object key order
  - excludes server timestamps, random values, process-local state, and client-supplied reward fields
- Transaction behavior implemented:
  - first request:
    - creates exactly one reservation
    - creates exactly one deferred `captureRequests` document
    - returns the first deferred result
  - exact replay:
    - reuses the existing reservation
    - creates no second `captureRequests` document
    - returns the stored deferred outcome deterministically
  - conflicting replay:
    - preserves the original reservation unchanged
    - creates no second deferred request
    - rejects with `already-exists`
  - uncertain non-callable transaction failure:
    - fails closed with `internal`
    - grants no reward
    - mutates no totals
- Concurrency verification result:
  - emulator-backed duplicate race:
    - one first-request result
    - one replay result
    - one reservation
    - one deferred capture-request write
  - emulator-backed conflicting race:
    - one winning reservation
    - one `already-exists` conflict
    - one deferred capture-request write
- Cross-player and operation isolation:
  - same requestId used by different authenticated players remains isolated
  - reservation keys remain isolated by operation scope
- Retention decision:
  - retain reservations for `30` days
  - do not allow reservation reuse after cleanup ambiguity
  - scheduled cleanup remains out of scope for this phase
- Cost implications:
  - one direct reservation document read path
  - one reservation document write path
  - one deferred capture-request write path for first request only
  - no collection scans
  - no reward writes
  - no totals writes
  - no scheduled cleanup or background loops
- Emulator verification result on 2026-07-22:
  - targeted localhost-only emulator tests passed:
    - `capturePin records deferred requests with persistent reservation, replay, and conflict protection`
    - `capturePin concurrent identical requests produce one first result, one replay result, and one reservation`
    - `capturePin concurrent conflicting requests reserve once and reject the conflicting replay safely`
  - full backend suite result after Phase 5A:
    - `119 passed, 0 failed, 3 skipped`
- Focused files changed for Phase 5A:
  - `functions/src/idempotency/idempotency.ts`
  - `functions/src/api/capturePin.ts`
  - `functions/tests/backend-activation-phase5-verification.test.mjs`
  - `functions/tests/capture-authoritative-verification.test.mjs`
  - `functions/tests/capture-idempotency.test.mjs`
  - `functions/tests/capture-emulator.integration.test.mjs`
  - `functions/tests/authoritative-pin-infrastructure-integration.test.mjs`
  - `BACKEND_ACTIVATION_STATUS.md`
- Explicit non-activation confirmation:
  - `capturePin` is still not activated for clients
  - `accepted` remains `false`
  - `rewardGranted` remains `false`
  - no player totals mutation was added
  - no new callable export was added
  - no development capability guard was added to `capturePin`
  - authoritative transport remains disabled by default
  - no beta or production activation is authorized
- Remaining blockers after Phase 5A:
  - development client integration remains absent
  - broader runtime consumer activation beyond `getPlayerSnapshot` remains unauthorized
  - beta and production isolation remain incomplete
  - cleanup scheduling remains unimplemented
- Phase 5A closeout: PASS
- Phase 6 authorization boundary:
  - Phase 6 still requires separate explicit user authorization
  - any later runtime activation of `capturePin` must remain development-only and fail closed
  - any later client integration, reward writes, totals mutation, beta enablement, production enablement, or live authoritative transport enablement remains unauthorized by this phase

## 17. Phase 6 Result

- Phase 6 objective:
  - prove the broader development-only GrowGo backend path through the local Firebase emulator suite without connecting the real client, deploying, enabling rewards, enabling totals mutation, enabling beta or production, or enabling unrestricted authoritative transport
- Emulator environment used on 2026-07-22:
  - reused the existing loopback-only local Firebase emulator suite
  - verified project identity remained `growgo-development`
  - verified loopback-only ports:
    - Emulator UI `4002`
    - Hub `4402`
    - Logging `4502`
    - Functions `5003`
    - Firestore `8088`
    - Auth `9099`
    - Storage `9199`
    - Eventarc `9299`
  - verified emulator discovery through the local Hub endpoint only
  - no live Firebase project access was used
- Guarded runtime consumer evidence:
  - `getPlayerSnapshot` remains the only guarded runtime consumer
  - `bootstrapPlayer` still does not import the development runtime guard
  - `capturePin` still does not import the development runtime guard
  - `functions/src/index.ts` export surface remains unchanged:
    - `bootstrapPlayer`
    - `getPlayerSnapshot`
    - `capturePin`
- Journey A — authenticated player bootstrap:
  - unauthenticated `bootstrapPlayer` emulator invocation rejects with `401` / `UNAUTHENTICATED`
  - authenticated bootstrap creates exactly one owner-scoped player scaffold for a new UID
  - duplicate bootstrap for the same UID remains safe and does not create a duplicate player document
  - cross-player bootstrap isolation was re-verified with two emulator Auth users
  - bootstrap still does not persist capture requests, reward writes, totals writes, or capture reservations
- Journey B — guarded snapshot:
  - default or missing development flags still deny `getPlayerSnapshot` with `FAILED_PRECONDITION`
  - denied path still occurs before any Firestore read
  - explicit valid development configuration still reaches the existing owner-scoped snapshot contract
  - the allowed path still returns only the authenticated owner snapshot
  - beta and production denial behavior remains covered by the Phase 4/5 guard suite and remains fail closed
  - project mismatch and invalid emulator identity denial behavior remains covered and unchanged
- Journey C — canonical deferred capture:
  - malformed capture input still rejects safely before persistence
  - canonical mismatch and authoritative evidence mismatch still reject safely
  - valid canonical capture intent still performs server-side canonical verification
  - authoritative remote transport still remains disabled by default
  - first valid deferred capture still writes:
    - exactly one idempotency reservation
    - exactly one deferred `captureRequests` document
  - no reward write, no totals write, and no accepted capture path was enabled
- Journey D — concurrency and isolation:
  - concurrent identical capture requests still produce:
    - one first result
    - one replay result
    - one reservation
    - one deferred capture-request write
  - concurrent conflicting capture requests still produce:
    - one winning reservation
    - one safe conflict rejection
    - no duplicate deferred request write
  - same idempotency key across different authenticated UIDs remains isolated
  - retry behavior remains deterministic and deferred-only
- Journey E — environment isolation:
  - development identity with exact project match may pass eligible checks only when required flags are explicitly true
  - missing environment still denies
  - unknown environment still denies
  - project mismatch still denies
  - beta still denies
  - production still denies
  - emulator presence alone still does not imply development authorization
  - flags remain required in emulator mode
  - non-loopback emulator identity still denies
  - no test contacted another Firebase project
- Exact read/write accounting proven in emulator-backed coverage:
  - bootstrap:
    - new player bootstrap creates one player document for that UID
    - duplicate bootstrap updates the existing player scaffold without creating another player document
    - no capture reservation or deferred capture-request write occurs during bootstrap
  - snapshot:
    - denied path Firestore reads remain zero
    - allowed path performs the minimal owner-scoped player read
    - no snapshot writes occur
  - first capture:
    - one idempotency reservation
    - one deferred capture request
    - zero reward writes
    - zero totals writes
  - replay:
    - no duplicate deferred capture write
    - no reward write
    - no totals write
  - conflict:
    - no reservation overwrite
    - no extra deferred capture write
- Emulator-backed tests added or strengthened for Phase 6:
  - `functions/tests/player-emulator.integration.test.mjs`
  - `functions/tests/player-snapshot-development-guard-emulator.integration.test.mjs`
  - `functions/tests/capture-emulator.integration.test.mjs`
  - `functions/tests/authoritative-pin-acquisition-emulator-e2e.test.mjs`
  - `functions/tests/firestore-authoritative-pin-cache-emulator.test.mjs`
- Narrow verified defect repaired during Phase 6:
  - `functions/src/domain/pins/authoritativePinCache.ts`
  - negative cache records now omit `retryAfterSeconds` unless it is explicitly defined, which keeps Firestore emulator writes valid without widening runtime behavior
- Emulator execution results:
  - targeted localhost-only emulator-backed verification on 2026-07-22:
    - `18 passed, 0 failed, 0 skipped`
  - full backend suite with emulators available after Phase 6:
    - `134 passed, 0 failed, 0 skipped`
  - relevant emulator-backed player and authoritative-acquisition tests executed rather than skipping
- Skipped versus executed status:
  - no relevant Phase 6 emulator-backed test remained skipped in the final verified run
  - no remaining skip is required to justify the Phase 6 result
- No-live-project evidence:
  - all verified emulator endpoints were `127.0.0.1`
  - local emulator discovery was read from the Hub endpoint only
  - no metadata-service lookup was introduced
  - no live Firebase project read or write occurred
- Explicit no-client-integration statement:
  - no real GrowGo client was connected
  - no browser or runtime consumer integration was added
  - no renderer file or `script.js` change was made
- Explicit no-reward statement:
  - `accepted` remains `false`
  - `rewardGranted` remains `false`
  - no XP, coins, points, totals, inventory, or ownership mutation was enabled
- Remaining blockers after Phase 6:
  - development client integration remains absent
  - `capturePin` remains unavailable to the real client
  - reward activation and totals mutation remain unauthorized
  - beta and production activation remain unauthorized
  - remote authoritative transport remains disabled by default
  - operational cost, quota, rollback, and broader safeguard work still belongs to Phase 7
- Focused files changed for Phase 6:
  - `functions/src/domain/pins/authoritativePinCache.ts`
  - `functions/tests/authoritative-pin-acquisition-emulator-e2e.test.mjs`
  - `functions/tests/capture-emulator.integration.test.mjs`
  - `functions/tests/player-emulator.integration.test.mjs`
  - `functions/tests/player-snapshot-development-guard-emulator.integration.test.mjs`
  - `BACKEND_ACTIVATION_STATUS.md`
- Phase 6 closeout: PASS
- Phase 7 authorization boundary:
  - Phase 7 still requires separate explicit user authorization
  - no deployment, client activation, reward activation, totals mutation, beta activation, production activation, or live authoritative transport activation is authorized by this phase
