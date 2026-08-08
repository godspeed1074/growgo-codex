# GrowGo Session Phase 212.16 — Road and Boundary Relationship Rules

Status: implemented as a developer-only deterministic planning seam.

Goal:
- teach Atlas population planning how roads, buildings, vegetation, and boundaries relate
- preserve deterministic output and existing safety posture
- keep all changes renderer-free and planning-only

Implemented relationship coverage:

1. Road-to-building relationships
- nearest valid road lookup
- deterministic road-facing orientation
- stable frontage/entrance direction
- deterministic setback anchoring

2. Road-to-vegetation relationships
- road exclusion zones
- roadside verge preference
- vegetation boundary preference

3. Boundary relationships
- park edge planting
- coastal vegetation transition edge preference
- road-facing frontage boundary mode for building recipes

4. Adjacency relationships
- nearest adjacent feature lookup
- open-area-aware vegetation reasoning
- future-ready seam for path/fence expansion

Diagnostics exposed:
- `relationshipRuleId`
- `nearestFeatureId`
- `nearestRoadId`
- `boundaryDistance`
- `orientationDecision`
- `placementReason`

Preserved:
- deterministic generation
- command budgets
- developer-only activation
- no renderer changes
- no production runtime enablement

Safety flags:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
