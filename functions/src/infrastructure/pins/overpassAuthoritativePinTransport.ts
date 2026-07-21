import type {
  AuthoritativeSourceAcquisitionReference,
  AuthoritativeSourceClock,
  AuthoritativeSourceTransport,
  AuthoritativeSourceTransportResult
} from "../../domain/pins/authoritativePinAcquisitionTypes";
import {
  buildOverpassWayQuery,
  buildTransportedSourceFromParsedGeometry,
  parseOverpassAuthoritativeWayResponse
} from "./overpassAuthoritativePinParser";

export const OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS =
  5000 as const;

export interface AuthoritativeHttpClient {
  request(input: {
    url: string;
    method: "POST";
    headers: Record<string, string>;
    body: string;
    timeoutMilliseconds: number;
  }): Promise<{
    status: number;
    headers: Record<string, string | undefined>;
    body: unknown;
  }>;
}

export interface OverpassAuthoritativePinTransportDependencies {
  httpClient: AuthoritativeHttpClient;
  endpoint: string | null;
  enabled: boolean;
  clock: AuthoritativeSourceClock;
  timeoutMilliseconds: number;
}

export function createOverpassAuthoritativePinTransport(
  dependencies: OverpassAuthoritativePinTransportDependencies
): AuthoritativeSourceTransport {
  return {
    async fetchSource(
      reference: AuthoritativeSourceAcquisitionReference
    ): Promise<AuthoritativeSourceTransportResult> {
      if (!dependencies.enabled || !dependencies.endpoint) {
        return {
          ok: false,
          code: "transport-failed",
          retryable: true
        };
      }

      let response;
      try {
        response = await dependencies.httpClient.request({
          url: dependencies.endpoint,
          method: "POST",
          headers: {
            "content-type": "text/plain"
          },
          body: buildOverpassWayQuery({
            sourceId: reference.sourceId,
            timeoutMilliseconds: dependencies.timeoutMilliseconds
          }),
          timeoutMilliseconds: dependencies.timeoutMilliseconds
        });
      } catch {
        return {
          ok: false,
          code: "transport-failed",
          retryable: true
        };
      }

      if (response.status === 404) {
        return { ok: false, code: "not-found", retryable: false };
      }

      if (response.status === 408) {
        return { ok: false, code: "timeout", retryable: true };
      }

      if (response.status === 429) {
        return {
          ok: false,
          code: "rate-limited",
          retryable: true,
          retryAfterSeconds: parseRetryAfterSeconds(response.headers)
        };
      }

      if (response.status >= 500 && response.status <= 599) {
        return { ok: false, code: "transport-failed", retryable: true };
      }

      if (response.status !== 200) {
        return { ok: false, code: "transport-failed", retryable: false };
      }

      const parsed = parseOverpassAuthoritativeWayResponse({
        reference,
        body: response.body
      });
      if (!parsed.ok) {
        return parsed;
      }

      return {
        ok: true,
        source: buildTransportedSourceFromParsedGeometry({
          reference,
          parsedGeometry: parsed.geometry,
          fetchedAt: dependencies.clock.now().toISOString()
        })
      };
    }
  };
}

function parseRetryAfterSeconds(
  headers: Record<string, string | undefined>
): number {
  const rawValue = headers["retry-after"] ?? headers["Retry-After"] ?? "";
  const parsed = Number.parseInt(String(rawValue), 10);

  if (!Number.isFinite(parsed)) {
    return 60;
  }

  return Math.max(60, Math.min(6 * 60 * 60, parsed));
}
