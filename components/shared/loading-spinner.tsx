export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen bg-white items-center justify-center">
      <div className="w-16 h-16 border-4 border-lime-300 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
