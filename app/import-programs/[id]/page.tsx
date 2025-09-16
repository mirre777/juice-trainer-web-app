"use client"
import { notFound } from "next/navigation"
import ReviewProgramClient from "./review-program-client"
import { ImportProgram } from "@/lib/firebase/program/types"
import { useEffect, useState, use } from "react"

const getImportData = async (id: string): Promise<ImportProgram | null> => {
  try {
    console.log(`[getImportData] Fetching import data for ID: ${id}`)

    // Check environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${baseUrl}/api/trainer-program/${id}`
    console.log("Full URL:", url)

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[getImportData] API Error ${response.status}:`, errorText)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text()
      console.error(`[getImportData] Expected JSON but got:`, contentType)
      console.error(`[getImportData] Response body:`, responseText.substring(0, 500))
      return null
    }

    const data = await response.json()
    console.log("Successfully fetched program data:", data)
    return data
  } catch (error) {
    console.error("[getImportData] Network or other error:", error)
    return null
  }
}

export default function ReviewProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  if (!id) {
    notFound()
  }

  console.log(`[ReviewProgramPage] Loading page for import ID: ${id}`)

  // Fetch import data and clients in parallel
  const [importData, setImportData] = useState<ImportProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getImportData(id)
        if (!data) {
          console.log(`[ReviewProgramPage] No import data found for ID: ${id}`)
          setError("Program not found")
          return
        }

        setImportData(data)
        console.log(`[ReviewProgramPage] Successfully loaded import data:`, {
          id: data.id,
          name: data.name,
          status: data.status,
        })
      } catch (err) {
        console.error("[ReviewProgramPage] Error fetching data:", err)
        setError("Failed to load program data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading program...</div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  // Show not found if no data
  if (!importData) {
    notFound()
  }

  return <ReviewProgramClient importData={importData} importId={id} />
}
