# GROWGO SESSION 55 — SUBURBAN DISTRICT EXPANSION FOUNDATION

## Session Scope

This session defines the procedural foundation for combining multiple:

- `SUBURBAN_STREET_BLOCK_001`

instances into:

- `SUBURBAN_DISTRICT_001`

Purpose:

- procedural Australian suburban district generation

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create new buildings
- create new modules
- create final district scenes
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This foundation is based on:

- `GROWGO_SESSION_54_THIRD_SUBURBAN_STREET_BLOCK_VISUAL_INSPECTION_REPORT.md`
- `GROWGO_SESSION_46_SUBURBAN_STREET_BLOCK_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_47_MACHINE_READABLE_SUBURBAN_STREET_BLOCK_CONTRACT.md`
- existing Asset Factory and neighbourhood generation patterns

Continuity rules:

- `SUBURBAN_STREET_BLOCK_001` is the approved deterministic district building unit
- the tuned suburban composition from Session 53 remains the default suburban residential profile
- district generation must remain deterministic from seed alone
- district generation must preserve the street-block validation-first workflow before any future large-scene preview work
- this foundation should support later district preview and validation without requiring immediate Blender execution

## 2. District Goal

`SUBURBAN_DISTRICT_001` must define a larger suburban district that combines multiple validated street blocks into a coherent Australian suburban pattern.

The first district target scale is:

- minimum: `100` residential lots
- maximum: `300` residential lots

The district system should preserve:

- suburban identity control
- deterministic rebuild
- residential block readability
- road hierarchy consistency
- future support for parks, reserves, schools, and neighbourhood destinations

## 3. District Definition

### System ID

- `SUBURBAN_DISTRICT_001`

### Purpose

`SUBURBAN_DISTRICT_001` is the first machine-readable suburban district contract that arranges multiple suburban street blocks, supporting land-use zoning, road hierarchy, open space allocation, and future destination growth.

### Core responsibilities

- place multiple `SUBURBAN_STREET_BLOCK_001` units deterministically
- provide district-level road and connector rules
- define residential and non-residential land-use zones
- reserve space for future civic, commercial, and transport systems
- validate district connectivity and composition before any preview consumer or scene assembly step

## 4. District Concept

The district system combines multiple:

- `SUBURBAN_STREET_BLOCK_001`

instances into:

- `SUBURBAN_DISTRICT_001`

Recommended first district scale bands:

- small district: `100-140` lots
- medium district: `141-220` lots
- large district: `221-300` lots

Recommended first implementation target:

- `6-10` street blocks
- each block contributing approximately `20-30` lots depending on future density profiles

District assembly should treat each street block as:

- a deterministic placement unit
- a residential identity unit
- a streaming and validation boundary

## 5. Proposed Machine-Readable District Contract

### Primary schema ID

- `SUBURBAN_DISTRICT_001`

### Supporting schema set

Recommended new schema identities:

- `DISTRICT_BLOCK_INSTANCE_001`
- `DISTRICT_ROAD_CONNECTOR_001`
- `DISTRICT_LAND_USE_ZONE_001`
- `DISTRICT_OPEN_SPACE_INSTANCE_001`
- `DISTRICT_VALIDATION_REPORT_001`

### Required top-level fields

- `schemaId`
- `districtId`
- `generationProfile`
- `seedConfig`
- `themeProfile`
- `districtBounds`
- `roadHierarchy`
- `blockGrid`
- `blockPlacements`
- `connectorRoads`
- `landUseZones`
- `openSpacePlacements`
- `futureReservePlacements`
- `lotCount`
- `validationContract`
- `validationResult`

### Suggested top-level shape

```json
{
  "schemaId": "SUBURBAN_DISTRICT_001",
  "districtId": "SUBURBAN_DISTRICT_001_A",
  "generationProfile": "suburban_district_default",
  "seedConfig": {},
  "themeProfile": {},
  "districtBounds": {},
  "roadHierarchy": {},
  "blockGrid": {},
  "blockPlacements": [],
  "connectorRoads": [],
  "landUseZones": [],
  "openSpacePlacements": [],
  "futureReservePlacements": [],
  "lotCount": 180,
  "validationContract": {},
  "validationResult": {}
}
```

## 6. District Structure Rules

### Required district structure elements

District generation should define:

- district boundary
- block grid
- block connectors
- road hierarchy
- residential zones
- open spaces
- reserve land
- future destination zones

### District boundary

The district boundary should define:

- total district footprint
- edge conditions
- future expansion edges
- staging boundaries for later streaming

### Block grid

The first district implementation should support:

- regular suburban block rows
- irregular edge shaping
- connector alignment between neighbouring blocks
- deterministic rotation where needed

Recommended rules:

- avoid perfect repeated checkerboard patterns
- preserve north-up district logic
- allow limited block rotation only when it preserves road continuity and suburban readability

### Block connectors

Connector rules should define:

- where one street block connects to another
- collector-to-collector alignment
- local-road termination rules
- cul-de-sac isolation rules

