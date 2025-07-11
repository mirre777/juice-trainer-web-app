"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Process the error
    const appError = handleClientError(error, {
      component: "ErrorBoundary",
      operation: "componentDidCatch",
      message: "Component error caught by boundary",
      errorType: ErrorType.UI_ERROR,
      context: { componentStack: errorInfo.componentStack },
    })

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo)
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      if (typeof fallback === "function") {
        return fallback(error, this.resetError)
      }

      if (fallback) {
        return fallback
      }

      // Default fallback UI
      return (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="mt-2 text-sm text-red-700">{error.message}</p>
          <button
            onClick={this.resetError}
            className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded"
          >
            Try again
          </button>
        </div>
      )
    }

    return children
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component"

  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`
  return WrappedComponent
}
