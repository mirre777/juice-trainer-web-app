"use client"

import { useState } from "react"
import { ProgramProvider } from "@/contexts/program-context"
import ProgramEditor from "@/components/programs/program-editor"
import ProgramPreview from "@/components/programs/program-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewProgramDialog from "@/components/programs/new-program-dialog"
import { useToast } from "@/hooks/use-toast"
import { SheetsIntegration } from "@/components/google-sheets/sheets-integration"
import type React from "react"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"

interface ProgramsPageLayoutProps {
  children?: React.ReactNode
  className?: string
  isDemo?: boolean
}

export function ProgramsPageLayout({ children, className = "", isDemo = false }: ProgramsPageLayoutProps) {
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("programs")
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [currentProgram, setCurrentProgram] = useState<any>(null)
  const [isGoogleSheetsConnected, setIsGoogleSheetsConnected] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const handleConnectGoogleSheets = async () => {
    try {
      setIsConnecting(true)
      const response = await fetch("/api/auth/google/sheets-auth")

      if (!response.ok) {
        throw new Error("Failed to initiate Google authentication")
      }

      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error("Error connecting to Google Sheets:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to Google Sheets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogleSheets = async () => {
    try {
      setIsGoogleSheetsConnected(false)
      setLastSynced(null)
      return Promise.resolve()
    } catch (error) {
      console.error("Error disconnecting from Google Sheets:", error)
      return Promise.reject(error)
    }
  }

  const handleSyncGoogleSheets = async () => {
    try {
      setLastSynced(new Date())
      return Promise.resolve()
    } catch (error) {
      console.error("Error syncing with Google Sheets:", error)
      return Promise.reject(error)
    }
  }

  const handlePreviewProgram = () => {
    const sampleProgram = {
      program_title: "6-Week Strength Building",
      program_weeks: 6,
      routine_count: 4,
      program_notes:
        "Focus on progressive overload. Increase weights by 5% each week if all reps are completed with good form.",
      routines: [
        {
          routine_name: "Upper Body A",
          exercises: [
            {
              exercise: "Bench Press",
              exercise_category: "Push",
              exercise_notes: "Keep shoulders retracted",
              exercise_video: "https://example.com/bench-press",
              weeks: [
                {
                  week_number: 1,
                  set_count: 3,
                  sets: [
                    { reps: "8", rpe: "7", rest: "90s", notes: "", warmup: false },
                    { reps: "8", rpe: "7", rest: "90s", notes: "", warmup: false },
                    { reps: "8", rpe: "7", rest: "90s", notes: "", warmup: false },
                  ],
                },
                {
                  week_number: 2,
                  set_count: 3,
                  sets: [
                    { reps: "8", rpe: "7.5", rest: "90s", notes: "", warmup: false },
                    { reps: "8", rpe: "7.5", rest: "90s", notes: "", warmup: false },
                    { reps: "8", rpe: "7.5", rest: "90s", notes: "", warmup: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    setCurrentProgram(sampleProgram)
    setShowPreview(true)
  }

  return (
    <ComingSoonOverlay message="Programs Coming Soon">
      <div>
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowNewProgramDialog(true)}
            className="h-16 px-6 py-4 bg-[#D2FF28] rounded-lg flex items-center gap-3 text-lg font-medium"
          >
            <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Create New Program</span>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-md">
            <TabsTrigger value="programs" className="rounded-sm">
              Programs
            </TabsTrigger>
            <TabsTrigger value="import" className="rounded-sm">
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <ProgramProvider>
              {showPreview ? (
                <ProgramPreview program={currentProgram} onClose={() => setShowPreview(false)} />
              ) : (
                <>
                  <ProgramEditor hideNewProgramDialog={true} />
                  <NewProgramDialog open={showNewProgramDialog} onOpenChange={setShowNewProgramDialog} />
                </>
              )}
            </ProgramProvider>
          </TabsContent>

          <TabsContent value="import">
            <div className="max-w-3xl mx-auto">
              <SheetsIntegration
                isConnected={isGoogleSheetsConnected}
                onConnect={handleConnectGoogleSheets}
                onDisconnect={handleDisconnectGoogleSheets}
                lastSynced={lastSynced}
                onSync={handleSyncGoogleSheets}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ComingSoonOverlay>
  )
}
