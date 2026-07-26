# GROWGO SESSION 62 — TOWN LAYOUT FOUNDATION

## Session Scope

This session defines the procedural foundation for:

- `TOWN_LAYOUT_001`

Purpose:

- procedural Australian town generation framework

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create new buildings
- create new modules
- create final town scenes
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This foundation is based on:

- `GROWGO_SESSION_61_SECOND_SUBURBAN_DISTRICT_VISUAL_INSPECTION_REPORT.md`
- `GROWGO_SESSION_55_SUBURBAN_DISTRICT_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_56_MACHINE_READABLE_SUBURBAN_DISTRICT_CONTRACT.md`
- existing Asset Factory, neighbourhood, and district generation patterns

Continuity rules:

- `SUBURBAN_DISTRICT_001` is the first approved town-scale residential district unit
- town generation must extend the neighbourhood and district stack rather than replacing it
- deterministic generation from seed remains mandatory
- district seam, pedestrian, green-space, and reserve logic must carry upward into town composition
- town layout must remain machine-readable before any future full-scene preview or Blender town assembly work

## 2. Town Goal

`TOWN_LAYOUT_001` must define a complete procedural Australian town framework that combines:

- residential districts
- commercial centres
- civic reserves
- transport corridors
- park and recreation systems
- landmark support
- future service and industrial edges
- rural or landscape transitions

The first town framework should support:

- coherent district relationships
- density gradients from edge to centre
- accessible destinations
- deterministic road and transport structure
- future multi-district expansion without breaking validation or streaming boundaries

## 3. Town Definition

### System ID

- `TOWN_LAYOUT_001`

### Purpose

`TOWN_LAYOUT_001` is the first machine-readable town framework that arranges multiple validated districts and town-scale zones into a coherent Australian settlement pattern.

### Core responsibilities

- place multiple district units deterministically
- define the relationship between town centre, residential districts, civic areas, and transport routes
- reserve land for future commercial, civic, industrial, and landmark growth
- preserve accessibility between homes, destinations, and open space
- validate town composition before any future town preview consumer or scene assembly step

## 4. Town Structure

The town framework should combine:

- suburban districts
- coastal districts
- mixed residential districts
- future higher-density districts
- town centre
- commercial strips
- civic reserve zones
- transport corridors
- open space and park systems
- landmark placements
- industrial and service edges
- rural transition edges

### Structural principle

Towns should read as layered settlement systems rather than flat grids.

Recommended structure order:

1. Town centre or main street anchor
2. Connected commercial and civic support zones
3. Residential district rings or corridors
4. Open space and recreation distribution
5. Transport and service edges
6. Landscape or rural edge transition

## 5. District System

Town composition should grow from:

- `SUBURBAN_DISTRICT_001`

Initial town support should include:

- `RESIDENTIAL_DISTRICT_SUBURBAN`
- `RESIDENTIAL_DISTRICT_COASTAL`
- `RESIDENTIAL_DISTRICT_MIXED`
- `RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY`

### District rules

District placement must define:

- district ID
- district type
- district position
- district rotation
- district theme
- connector relationships
- density role
- streaming boundary

### District relationship rules

- residential districts should connect through collector and arterial systems
- coastal districts should prefer landmark, tourism, and open-space adjacency
- mixed districts should bridge centre and suburban edges
- future medium-density districts should sit closer to centres or major transport corridors

### Density gradient rules

Recommended progression:

- outer edge: low density suburban or rural fringe
- middle ring: suburban or mixed neighbourhood districts
- near centre: mixed-use, civic, and future medium-density support
- centre: highest destination intensity, not necessarily highest residential density in the first framework

## 6. Town Centre System

### Zone ID

- `TOWN_CENTRE_ZONE_001`

### Purpose

Primary activity anchor for the town.

### Required support

- shops
- cafes
- bakeries
- civic buildings
- pedestrian-focused areas
- plazas
- landmark anchors

### Centre rules

- town centre should sit on the strongest internal accessibility spine
- commercial and civic access should be shared where practical
- pedestrian movement should be prioritized over low-value through-traffic in the core
- town centre should connect clearly to commercial strips and civic reserves

### Centre placement rules

- prefer central or near-central town position
- require collector or arterial access
- require pedestrian links from at least two residential district directions
- support future transport stop or station adjacency

## 7. Commercial System

### Supported commercial zones

- `COMMERCIAL_STRIP_001`
- `TOWN_MAIN_STREET_001`

### Purpose

Provide town-scale retail and service frontage outside or alongside the town centre.

### Commercial strip rules

- should align with collector or arterial frontage
- should support parking and pedestrian access
- should connect to residential districts without isolating them
- should act as transition between town centre intensity and district-scale living areas

### Main street rules

- should act as a highly legible commercial identity spine
- should support cafes, bakeries, retail, and town services
- should connect to plazas, landmarks, and civic frontages
- should remain readable as a destination, not just a traffic corridor

## 8. Civic System

### Civic reserve purpose

Reserve positions for:

- schools
- libraries
- community centres
- police and fire services
- healthcare

### Civic rules

- civic reserves should sit on accessible collector or arterial routes
- major civic uses should not be buried inside dead-end residential districts
- school and community reserves should connect to pedestrian systems and open space where possible
- emergency and healthcare reserves should support clear road access

### Scope control

- no civic asset creation in this session
- only reserve logic and placement rules

## 9. Transport System

The town layout must define:

- local roads
- collector roads
- arterial roads
- bus corridors
- railway corridors
- future station reserves

### Transport hierarchy rules

#### Local roads

- district-internal frontage and neighbourhood access

#### Collector roads

- connect districts to centres and services

#### Arterial roads

- carry town-scale movement
- support commercial edges and future expansion

