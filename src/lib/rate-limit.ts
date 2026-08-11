interface RateLimitEntry {
  count: number
  windowStart: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  cleanupIntervalMs?: number
  keyPrefix?: string
}

export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, cleanupIntervalMs = 5 * 60_000, keyPrefix = '' } = config
  const store = new Map<string, RateLimitEntry>()
  let lastCleanup = 0

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < cleanupIntervalMs) return
    lastCleanup = now
    for (const [key, entry] of store) {
      if (now - entry.windowStart > windowMs) {
        store.delete(key)
      }
    }
  }

  function check(key: string): boolean {
    cleanup()
    const now = Date.now()
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key
    const entry = store.get(fullKey)
    if (!entry || now - entry.windowStart > windowMs) {
      store.set(fullKey, { count: 1, windowStart: now })
      return true
    }
    if (entry.count >= maxRequests) return false
    entry.count++
    return true
  }

  return { check }
}
