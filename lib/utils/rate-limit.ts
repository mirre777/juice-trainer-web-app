import { createError, ErrorType } from "@/lib/utils/error-handler"
import type { NextApiResponse } from "next"
import { LRUCache } from "lru-cache"

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

function getIP(req: any): string {
  return req.ip || req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.connection.remoteAddress
}

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (res: NextApiResponse, limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) as number | undefined
        if (tokenCount === undefined) {
          tokenCache.set(token, 1)
        } else if (tokenCount < limit) {
          tokenCache.set(token, tokenCount + 1)
        } else {
          return reject(createError("Too Many Requests", ErrorType.TOO_MANY_REQUESTS))
        }

        resolve()
      }),
  }
}
