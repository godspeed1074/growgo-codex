import {
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_DISTANCE_DECIMAL_PLACES,
  CANONICAL_PIN_COORDINATE_DECIMAL_PLACES,
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  type CanonicalBasePin,
  type CanonicalBasePinSource,
  type CanonicalBoundingBox,
  type CanonicalCoordinate
} from "./basePinTypes";
import { formatCanonicalPinId } from "./canonicalPinId";

const EARTH_RADIUS_METRES = 6371008.8;
const ZERO_LENGTH_SEGMENT_EPSILON_METRES = 1e-9;
// Seven-decimal coordinate normalization can shift an exact boundary by a few
// millimetres, so canonical placement allows a tiny deterministic tolerance.
const CANONICAL_BOUNDARY_EPSILON_METRES = 0.01;

export function generateCanonicalPinsForWay(
  source: CanonicalBasePinSource
): CanonicalBasePin[] {
  validateCanonicalSource(source);

  const normalizedCoordinates = normalizeOrderedCoordinates(
    source.orderedCoordinates
  );
  if (normalizedCoordinates.length < 2) {
    throw new RangeError(
      "Canonical pin generation requires at least two distinct ordered coordinates after deterministic duplicate cleanup."
    );
  }

  const pins: CanonicalBasePin[] = [];
  const firstCoordinate = normalizedCoordinates[0];
  pins.push(
    buildCanonicalPin({
      source,
      positionIndex: 0,
      segmentIndex: 0,
      coordinate: firstCoordinate,
      distanceAlongWayMetres: 0
    })
  );

  let nextDistanceTarget = source.spacingMetres;
  let distanceTraversed = 0;
  let positionIndex = 1;

  for (let segmentIndex = 0; segmentIndex < normalizedCoordinates.length - 1; segmentIndex += 1) {
    const start = normalizedCoordinates[segmentIndex];
    const end = normalizedCoordinates[segmentIndex + 1];
    const segmentLength = calculateHaversineDistanceMetres(start, end);

    if (segmentLength <= ZERO_LENGTH_SEGMENT_EPSILON_METRES) {
      continue;
    }

    const segmentStartDistance = distanceTraversed;
    const segmentEndDistance = distanceTraversed + segmentLength;

    while (nextDistanceTarget <= segmentEndDistance + CANONICAL_BOUNDARY_EPSILON_METRES) {
      const distanceIntoSegment = nextDistanceTarget - segmentStartDistance;
      const ratio = clamp(distanceIntoSegment / segmentLength, 0, 1);
      const coordinate = interpolateCoordinate(start, end, ratio);

      pins.push(
        buildCanonicalPin({
          source,
          positionIndex,
          segmentIndex,
          coordinate,
          distanceAlongWayMetres: nextDistanceTarget
        })
      );

      positionIndex += 1;
      nextDistanceTarget += source.spacingMetres;
    }

    distanceTraversed = segmentEndDistance;
  }

  return pins;
}

export function filterCanonicalPinsByBoundingBox(
  pins: readonly CanonicalBasePin[],
  bounds: CanonicalBoundingBox
): CanonicalBasePin[] {
  validateCoordinateRange(bounds.south, "south", -90, 90);
  validateCoordinateRange(bounds.north, "north", -90, 90);
  validateCoordinateRange(bounds.west, "west", -180, 180);
  validateCoordinateRange(bounds.east, "east", -180, 180);

  if (bounds.south > bounds.north) {
    throw new RangeError(
      "Canonical bounding box south must be less than or equal to north."
    );
  }

  if (bounds.west > bounds.east) {
    throw new RangeError(
      "Canonical bounding box west must be less than or equal to east."
    );
  }

  return pins.filter(
    (pin) =>
      pin.latitude >= bounds.south &&
      pin.latitude <= bounds.north &&
      pin.longitude >= bounds.west &&
      pin.longitude <= bounds.east
  );
}

export function calculateHaversineDistanceMetres(
  start: CanonicalCoordinate,
  end: CanonicalCoordinate
): number {
  validateCoordinate(start, "start");
  validateCoordinate(end, "end");

  const latitudeDeltaRadians = toRadians(end.latitude - start.latitude);
  const longitudeDeltaRadians = toRadians(end.longitude - start.longitude);
  const startLatitudeRadians = toRadians(start.latitude);
  const endLatitudeRadians = toRadians(end.latitude);

  const haversineValue =
    Math.sin(latitudeDeltaRadians / 2) ** 2 +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDeltaRadians / 2) ** 2;
  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return normalizeDistance(angularDistance * EARTH_RADIUS_METRES);
}

