"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { ProgramExercise } from "@/types/workout-program"

interface MuscleGroupSelectorProps {
  exercise: ProgramExercise
  routineIndex: number
  exerciseIndex: number
  onFieldUpdate: (routineIndex: number, exerciseIndex: number, field: string, value: any) => void
}

export enum MuscleGroup {
  BACK = "Back",
  BICEPS = "Biceps",
  CALVES = "Calves",
  CHEST = "Chest",
  CORE = "Core",
  FOREARMS = "Forearms",
  GLUTES = "Glutes",
  HAMSTRINGS = "Hamstrings",
  SHOULDERS = "Shoulders",
  QUADS = "Quads",
  TRICEPS = "Triceps",
  OTHER = "Other",
}

export function MuscleGroupSelector({
  exercise,
  routineIndex,
  exerciseIndex,
  onFieldUpdate,
}: MuscleGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const primaryMuscleGroup = exercise.muscleGroup || ""
  const secondaryMuscleGroups = exercise.secondaryMuscleGroup || []

  const handleMuscleGroupClick = (group: string) => {
    // If clicking the primary muscle group, clear it and promote first secondary to primary
    if (group === primaryMuscleGroup) {
      if (secondaryMuscleGroups.length > 0) {
        // Promote first secondary to primary
        const newPrimary = secondaryMuscleGroups[0]
        const remainingSecondary = secondaryMuscleGroups.slice(1)
        onFieldUpdate(routineIndex, exerciseIndex, "muscleGroup", newPrimary)
        onFieldUpdate(routineIndex, exerciseIndex, "secondaryMuscleGroup", remainingSecondary)
      } else {
        // No secondary groups, just clear primary
        onFieldUpdate(routineIndex, exerciseIndex, "muscleGroup", "")
      }
      return
    }

    // If clicking a secondary muscle group, remove it
    if (secondaryMuscleGroups.includes(group)) {
      const updatedSecondary = secondaryMuscleGroups.filter(g => g !== group)
      onFieldUpdate(routineIndex, exerciseIndex, "secondaryMuscleGroup", updatedSecondary)
      return
    }

    // If no primary muscle group is selected, make this the primary
    if (!primaryMuscleGroup) {
      onFieldUpdate(routineIndex, exerciseIndex, "muscleGroup", group)
      return
    }

    // If primary is selected, add this as secondary
    const updatedSecondary = [...secondaryMuscleGroups, group]
    onFieldUpdate(routineIndex, exerciseIndex, "secondaryMuscleGroup", updatedSecondary)
  }

  const getDisplayText = () => {
    const allGroups = [primaryMuscleGroup, ...secondaryMuscleGroups].filter(Boolean)

    if (allGroups.length === 0) {
      return "Select muscle groups"
    }

    if (allGroups.length <= 3) {
      return allGroups.join(", ")
    }

    // Show first 3 groups + ellipsis
    const firstThree = allGroups.slice(0, 3)
    return `${firstThree.join(", ")}...`
  }


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
      >
        {getDisplayText()}
        <ChevronDown className="ml-1 h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Muscle Groups</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(MuscleGroup).map((group) => {
                const isPrimary = group === primaryMuscleGroup
                const isSecondary = secondaryMuscleGroups.includes(group)
                const isSelected = isPrimary || isSecondary

                // Determine the number/priority
                let number = ""
                if (isPrimary) {
                  number = "1"
                } else if (isSecondary) {
                  const index = secondaryMuscleGroups.indexOf(group)
                  number = (index + 2).toString()
                }

                return (
                  <button
                    key={group}
                    onClick={() => handleMuscleGroupClick(group)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span>{group}</span>
                    {number && (
                      <span className="ml-2 text-xs font-bold bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center">
                        {number}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Clear All Button */}
            <div className="mt-4 pt-3 border-t">
              <button
                onClick={() => {
                  onFieldUpdate(routineIndex, exerciseIndex, "muscleGroup", "")
                  onFieldUpdate(routineIndex, exerciseIndex, "secondaryMuscleGroup", [])
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all selections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
