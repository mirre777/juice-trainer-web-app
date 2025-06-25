import { createError, ErrorType } from "@/lib/utils/error-handler"

export const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.stack)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorType: err.errorType,
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    })
  }

  // Handle unexpected errors
  const unexpectedError = createError(ErrorType.INTERNAL_SERVER_ERROR, "Internal Server Error", 500, "error")

  return res.status(unexpectedError.statusCode).json({
    status: unexpectedError.status,
    message: unexpectedError.message,
    errorType: unexpectedError.errorType,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  })
}
