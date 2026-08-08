# GrowGo Atlas Session 212.47 — Global Journey Mythology, Signature Route Identity, and Destination Legacy Hooks

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only deterministic legacy exploration layer that turns proven world-journey, route-memory, place-memory, and regional-identity signals into iconic signature-route and legendary-destination planning hooks.

What was added:

- `client/developer-only-atlas-population-signature-route-legacy-hooks-rules.mjs`
- `tests/client-developer-only-atlas-signature-route-legacy-hooks-rules.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Developer-only legacy outputs:

- `signatureRouteProfileId`
- `legacyDestinationId`
- `mythologyProfileId`
- `globalJourneyTier`
- `legacyReason`

Deterministic rule coverage:

1. Coastal / scenic world journeys
   - signature route:
     `SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001`
   - legacy destination:
     `LEGACY_DESTINATION_COASTAL_REVEAL_001`
   - mythology:
     `MYTHOLOGY_PROFILE_SCENIC_EXPLORER_001`

2. Heritage / landmark world journeys
   - signature route:
     `SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001`
   - legacy destination:
     `LEGACY_DESTINATION_HERITAGE_LANDMARK_001`
   - mythology:
     `MYTHOLOGY_PROFILE_HERITAGE_COLLECTOR_001`

3. Community / return-visit world journeys
   - signature route:
     `SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001`
   - legacy destination:
     `LEGACY_DESTINATION_COMMUNITY_ANCHOR_001`
   - mythology:
     `MYTHOLOGY_PROFILE_LOCAL_MEMORY_KEEPER_001`

4. Discovery / mythic world journeys
   - signature route:
     `SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001`
   - legacy destination:
     `LEGACY_DESTINATION_DISCOVERY_MILESTONE_001`
   - mythology:
     `MYTHOLOGY_PROFILE_GLOBAL_DISCOVERY_ODYSSEY_001`

Planner integration:

- The world population planner now resolves legacy hooks after:
  - world exploration cohesion
  - route memory guidance
  - place memory narrative
  - regional expedition identity
- The planner now emits:
  - `signatureRouteLegacyDecisions`
- Resolved feature recipe entries and accepted placements now carry the same legacy hook diagnostics.

Safety:

- planning only
- deterministic output preserved
- command budgets preserved
- renderer isolation preserved
- developer-only activation preserved
- no startup behavior added
- no automatic spawning added

Canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Proof summary:

- same legacy inputs produce the same signature-route outputs
- supported journey families resolve to stable legacy destinations
- mythology profiles remain deterministic
- planner status exposes frozen serializable legacy diagnostics
- no raw renderer, DOM, Canvas, or browser references are exposed

Suggested commit:

`feat(atlas): add signature route legacy hooks`
