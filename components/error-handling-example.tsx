"use client"

import React, { useState } from "react"
import type { AppError } from "@/lib/utils/error-handler"

interface Props {
  children: React.ReactNode
}

const ErrorHandlingExample = ({ children }: Props) => {
  const [error, setError] = useState<AppError | null>(null)

  const handleError = (err: AppError) => {
    setError(err)
  }

  if (error) {
    return (
      <div>
        <h1>An error occurred:</h1>
        <p>{error.message}</p>
        {error.details && <p>Details: {error.details}</p>}
        <button onClick={() => setError(null)}>Clear Error</button>
      </div>
    )
  }

  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { handleError: handleError })
        }
        return child
      })}
    </div>
  )
}

export default ErrorHandlingExample
