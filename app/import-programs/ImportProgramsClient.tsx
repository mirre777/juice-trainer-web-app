import type React from "react"
import { LoadingSpinner } from "@/components/shared/loading-spinner" // Updated import

type ImportProgramsClientProps = {}

const ImportProgramsClient: React.FC<ImportProgramsClientProps> = ({}) => {
  return (
    <div>
      <h1>Import Programs</h1>
      <p>This is the import programs client component.</p>
      <LoadingSpinner />
    </div>
  )
}

export default ImportProgramsClient
