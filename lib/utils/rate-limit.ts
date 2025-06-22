export interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval: number
}

interface RateLimiterResponse {
  check: (limit: number, token: string) => Promise<void>
}

// Simple in-memory rate limiter
export function rateLimit(options: RateLimitOptions): RateLimiterResponse {
  const tokenCache = new Map<string, number[]>()

  // Clean up old entries every interval
  setInterval(() => {
    const now = Date.now()
    for (const [token, timestamps] of tokenCache.entries()) {
      const validTimestamps = timestamps.filter((timestamp) => now - timestamp < options.interval)
      if (validTimestamps.length === 0) {
        tokenCache.delete(token)
      } else {
        tokenCache.set(token, validTimestamps)
      }
    }
  }, options.interval)

  return {
    check: (limit: number, token: string) => {
      const now = Date.now()
      const timestamps = tokenCache.get(token) || []
      const validTimestamps = timestamps.filter((timestamp) => now - timestamp < options.interval)

      if (validTimestamps.length >= limit) {
        return Promise.reject(new Error("Rate limit exceeded"))
      }

      tokenCache.set(token, [...validTimestamps, now])
      return Promise.resolve()
    },
  }
}
