import LoadingSpinner from "@/components/shared/loading-spinner"

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
