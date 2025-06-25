import LoadingSpinner from "@/components/shared/loading-spinner"

export default function Loading() {
  return (
    <div className="h-full flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
