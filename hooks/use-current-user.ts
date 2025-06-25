import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "@/lib/actions/user"

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    onError: (error) => {
      console.error("Error fetching current user:", error)
    },
  })
}
