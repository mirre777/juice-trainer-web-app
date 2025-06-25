// Placeholder for lib/api.ts
export const api = {
  get: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "API request failed")
    }
    return res.json()
  },
  // Add other methods (post, put, delete) as needed
}
