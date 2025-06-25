"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser } from "@/lib/actions/user.actions"

export const useCurrentUser = () => {
  const session = useSession()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true)
      try {
        if (session?.data?.user?.email) {
          const fetchedUser = await getCurrentUser(session?.data?.user?.email)
          setUser(fetchedUser)
        }
      } catch (error: any) {
        console.error("Error fetching current user:", error)
        toast({
          title: "Error fetching user",
          description: error?.message || "Failed to fetch user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [session, toast])

  return { user, isLoading }
}
