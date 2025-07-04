"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { db, auth } from "@/lib/firebase/firebase"

interface DataItem {
  id: string
  [key: string]: any
}

interface ApiResponse<T> {
  data: T[] | null
  loading: boolean
  error: string | null
}

interface ApiHookOptions {
  orderByField?: string
  orderByDirection?: "asc" | "desc"
  limitResults?: number
  whereField?: string
  whereOperator?: "<" | "<=" | "==" | "!=" | ">=" | ">"
  whereValue?: any
}

function useClientDataApi<T extends DataItem>(collectionName: string, options: ApiHookOptions = {}): ApiResponse<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [user] = useAuthState(auth)

  useEffect(() => {
    if (!user) {
      setData(null)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        let q = collection(db, collectionName)

        // Apply where clause if provided
        if (options.whereField && options.whereOperator && options.whereValue) {
          q = query(q, where(options.whereField, options.whereOperator, options.whereValue))
        }

        // Apply order by if provided
        if (options.orderByField && options.orderByDirection) {
          q = query(q, orderBy(options.orderByField, options.orderByDirection))
        }

        // Apply limit if provided
        if (options.limitResults) {
          q = query(q, limit(options.limitResults))
        }

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const newData: T[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as T[]
            setData(newData)
            setLoading(false)
          },
          (err) => {
            setError(err.message)
            setLoading(false)
          },
        )

        return () => unsubscribe()
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    return fetchData()
  }, [
    collectionName,
    user,
    options.orderByField,
    options.orderByDirection,
    options.limitResults,
    options.whereField,
    options.whereOperator,
    options.whereValue,
  ])

  return { data, loading, error }
}

export default useClientDataApi
