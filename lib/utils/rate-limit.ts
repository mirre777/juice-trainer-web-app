import { LRUCache } from "lru-cache"
import type { AppError } from "@/lib/utils/error-handler"

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    async check(
      limit: number,
      token: string,
    ): Promise<
      | {
          success: true
        }
      | {
          success: false
          error: AppError
        }
    > {
      const tokenCount: (number | undefined)[] = tokenCache.get(token) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1])
      } else {
        tokenCache.set(token, [tokenCount[0]! + 1])
      }

      const currentUsage = tokenCache.get(token)

      return currentUsage![0]! > limit
        ? {
            success: false,
            error: {
              message: "Too many requests",
              status: 429,
            },
          }
        : {
            success: true,
          }
    },
  }
}
