// Placeholder for lib/api.ts
export const api = {
  get: async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "API request failed")
    }
    return response.json()
  },
  // Add other methods like post, put, delete as needed
}
