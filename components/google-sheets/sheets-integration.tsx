"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileSpreadsheet, Check, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SheetsIntegrationProps = {
  isConnected: boolean
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  lastSynced?: Date | null
  onSync: () => Promise<void>
}

export function SheetsIntegration({
  isConnected = false,
  onConnect,
  onDisconnect,
  lastSynced,
  onSync,
}: SheetsIntegrationProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await onConnect()
      toast({
        title: "Google Sheets connected",
        description: "Your Google Sheets has been successfully connected.",
      })
    } catch (error) {
      console.error("Failed to connect Google Sheets:", error)
      toast({
        title: "Connection failed",
        description: "There was an error connecting Google Sheets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await onDisconnect()
      setShowDisconnectDialog(false)
      toast({
        title: "Google Sheets disconnected",
        description: "Your Google Sheets has been disconnected.",
      })
    } catch (error) {
      console.error("Failed to disconnect Google Sheets:", error)
      toast({
        title: "Disconnection failed",
        description: "There was an error disconnecting Google Sheets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync()
      toast({
        title: "Google Sheets synced",
        description: "Your workout programs have been imported successfully.",
      })
    } catch (error) {
      console.error("Failed to sync Google Sheets:", error)
      toast({
        title: "Sync failed",
        description: "There was an error importing from Google Sheets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>Connect your Google Sheets to import workout programs</CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Google Sheets connected</span>
              </div>
              {lastSynced && (
                <p className="text-sm text-muted-foreground">Last imported: {lastSynced.toLocaleString()}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Google account to import workout programs from Google Sheets.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <>
              <Button variant="outline" onClick={() => setShowDisconnectDialog(true)} disabled={isLoading || isSyncing}>
                Disconnect
              </Button>
              <Button onClick={handleSync} disabled={isLoading || isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Import Now
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Google Sheets"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Sheets</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect Google Sheets? You will no longer be able to import workout programs
              without reconnecting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
