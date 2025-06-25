export const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.stack)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  return res.status(500).json({ message: "Something went wrong!" })
}
