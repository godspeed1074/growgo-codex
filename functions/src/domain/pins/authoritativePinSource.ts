import {
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  type CanonicalCoordinate
} from "./basePinTypes";
import {
  acquireAuthoritativePinSource
} from "./authoritativePinAcquisition";
import type {
  AuthoritativeSourceAcquisitionGates,
  AuthoritativeSourceAcquisitionPolicy,
  AuthoritativeSourceCache,
  AuthoritativeSourceClock,
  AuthoritativeSourceTransport
} from "./authoritativePinAcquisitionTypes";

export type CanonicalPinSourceReference = {
  generatorVersion: typeof GROWGO_BASE_PIN_GENERATOR_VERSION;
  sourceType: typeof CANONICAL_BASE_PIN_SOURCE_TYPE;
  sourceId: string;
};

export type AuthoritativePinSourceGeometry = CanonicalPinSourceReference & {
  orderedCoordinates: CanonicalCoordinate[];
  spacingMetres: typeof CANONICAL_V1_BASE_PIN_SPACING_METRES;
};

export interface AuthoritativePinSourceProvider {
  getSourceGeometry(
    reference: CanonicalPinSourceReference
  ): Promise<AuthoritativePinSourceGeometry | null>;
}

export interface AuthoritativePinSourceProviderDependencies {
  acquisitionGates: AuthoritativeSourceAcquisitionGates;
  transport: AuthoritativeSourceTransport;
  cache: AuthoritativeSourceCache;
  clock: AuthoritativeSourceClock;
  policy: AuthoritativeSourceAcquisitionPolicy;
}

export function createAuthoritativePinSourceProvider(
  dependencies: AuthoritativePinSourceProviderDependencies
): AuthoritativePinSourceProvider {
  return {
    async getSourceGeometry(
      reference: CanonicalPinSourceReference
    ): Promise<AuthoritativePinSourceGeometry | null> {
      if (!dependencies.acquisitionGates.enabled) {
        return null;
      }

      const result = await acquireAuthoritativePinSource({
        reference,
        transport: dependencies.transport,
        cache: dependencies.cache,
        clock: dependencies.clock,
        policy: dependencies.policy,
        gates: dependencies.acquisitionGates
      });

      if (!result.ok) {
        return null;
      }

      return result.source;
    }
  };
}

export function createUnavailableAuthoritativePinSourceProvider():
  AuthoritativePinSourceProvider {
  return {
    async getSourceGeometry(): Promise<AuthoritativePinSourceGeometry | null> {
      return null;
    }
  };
}
