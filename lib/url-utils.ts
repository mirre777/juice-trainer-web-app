/**
 * Normalizes a URL by removing trailing slashes
 * @param url The URL to normalize
 * @returns The normalized URL without trailing slashes
 */
export function normalizeUrl(url: string): string {
  if (!url) return ""
  // Log for debugging
  console.log("normalizeUrl input:", url)
  const normalized = url.endsWith("/") ? url.slice(0, -1) : url
  console.log("normalizeUrl output:", normalized)
  return normalized
}

/**
 * Joins URL parts safely without creating double slashes
 * @param base The base URL
 * @param path The path to append
 * @returns The joined URL without double slashes
 */
export function joinUrl(base: string, path: string): string {
  // Log for debugging
  console.log("joinUrl inputs - base:", base, "path:", path)
  const normalizedBase = normalizeUrl(base)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const joined = `${normalizedBase}${normalizedPath}`
  console.log("joinUrl output:", joined)
  return joined
}