Cul-de-sacs should remain internal residential expressions and should not be used as district connectors.

## 7. Road Hierarchy Rules

### Supported hierarchy

The district foundation should support three levels:

1. `local_residential_street`
2. `collector_residential_street`
3. `future_arterial_connection`

### Local roads

Local roads include:

- residential streets
- cul-de-sacs

Purpose:

- direct lot frontage
- neighbourhood-scale traffic
- low-speed residential access

### Collector roads

Collectors:

- connect street blocks
- support district traffic flow
- define major internal suburban movement

Collector rules:

- blocks should align primarily through collector continuity
- collector spacing should remain readable at district scale
- collector intersections should be limited and deterministic

### Future arterial roads

Future arterials are reserved for:

- district edge connections
- future commercial corridors
- higher-order transport spines

This session only reserves their space and alignment logic.

## 8. Block Placement System

### Inputs

District placement should accept:

- `districtSeed`
- `regionSeed`
- `districtThemeSeed`

### Outputs

Each placed block should define:

- `blockInstanceId`
- `streetBlockId`
- `position`
- `rotation`
- `densityProfile`
- `themeProfile`
- `connectorProfile`

### Placement rules

Block placement must be:

- deterministic
- reproducible from seed alone
- compatible with road hierarchy
- controlled against repetitive district-wide patterns

Block placement should also:

- maintain suburban identity
- vary block position and role carefully
- support future edge conditions such as parks or commercial boundaries

### District composition rules

Recommended first district balance:

- most blocks remain low-density residential
- a smaller share border open space or reserve land
- a limited share sit adjacent to future destination edges

## 9. Land Use System

### Supported zone types

District generation should define:

- `RESIDENTIAL_LOW_DENSITY`
- `OPEN_SPACE`
- `PARK_RESERVE`
- `COMMUNITY_ZONE`
- `COMMERCIAL_EDGE_ZONE`

### RESIDENTIAL_LOW_DENSITY

Purpose:

- detached suburban housing

Placement rules:

- dominant district land use
- mapped to most `SUBURBAN_STREET_BLOCK_001` placements
- supports future medium-density edge transitions

### OPEN_SPACE

Purpose:

- visual relief
- green separation
- future walking link support

Placement rules:

- can sit between block clusters
- can buffer future civic or commercial zones

### PARK_RESERVE

Purpose:

- neighbourhood-scale recreation and greenery

Placement rules:

- distributed at readable intervals
- aligned to collector roads or walking connections
- large enough to matter visually and spatially

### COMMUNITY_ZONE

Purpose:

- future schools
- small civic uses
- neighbourhood facilities

Placement rules:

- adjacent to collectors
- buffered from purely interior residential cul-de-sac conditions

### COMMERCIAL_EDGE_ZONE

Purpose:

- future shops
- bakeries
- cafes
- service destinations

Placement rules:

- aligned to collector edges or future arterial connections
- not embedded deeply inside low-density residential interiors

## 10. Park and Open Space Rules

District generation should define:

- park frequency
- reserve placement
- green corridors
- walking connections

Recommended initial rules:

- minimum one meaningful park or reserve per district
- open space may appear as:
  - pocket reserve
  - connector green
  - block-edge relief
- green corridors should support future pedestrian movement between blocks and destinations

## 11. Density System

### Current support

The first district implementation should assume:

- low density detached houses only

### Future medium density support

Reserve contract support for:

- townhouses
- duplexes

### Future higher density support

Reserve contract support for:

- apartments

Density profile should be declared at:

- district level
- block level
- future zone-transition level

## 12. District Validation System

### District checks

District validation must confirm:

- blocks connected
- roads connected
- no overlapping blocks
- district boundary valid

### Land-use checks

Land-use validation must confirm:

- valid zoning
- sensible placement
- open space not stranded
- commercial and community reserves placed on sensible connectors

### Residential checks

Residential validation must confirm:

- density consistency
- deterministic block placement
- suburban identity continuity
- repetition control across neighbouring blocks

### Performance checks

Performance validation should define:

- district LOD strategy
- streaming boundaries
- block-level instance reuse
- preview-safe object budgets

## 13. Future Expansion Path

`SUBURBAN_DISTRICT_001` should explicitly support future expansion for:

- schools
- shopping centres
- railway stations
- parks
- sports fields
- town centres
- coastal estates

Recommended extension path:

1. district contract
2. district machine-readable preview generator
3. district preview adapter
4. district visual preview consumer
5. district inspection pass
6. destination-zone integration

## 14. Readiness for Implementation

This foundation is ready for implementation planning because:

- the street block base unit now has tuned suburban composition
- deterministic road and frontage logic already exists at block level
- land-use and road-hierarchy boundaries are now defined for district assembly
- future destination systems have clear reserved edges rather than needing ad hoc insertion later

Recommended next step:

- create the machine-readable district contract for `SUBURBAN_DISTRICT_001`
- define block placement schema, connector schema, land-use zone schema, and district validation schema