function buildCanonicalPin(params: {
  source: CanonicalBasePinSource;
  positionIndex: number;
  segmentIndex: number;
  coordinate: CanonicalCoordinate;
  distanceAlongWayMetres: number;
}): CanonicalBasePin {
  return {
    pinId: formatCanonicalPinId({
      generatorVersion: params.source.generatorVersion,
      sourceType: params.source.sourceType,
      sourceId: params.source.sourceId,
      positionIndex: params.positionIndex
    }),
    generatorVersion: params.source.generatorVersion,
    sourceType: params.source.sourceType,
    sourceId: params.source.sourceId,
    positionIndex: params.positionIndex,
    segmentIndex: params.segmentIndex,
    latitude: normalizeCoordinateValue(params.coordinate.latitude),
    longitude: normalizeCoordinateValue(params.coordinate.longitude),
    distanceAlongWayMetres: normalizeDistance(params.distanceAlongWayMetres)
  };
}

function validateCanonicalSource(source: CanonicalBasePinSource): void {
  if (source.generatorVersion !== GROWGO_BASE_PIN_GENERATOR_VERSION) {
    throw new RangeError(
      `Unsupported canonical base-pin generator version: ${String(source.generatorVersion)}.`
    );
  }

  if (source.sourceType !== CANONICAL_BASE_PIN_SOURCE_TYPE) {
    throw new TypeError(
      `Unsupported canonical base-pin source type: ${String(source.sourceType)}.`
    );
  }

  if (source.spacingMetres !== CANONICAL_V1_BASE_PIN_SPACING_METRES) {
    throw new RangeError(
      `Canonical base-pin spacing must remain locked to ${CANONICAL_V1_BASE_PIN_SPACING_METRES} metres for generator version 1.`
    );
  }

  if (!Array.isArray(source.orderedCoordinates)) {
    throw new TypeError(
      "Canonical base-pin orderedCoordinates must be an array."
    );
  }
}

function normalizeOrderedCoordinates(
  coordinates: readonly CanonicalCoordinate[]
): CanonicalCoordinate[] {
  const normalized: CanonicalCoordinate[] = [];

  for (const coordinate of coordinates) {
    validateCoordinate(coordinate, "orderedCoordinates entry");

    const nextCoordinate = {
      latitude: normalizeCoordinateValue(coordinate.latitude),
      longitude: normalizeCoordinateValue(coordinate.longitude)
    };
    const previousCoordinate = normalized[normalized.length - 1];

    if (
      previousCoordinate &&
      previousCoordinate.latitude === nextCoordinate.latitude &&
      previousCoordinate.longitude === nextCoordinate.longitude
    ) {
      continue;
    }

    normalized.push(nextCoordinate);
  }

  return normalized;
}

function validateCoordinate(coordinate: CanonicalCoordinate, label: string): void {
  if (!coordinate || typeof coordinate !== "object") {
    throw new TypeError(`${label} must be an object with latitude and longitude.`);
  }

  validateCoordinateRange(coordinate.latitude, `${label}.latitude`, -90, 90);
  validateCoordinateRange(
    coordinate.longitude,
    `${label}.longitude`,
    -180,
    180
  );
}

function validateCoordinateRange(
  value: number,
  label: string,
  min: number,
  max: number
): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }

  if (value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}.`);
  }
}

function interpolateCoordinate(
  start: CanonicalCoordinate,
  end: CanonicalCoordinate,
  ratio: number
): CanonicalCoordinate {
  return {
    latitude: normalizeCoordinateValue(
      start.latitude + (end.latitude - start.latitude) * ratio
    ),
    longitude: normalizeCoordinateValue(
      start.longitude + (end.longitude - start.longitude) * ratio
    )
  };
}

function normalizeCoordinateValue(value: number): number {
  return Number(value.toFixed(CANONICAL_PIN_COORDINATE_DECIMAL_PLACES));
}

function normalizeDistance(value: number): number {
  return Number(value.toFixed(CANONICAL_DISTANCE_DECIMAL_PLACES));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
