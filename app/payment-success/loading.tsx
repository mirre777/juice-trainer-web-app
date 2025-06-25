import LoadingSpinner from "@/components/shared/loading-spinner"

export default function Loading() {
  // You can add any UI inside Loading, including a skeleton.
  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner />
    </div>
  )
}