#### Bus corridors

- should connect residential districts to centre and civic zones
- should prefer collector and arterial alignments

#### Railway corridors

- reserved for future expansion
- should not cut through key residential cores without structure

#### Future station support

- station reserves should prefer town centre edge, transport spine, or district junction locations

## 10. Park And Recreation System

The town framework should define:

- neighbourhood parks
- district parks
- sports fields
- playground zones
- walking trails
- green corridors

### Recreation rules

- every town should contain distributed open space, not a single isolated park
- green corridors should connect districts, parks, and civic or landmark destinations where practical
- sports fields should prefer edge or large-lot positions with collector access
- playground and park systems should remain accessible from residential districts by pedestrian links

## 11. Landmark System

The town framework should support placement logic for:

- historical landmarks
- tourist locations
- natural landmarks
- unique town identity features

### Landmark rules

- landmarks should strengthen town readability from overview scale
- landmarks may align with centre, coastline, ridge, transport node, or tourism edge
- landmarks should not block basic transport or district structure
- landmarks should serve as future anchor points for preview and navigation systems

## 12. Industrial And Service Edge Support

Town layout should reserve future support for:

- industrial areas
- warehouses
- service yards
- utilities
- depot or maintenance areas

### Edge rules

- industrial and service zones should prefer town edge or corridor adjacency
- they should not interrupt pedestrian core areas
- they should support future freight or arterial access

## 13. Rural Edge And Landscape Transition

The first town framework should support:

- rural transition edges
- coastal edge transitions
- scenic green buffers
- future agricultural or undeveloped fringe logic

### Edge rules

- towns should not terminate abruptly into blank procedural space
- edge conditions should indicate future expansion or landscape transition
- tourist and coastal towns should allow stronger landmark and open-space relationships at the edge

## 14. Density Profiles

### `SMALL_COASTAL_TOWN`

Purpose:

- lower population coastal settlement with tourism and landmark emphasis

Recommended characteristics:

- district count: `2-4`
- commercial intensity: `medium`
- transport intensity: `low`
- open space allocation: `high`
- centre role: compact main street or waterfront centre

### `REGIONAL_TOWN`

Purpose:

- balanced inland or regional service town

Recommended characteristics:

- district count: `3-6`
- commercial intensity: `medium-high`
- transport intensity: `medium`
- open space allocation: `medium`
- centre role: clear town centre plus supporting commercial strip

### `SUBURBAN_CITY_EDGE`

Purpose:

- outer metropolitan or city-edge suburban expansion

Recommended characteristics:

- district count: `4-8`
- commercial intensity: `medium`
- transport intensity: `high`
- open space allocation: `medium`
- centre role: distributed centres with strong corridor logic

### `TOURIST_TOWN`

Purpose:

- destination-oriented town with stronger landmark and visitor focus

Recommended characteristics:

- district count: `2-5`
- commercial intensity: `high`
- transport intensity: `medium`
- open space allocation: `high`
- centre role: visitor-facing main street and landmark cluster

## 15. Suggested Machine-Readable Town Contract

### System schema ID

- `TOWN_LAYOUT_001`

### Recommended supporting schema set

- `TOWN_DISTRICT_INSTANCE_001`
- `TOWN_CENTRE_ZONE_INSTANCE_001`
- `COMMERCIAL_ZONE_INSTANCE_001`
- `CIVIC_RESERVE_INSTANCE_001`
- `TRANSPORT_CORRIDOR_INSTANCE_001`
- `PARK_RECREATION_INSTANCE_001`
- `LANDMARK_RESERVE_INSTANCE_001`
- `TOWN_VALIDATION_001`

### Required top-level fields

- `schemaId`
- `townId`
- `generationProfile`
- `seedConfig`
- `townThemeProfile`
- `townBounds`
- `districtPlacements`
- `townCentreZones`
- `commercialZones`
- `civicReserves`
- `transportCorridors`
- `parkRecreationPlacements`
- `landmarkPlacements`
- `serviceEdgeZones`
- `ruralTransitionZones`
- `validationContract`
- `validationResult`

### Suggested shape

```json
{
  "schemaId": "TOWN_LAYOUT_001",
  "townId": "TOWN_LAYOUT_001_A",
  "generationProfile": "regional_town_default",
  "seedConfig": {},
  "townThemeProfile": {},
  "townBounds": {},
  "districtPlacements": [],
  "townCentreZones": [],
  "commercialZones": [],
  "civicReserves": [],
  "transportCorridors": [],
  "parkRecreationPlacements": [],
  "landmarkPlacements": [],
  "serviceEdgeZones": [],
  "ruralTransitionZones": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 16. Validation System

Town validation must check:

### Town structure

- districts connected
- centre reachable
- road hierarchy connected
- no impossible overlaps

### Land use

- balanced distribution
- centre intensity appropriate to profile
- commercial and civic reserves logically placed
- parks and recreation not isolated

### Player experience

- destinations accessible
- exploration routes available
- landmarks legible from overview planning scale
- no dead-end settlement logic for core destinations

### Performance

- streaming boundaries defined
- instance reuse preserved
- LOD strategy compatible with district and block composition
- town assembly does not require duplicate geometry generation

## 17. Future Expansion Support

The framework should explicitly support future growth into:

- cities
- airports
- ports
- universities
- industrial areas
- railway networks
- larger suburbs

Important:

- these are support targets only
- no implementation or asset creation in this session

## 18. Readiness

Status:

- `READY FOR MACHINE-READABLE TOWN CONTRACT DESIGN`

Meaning:

- district-scale logic is now strong enough to serve as a town building block
- the next step can formalize town schemas and deterministic placement systems
- centre, civic, transport, park, landmark, and edge systems now have a clear planning foundation
