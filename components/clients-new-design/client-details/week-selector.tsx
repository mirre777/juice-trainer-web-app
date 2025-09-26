"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { clientsPageStyles } from "../../../app/clients/styles"

interface WeekSelectorProps {
  currentStartOfWeek: Date
  onWeekChange: (newWeek: Date) => void
  canGoForward: boolean
}

export function WeekSelector({ currentStartOfWeek, onWeekChange, canGoForward }: WeekSelectorProps) {
  
  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date)
    const endOfWeek = new Date(date)

    // Set to Monday (start of week)
    const dayOfWeek = startOfWeek.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday)

    // Set to Sunday (end of week)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' })
    const startDay = startOfWeek.getDate()
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
    const endDay = endOfWeek.getDate()

    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
  }

  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentStartOfWeek)
    previousWeek.setDate(previousWeek.getDate() - 7)
    onWeekChange(previousWeek)
  }

  const goToNextWeek = () => {
    if (!canGoForward) return

    const nextWeek = new Date(currentStartOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    onWeekChange(nextWeek)
  }

  return (
    <div className={clientsPageStyles.weekSelectorContainer}>
      <div className={clientsPageStyles.weekSelectorContent}>
        <button
          onClick={goToPreviousWeek}
          className={clientsPageStyles.weekSelectorButton}
          aria-label="Previous week"
        >
          <ChevronLeft className={clientsPageStyles.weekSelectorIcon} />
        </button>

        <div className={clientsPageStyles.weekSelectorDisplay}>
          {formatWeekRange(currentStartOfWeek)}
        </div>

        <button
          onClick={goToNextWeek}
          disabled={!canGoForward}
          className={`${clientsPageStyles.weekSelectorButton} ${!canGoForward ? clientsPageStyles.weekSelectorButtonDisabled : ''}`}
          aria-label="Next week"
        >
          <ChevronRight className={clientsPageStyles.weekSelectorIcon} />
        </button>
      </div>
    </div>
  )
}
