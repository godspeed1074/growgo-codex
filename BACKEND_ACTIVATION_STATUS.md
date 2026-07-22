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
  - reservation support remains incomplete
  - TODO remains for Firestore-backed reservation transaction
  - current result:
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

Unimplemented functionality is not treated as complete in this inventory. In particular, full persistent idempotency reservation remains incomplete.

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
- capture idempotency is only partial because `reserveIdempotencySlot(...)` remains TODO
- four emulator-backed integration tests are skipped when no safe local emulators are available
- development client integration is not implemented
- authentication access model for invited alpha still needs an explicit decision
- App Check is prepared but not enforced
- production authorization remains absent
- no development activation flags are implemented yet
- no production deployment or runtime activation path is authorized

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
