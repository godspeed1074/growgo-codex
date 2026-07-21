export const GROWGO_BASE_PIN_GENERATOR_VERSION = 1 as const;
// Canonical generator version 1 remains inactive, so its spacing definition is
// safely corrected in place to 50 metres before any visible or persisted pin activation.
export const CANONICAL_V1_BASE_PIN_SPACING_METRES = 50 as const;
export const GROWGO_CAPTURE_RADIUS_METRES = 100 as const;
export const CANONICAL_BASE_PIN_SOURCE_TYPE = "osm-way" as const;
export const CANONICAL_BASE_PIN_ID_NAMESPACE = "ggpin" as const;
export const LEGACY_COORDINATE_PIN_GENERATOR_VERSION = 0 as const;
export const MAX_CANONICAL_PIN_ID_LENGTH = 64 as const;
export const MAX_CANONICAL_SOURCE_ID_LENGTH = 19 as const;
export const CANONICAL_PIN_COORDINATE_DECIMAL_PLACES = 7 as const;
export const CANONICAL_DISTANCE_DECIMAL_PLACES = 6 as const;

export type CanonicalBasePinSourceType = typeof CANONICAL_BASE_PIN_SOURCE_TYPE;

export interface CanonicalCoordinate {
  latitude: number;
  longitude: number;
}

export interface CanonicalBasePinSource {
  generatorVersion: typeof GROWGO_BASE_PIN_GENERATOR_VERSION;
  sourceType: CanonicalBasePinSourceType;
  sourceId: string;
  orderedCoordinates: CanonicalCoordinate[];
  spacingMetres: typeof CANONICAL_V1_BASE_PIN_SPACING_METRES;
}

export interface CanonicalBasePinIdentity {
  pinId: string;
  generatorVersion: typeof GROWGO_BASE_PIN_GENERATOR_VERSION;
  sourceType: CanonicalBasePinSourceType;
  sourceId: string;
  positionIndex: number;
}

export interface CanonicalBasePin extends CanonicalBasePinIdentity {
  segmentIndex: number;
  latitude: number;
  longitude: number;
  distanceAlongWayMetres: number;
}

export interface CanonicalBoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ParseableCanonicalPinId {
  generatorVersion: typeof GROWGO_BASE_PIN_GENERATOR_VERSION;
  sourceType: CanonicalBasePinSourceType;
  sourceId: string;
  positionIndex: number;
}
