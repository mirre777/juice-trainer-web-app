import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  if (!date) return "Unknown Date"

  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return "Unknown Date"

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
