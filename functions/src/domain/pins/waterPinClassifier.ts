import type { CanonicalBasePin, CanonicalCoordinate } from "./basePinTypes";

// Keep this aligned with the original map rule: a road pin becomes a water pin
// when it is inside a mapped water area or within 50m of mapped water.
export const WATER_PIN_DISTANCE_METRES = 50 as const;

export interface WaterFeature {
  orderedCoordinates: readonly CanonicalCoordinate[];
  closed: boolean;
}

export type NearbyPinType = "base" | "water";

export interface ClassifiedNearbyPin extends CanonicalBasePin {
  type: NearbyPinType;
}

export function classifyCanonicalPinsByWater(
  pins: readonly CanonicalBasePin[],
  waterFeatures: readonly WaterFeature[]
): ClassifiedNearbyPin[] {
  return pins.map((pin) => ({
    ...pin,
    type: isCoordinateNearWater(
      { latitude: pin.latitude, longitude: pin.longitude },
      waterFeatures
    )
      ? "water"
      : "base"
  }));
}

export function isCoordinateNearWater(
  coordinate: CanonicalCoordinate,
  waterFeatures: readonly WaterFeature[]
): boolean {
  return waterFeatures.some((feature) => {
    if (feature.orderedCoordinates.length < 2) return false;

    if (
      feature.closed &&
      isCoordinateInsidePolygon(coordinate, feature.orderedCoordinates)
    ) {
      return true;
    }

    return (
      getDistanceToCoordinatePathMetres(coordinate, feature.orderedCoordinates) <=
      WATER_PIN_DISTANCE_METRES
    );
  });
}

function getDistanceToCoordinatePathMetres(
  coordinate: CanonicalCoordinate,
  path: readonly CanonicalCoordinate[]
): number {
  let closest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < path.length - 1; index += 1) {
    const distance = getDistanceToSegmentMetres(
      coordinate,
      path[index],
      path[index + 1]
    );
    closest = Math.min(closest, distance);

    if (closest <= WATER_PIN_DISTANCE_METRES) return closest;
  }

  return closest;
}

function getDistanceToSegmentMetres(
  point: CanonicalCoordinate,
  start: CanonicalCoordinate,
  end: CanonicalCoordinate
): number {
  const centerLatitude = (point.latitude + start.latitude + end.latitude) / 3;
  const metresPerLatitudeDegree = 111_320;
  const metresPerLongitudeDegree =
    Math.cos((centerLatitude * Math.PI) / 180) * metresPerLatitudeDegree;
  const pointX = point.longitude * metresPerLongitudeDegree;
  const pointY = point.latitude * metresPerLatitudeDegree;
  const startX = start.longitude * metresPerLongitudeDegree;
  const startY = start.latitude * metresPerLatitudeDegree;
  const endX = end.longitude * metresPerLongitudeDegree;
  const endY = end.latitude * metresPerLatitudeDegree;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSquared === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  const progress = Math.max(
    0,
    Math.min(
      1,
      ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
        segmentLengthSquared
    )
  );
  const closestX = startX + progress * deltaX;
  const closestY = startY + progress * deltaY;

  return Math.hypot(pointX - closestX, pointY - closestY);
}

function isCoordinateInsidePolygon(
  point: CanonicalCoordinate,
  polygon: readonly CanonicalCoordinate[]
): boolean {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    const intersects =
      (current.latitude > point.latitude) !==
        (prior.latitude > point.latitude) &&
      point.longitude <
        ((prior.longitude - current.longitude) *
          (point.latitude - current.latitude)) /
          (prior.latitude - current.latitude || 1e-12) +
          current.longitude;

    if (intersects) inside = !inside;
  }

  return inside;
}
