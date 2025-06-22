/**
 * Utility functions for date handling
 */

// Get day of week (0 = Monday, 6 = Sunday)
export function getDayOfWeek(date: Date | string | any): number | null {
  try {
    let dateObj: Date

    // Handle Firebase Timestamp
    if (date && typeof date === "object" && date.seconds) {
      dateObj = new Date(date.seconds * 1000)
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date
    }
    // Handle string date (including formats like "28 May 2025")
    else if (typeof date === "string") {
      // Try to parse various date formats
      dateObj = new Date(date)

      // If that fails, try some common formats
      if (isNaN(dateObj.getTime())) {
        // Try parsing formats like "28 May 2025", "May 28, 2025", etc.
        const cleanedDate = date.replace(/(\d+)(st|nd|rd|th)/g, "$1") // Remove ordinals like "28th"
        dateObj = new Date(cleanedDate)
      }
    }
    // Handle timestamp numbers
    else if (typeof date === "number") {
      dateObj = new Date(date)
    }
    // Unknown format
    else {
      console.warn("Unknown date format:", date)
      return null
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date)
      return null
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    // Convert to (0 = Monday, 6 = Sunday)
    const day = dateObj.getDay()
    return day === 0 ? 6 : day - 1
  } catch (error) {
    console.error("Error getting day of week:", error, "for date:", date)
    return null
  }
}

// Get day name from day of week
export function getDayName(dayOfWeek: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  return days[dayOfWeek] || ""
}

// Format date to display format
export function formatDate(date: Date | string | any): string {
  try {
    let dateObj: Date

    // Handle Firebase Timestamp
    if (date && typeof date === "object" && date.seconds) {
      dateObj = new Date(date.seconds * 1000)
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date
    }
    // Handle string date
    else if (typeof date === "string") {
      dateObj = new Date(date)
    }
    // Unknown format
    else {
      return "Invalid date"
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid date"
    }

    // Format date: "Jan 1, 2023"
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error formatting date"
  }
}

// Get week range (Monday - Sunday) for a given date
export function getWeekRange(date: Date | string | any): { start: Date; end: Date } | null {
  try {
    let dateObj: Date

    // Handle Firebase Timestamp
    if (date && typeof date === "object" && date.seconds) {
      dateObj = new Date(date.seconds * 1000)
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date
    }
    // Handle string date
    else if (typeof date === "string") {
      dateObj = new Date(date)
    }
    // Unknown format
    else {
      console.warn("Unknown date format:", date)
      return null
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date)
      return null
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const day = dateObj.getDay()

    // Calculate days to Monday (start of week)
    const daysToMonday = day === 0 ? 6 : day - 1

    // Calculate start and end of week
    const start = new Date(dateObj)
    start.setDate(dateObj.getDate() - daysToMonday)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  } catch (error) {
    console.error("Error getting week range:", error)
    return null
  }
}

/**
 * Extract date from workout title or description
 * Handles formats like "oompa loompa date 28 may 2025"
 */
export function extractDateFromText(text: string): Date | null {
  try {
    // Common date patterns
    const patterns = [
      // "28 May 2025", "28th May 2025"
      /(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
      // "May 28, 2025"
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/i,
      // "2025-05-28", "2025/05/28"
      /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
      // "28-05-2025", "28/05/2025"
      /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const dateStr = match[0].replace(/(\d+)(st|nd|rd|th)/g, "$1") // Remove ordinals
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error extracting date from text:", error)
    return null
  }
}
