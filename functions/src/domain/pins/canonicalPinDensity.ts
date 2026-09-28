import { calculateHaversineDistanceMetres } from "./canonicalPinGenerator";
import type { CanonicalBasePin } from "./basePinTypes";

// Canonical pins are placed every 50m along an individual road. This separate
// rule prevents roads that run close together from creating visual clusters.
export const CANONICAL_V1_MINIMUM_PIN_SEPARATION_METRES = 46 as const;

const BUCKETS_PER_DEGREE = 2_000;
const METRES_PER_LATITUDE_DEGREE = 111_320;

export function filterCanonicalPinsByMinimumSeparation(
  pins: readonly CanonicalBasePin[],
  minimumSeparationMetres = CANONICAL_V1_MINIMUM_PIN_SEPARATION_METRES,
  isPriorityPin?: (pin: CanonicalBasePin) => boolean
): CanonicalBasePin[] {
  if (
    !Number.isFinite(minimumSeparationMetres) ||
    minimumSeparationMetres <= 0
  ) {
    throw new RangeError("Minimum pin separation must be a positive finite number.");
  }

  const accepted: CanonicalBasePin[] = [];
  const buckets = new Map<string, CanonicalBasePin[]>();
  const orderedPins = [...pins].sort((left, right) => {
    const priorityDifference = Number(Boolean(isPriorityPin?.(right))) -
      Number(Boolean(isPriorityPin?.(left)));
    return priorityDifference || left.pinId.localeCompare(right.pinId);
  });

  for (const candidate of orderedPins) {
    const latitudeBucket = Math.floor(candidate.latitude * BUCKETS_PER_DEGREE);
    const longitudeBucket = Math.floor(candidate.longitude * BUCKETS_PER_DEGREE);
    const latitudeRange = Math.max(
      1,
      Math.ceil(
        minimumSeparationMetres /
          (METRES_PER_LATITUDE_DEGREE / BUCKETS_PER_DEGREE)
      )
    );
    const longitudeBucketMetres = Math.max(
      0.01,
      (Math.cos((candidate.latitude * Math.PI) / 180) *
        METRES_PER_LATITUDE_DEGREE) /
        BUCKETS_PER_DEGREE
    );
    const longitudeRange = Math.min(
      20,
      Math.max(1, Math.ceil(minimumSeparationMetres / longitudeBucketMetres))
    );

    if (
      hasNearbyAcceptedPin({
        candidate,
        buckets,
        latitudeBucket,
        longitudeBucket,
        latitudeRange,
        longitudeRange,
        minimumSeparationMetres
      })
    ) {
      continue;
    }

    const key = getBucketKey(latitudeBucket, longitudeBucket);
    const bucket = buckets.get(key) ?? [];
    bucket.push(candidate);
    buckets.set(key, bucket);
    accepted.push(candidate);
  }

  return accepted;
}

function hasNearbyAcceptedPin(params: {
  candidate: CanonicalBasePin;
  buckets: ReadonlyMap<string, readonly CanonicalBasePin[]>;
  latitudeBucket: number;
  longitudeBucket: number;
  latitudeRange: number;
  longitudeRange: number;
  minimumSeparationMetres: number;
}): boolean {
  for (
    let latitudeOffset = -params.latitudeRange;
    latitudeOffset <= params.latitudeRange;
    latitudeOffset += 1
  ) {
    for (
      let longitudeOffset = -params.longitudeRange;
      longitudeOffset <= params.longitudeRange;
      longitudeOffset += 1
    ) {
      const bucket = params.buckets.get(
        getBucketKey(
          params.latitudeBucket + latitudeOffset,
          params.longitudeBucket + longitudeOffset
        )
      );
      if (!bucket) continue;

      for (const acceptedPin of bucket) {
        if (
          calculateHaversineDistanceMetres(
            {
              latitude: params.candidate.latitude,
              longitude: params.candidate.longitude
            },
            {
              latitude: acceptedPin.latitude,
              longitude: acceptedPin.longitude
            }
          ) < params.minimumSeparationMetres
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function getBucketKey(latitudeBucket: number, longitudeBucket: number): string {
  return `${latitudeBucket}:${longitudeBucket}`;
}
