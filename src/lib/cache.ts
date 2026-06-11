/**
 * In-memory TTL cache with stale-while-revalidate semantics.
 * All upstream data sources are accessed through this so the app
 * never hammers NSE/Yahoo and never blocks the UI on a slow refresh.
 */

interface Entry<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
  refreshing: boolean;
}

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  staleFactor = 20
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as Entry<T> | undefined;

  if (entry && now < entry.freshUntil) return entry.value;

  if (entry && now < entry.staleUntil) {
    // Serve stale immediately, refresh in background.
    if (!entry.refreshing) {
      entry.refreshing = true;
      fetcher()
        .then((value) => {
          store.set(key, {
            value,
            freshUntil: Date.now() + ttlMs,
            staleUntil: Date.now() + ttlMs * staleFactor,
            refreshing: false,
          });
        })
        .catch(() => {
          entry.refreshing = false;
        });
    }
    return entry.value;
  }

  const value = await fetcher();
  store.set(key, {
    value,
    freshUntil: now + ttlMs,
    staleUntil: now + ttlMs * staleFactor,
    refreshing: false,
  });
  return value;
}

/** Try sources in order; first one that resolves wins. */
export async function firstOf<T>(
  attempts: Array<() => Promise<T>>
): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("All sources failed");
}
