"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"

interface PersonalRecord {
  exercise: string
  weight: string | number
  reps: string | number
  date: string
  isPR?: boolean
}

interface PersonalRecordsDisplayProps {
  records: PersonalRecord[]
  title?: string
}

export function PersonalRecordsDisplay({ records, title = "Recent Personal Records" }: PersonalRecordsDisplayProps) {
  const personalRecordsRef = useRef<HTMLDivElement>(null)
  const [recordsOverflow, setRecordsOverflow] = useState(false)

  // Check for overflow on mount and resize
  useEffect(() => {
    const checkOverflow = () => {
      if (personalRecordsRef.current) {
        const container = personalRecordsRef.current
        setRecordsOverflow(container.scrollWidth > container.clientWidth)
      }
    }

    checkOverflow()
    window.addEventListener("resize", checkOverflow)

    return () => {
      window.removeEventListener("resize", checkOverflow)
    }
  }, [records.length])

  // Scroll functions for the containers
  const scrollRecords = (direction: "left" | "right") => {
    if (personalRecordsRef.current) {
      const container = personalRecordsRef.current
      const scrollAmount = 300 // Adjust as needed

      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  return (
    <>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative">
        <div
          ref={personalRecordsRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {records.map((record, index) => (
            <div key={index} className="flex-shrink-0 border border-gray-200 rounded-lg p-4 w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{record.exercise || "N/A"}</h4>
                {record.isPR && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
              <p className="text-2xl font-bold mb-1">{record.weight || "N/A"}</p>
              <p className="text-sm text-gray-500 mb-2">{record.reps || "N/A"} reps</p>
              <p className="text-xs text-gray-400">{record.date || "N/A"}</p>
            </div>
          ))}
        </div>

        {recordsOverflow && (
          <>
            <button
              className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
              onClick={() => scrollRecords("left")}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
              onClick={() => scrollRecords("right")}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}
      </div>
    </>
  )
}
