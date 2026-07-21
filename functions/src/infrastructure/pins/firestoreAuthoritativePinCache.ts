import { createHash } from "node:crypto";

import type {
  AuthoritativeSourceAcquisitionReference,
  AuthoritativeSourceCache,
  AuthoritativeSourceCacheRecord
} from "../../domain/pins/authoritativePinAcquisitionTypes";
import {
  validateAuthoritativeSourceCacheRecord
} from "../../domain/pins/authoritativePinCache";

export const AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME =
  "authoritativePinSourcesV1" as const;
export const AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION = 1 as const;

export interface FirestoreAuthoritativeSourceCacheDependencies {
  firestore: {
    collection(name: string): {
      doc(documentId: string): {
        get(): Promise<{ exists: boolean; data(): unknown }>;
        set(value: unknown): Promise<void>;
      };
    };
  };
  collectionName: string;
  readsEnabled: boolean;
  writesEnabled: boolean;
}

export function buildAuthoritativeSourceCacheDocumentId(
  reference: AuthoritativeSourceAcquisitionReference
): string {
  const digest = createHash("sha256")
    .update(
      `${reference.generatorVersion}|${reference.sourceType}|${reference.sourceId}`,
      "utf8"
    )
    .digest("hex")
    .slice(0, 40);

  return `${reference.sourceType}-v${reference.generatorVersion}-${digest}`;
}

export function createFirestoreAuthoritativeSourceCache(
  dependencies: FirestoreAuthoritativeSourceCacheDependencies
): AuthoritativeSourceCache {
  return {
    async read(
      reference: AuthoritativeSourceAcquisitionReference
    ): Promise<AuthoritativeSourceCacheRecord | null> {
      if (!dependencies.readsEnabled) {
        return null;
      }

      try {
        const snapshot = await dependencies.firestore
          .collection(dependencies.collectionName)
          .doc(buildAuthoritativeSourceCacheDocumentId(reference))
          .get();

        if (!snapshot.exists) {
          return null;
        }

        const stored = snapshot.data() as
          | {
              storageSchemaVersion?: unknown;
              cacheRecord?: unknown;
            }
          | null;

        if (
          !stored ||
          stored.storageSchemaVersion !==
            AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION
        ) {
          return null;
        }

        const validation = validateAuthoritativeSourceCacheRecord({
          reference,
          record: stored.cacheRecord as AuthoritativeSourceCacheRecord
        });

        return validation.ok ? validation.record : null;
      } catch {
        return null;
      }
    },

    async write(
      reference: AuthoritativeSourceAcquisitionReference,
      record: AuthoritativeSourceCacheRecord
    ): Promise<void> {
      if (!dependencies.writesEnabled) {
        return;
      }

      const validation = validateAuthoritativeSourceCacheRecord({
        reference,
        record
      });
      if (!validation.ok) {
        return;
      }

      try {
        await dependencies.firestore
          .collection(dependencies.collectionName)
          .doc(buildAuthoritativeSourceCacheDocumentId(reference))
          .set({
            storageSchemaVersion:
              AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
            cacheRecord: validation.record
          });
      } catch {
        return;
      }
    }
  };
}
