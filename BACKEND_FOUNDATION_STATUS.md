# Firebase Authoritative-Pin Backend Foundation — Passive Section Closeout

- Branch: `feature/firebase-backend-foundation`
- Section status: passively complete and closed
- Next active project area: GrowGo Custom 2.5D renderer

## Implemented components

- authenticated callables
- player bootstrap and snapshot persistence
- capture validation
- persistent replay protection
- canonical pin identity and generation
- authoritative source verification
- acquisition contracts and orchestrator
- Firestore cache adapter
- Overpass transport contract
- emulator safety and loopback-only host validation
- passive decision helpers
- emulator E2E harness

## Locked numerical contracts

- spacing: 50 metres
- capture radius: 100 metres
- coordinate tolerance: 1 metre
- cache schema version: 1
- positive cache freshness: 7 days
- stale lifetime: 30 days
- negative duration: 6 hours
- timeout: 5000 ms
- maximum requests per acquisition: 1
- automatic retries: 0
- Retry-After bounds: 60-21600 seconds

## Production gates

All production gates remain false.

## Capture behavior

- status: `eligibility-deferred`
- accepted: `false`
- rewardGranted: `false`

## Runtime evidence

- verified focused command: `cd functions && npm test` (`pretest` rebuilds `functions/lib` first)
- focused tests: 56 passed, 0 failed, 4 skipped
- emulator E2E harness exists
- emulator-backed integration tests safely skip when no safe local emulator was running
- metadata-service access is not required for the normal focused test path

## Deferred future decisions

- production cache-read activation
- production cache-write activation
- production Overpass endpoint selection
- production live HTTP-client implementation
- cache population strategy
- rate limiting and operational quotas
- production runtime evidence independent of the emulator
- capture eligibility acceptance
- reward transaction design
- pin ownership or capture-state persistence
- `captureEvents` schema
- `pinStates` schema
- deployment and staged rollout

Do not resume Firebase authoritative-pin production activation until the user separately authorizes a future backend section.
