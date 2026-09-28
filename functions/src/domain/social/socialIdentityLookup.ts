export interface SocialIdentity {
  publicCode: string;
  name: string;
  avatarUrl: string | null;
}

/** Only called with UIDs from the caller's already-authorised social entries.
 * Cache public identity, never relationship permissions or full player data. */
export function createSocialIdentityLookup(
  load: (uids: string[]) => Promise<Map<string, SocialIdentity | null>>,
  now: () => number = Date.now
) {
  const cache = new Map<string, { value: SocialIdentity | null; expiresAt: number }>();
  const pending = new Map<string, Promise<SocialIdentity | null>>();
  return async (uids: string[]) => {
    const unique = [...new Set(uids)];
    const missing = unique.filter(uid => !pending.has(uid) && (cache.get(uid)?.expiresAt ?? 0) <= now());
    for (let i = 0; i < missing.length; i += 100) {
      const batch = missing.slice(i, i + 100);
      const loading = Promise.resolve().then(() => load(batch));
      for (const uid of batch) {
        const identity = loading.then(result => {
          const value = result.get(uid) ?? null;
          cache.delete(uid);
          cache.set(uid, { value, expiresAt: now() + 60_000 });
          while (cache.size > 2_048) cache.delete(cache.keys().next().value!);
          return value;
        }).finally(() => { pending.delete(uid); });
        pending.set(uid, identity);
      }
    }
    return new Map(await Promise.all(unique.map(async uid => [uid,
      pending.has(uid) ? await pending.get(uid)! : cache.get(uid)?.value ?? null
    ] as const)));
  };
}
