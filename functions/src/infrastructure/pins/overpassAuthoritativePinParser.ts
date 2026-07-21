import {
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  type CanonicalCoordinate
} from "../../domain/pins/basePinTypes";
import type {
  AuthoritativeSourceAcquisitionReference,
  AuthoritativeTransportedPinSource
} from "../../domain/pins/authoritativePinAcquisitionTypes";

export interface ParsedOverpassWayGeometry {
  orderedCoordinates: CanonicalCoordinate[];
}

export type OverpassAuthoritativeWayParseResult =
  | {
      ok: true;
      geometry: ParsedOverpassWayGeometry;
    }
  | {
      ok: false;
      code: "invalid-response" | "not-found" | "source-incomplete";
      retryable: boolean;
    };

export function validateOverpassWaySourceId(sourceId: string): void {
  if (!/^[1-9]\d{0,18}$/.test(sourceId)) {
    throw new TypeError(
      "Authoritative OSM way sourceId must be a positive decimal integer string."
    );
  }
}

export function buildOverpassWayQuery(params: {
  sourceId: string;
  timeoutMilliseconds: number;
}): string {
  validateOverpassWaySourceId(params.sourceId);

  const timeoutSeconds = Math.max(
    1,
    Math.floor(params.timeoutMilliseconds / 1000)
  );

  return `[out:json][timeout:${timeoutSeconds}];\nway(${params.sourceId});\nout geom;`;
}

export function parseOverpassAuthoritativeWayResponse(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  body: unknown;
}): OverpassAuthoritativeWayParseResult {
  const root = params.body as
    | {
        elements?: unknown;
        remark?: unknown;
      }
    | null;
  if (!root || typeof root !== "object") {
    return { ok: false, code: "invalid-response", retryable: false };
  }

  if (typeof root.remark === "string" && /partial/i.test(root.remark)) {
    return { ok: false, code: "source-incomplete", retryable: true };
  }

  if (!Array.isArray(root.elements)) {
    return { ok: false, code: "invalid-response", retryable: false };
  }

  const matchingWays = root.elements.filter((element) => {
    const typed = element as { type?: unknown; id?: unknown } | null;
    return (
      typed &&
      typed.type === "way" &&
      String(typed.id ?? "") === params.reference.sourceId
    );
  });

  if (matchingWays.length === 0) {
    return { ok: false, code: "not-found", retryable: false };
  }

  if (matchingWays.length !== 1) {
    return { ok: false, code: "invalid-response", retryable: false };
  }

  const matchingWay = matchingWays[0] as {
    geometry?: unknown;
  };
  if (!Array.isArray(matchingWay.geometry)) {
    return { ok: false, code: "invalid-response", retryable: false };
  }

  if (matchingWay.geometry.length === 0) {
    return { ok: false, code: "source-incomplete", retryable: false };
  }

  const orderedCoordinates: CanonicalCoordinate[] = [];
  for (const coordinate of matchingWay.geometry) {
    const typed = coordinate as { lat?: unknown; lon?: unknown } | null;
    if (
      !typed ||
      typeof typed.lat !== "number" ||
      typeof typed.lon !== "number" ||
      !Number.isFinite(typed.lat) ||
      !Number.isFinite(typed.lon)
    ) {
      return { ok: false, code: "invalid-response", retryable: false };
    }

    if (
      typed.lat < -90 ||
      typed.lat > 90 ||
      typed.lon < -180 ||
      typed.lon > 180
    ) {
      return { ok: false, code: "invalid-response", retryable: false };
    }

    orderedCoordinates.push({
      latitude: typed.lat,
      longitude: typed.lon
    });
  }

  return {
    ok: true,
    geometry: {
      orderedCoordinates
    }
  };
}

export function buildTransportedSourceFromParsedGeometry(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  parsedGeometry: ParsedOverpassWayGeometry;
  fetchedAt: string;
}): AuthoritativeTransportedPinSource {
  return {
    generatorVersion: params.reference.generatorVersion,
    sourceType: params.reference.sourceType,
    sourceId: params.reference.sourceId,
    orderedCoordinates: params.parsedGeometry.orderedCoordinates,
    spacingMetres: CANONICAL_V1_BASE_PIN_SPACING_METRES,
    fetchedAt: params.fetchedAt
  };
}
