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
import { Calendar, Check, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type CalendarIntegrationProps = {
  isConnected: boolean
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  lastSynced?: Date | null
  onSync: () => Promise<void>
}

export function CalendarIntegration({
  isConnected = false,
  onConnect,
  onDisconnect,
  lastSynced,
  onSync,
}: CalendarIntegrationProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await onConnect()
      toast({
        title: "Calendar connected",
        description: "Your Google Calendar has been successfully connected.",
      })
    } catch (error) {
      console.error("Failed to connect calendar:", error)
      toast({
        title: "Connection failed",
        description: "There was an error connecting your calendar. Please try again.",
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
        title: "Calendar disconnected",
        description: "Your Google Calendar has been disconnected.",
      })
    } catch (error) {
      console.error("Failed to disconnect calendar:", error)
      toast({
        title: "Disconnection failed",
        description: "There was an error disconnecting your calendar. Please try again.",
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
        title: "Calendar synced",
        description: "Your calendar events have been synced successfully.",
      })
    } catch (error) {
      console.error("Failed to sync calendar:", error)
      toast({
        title: "Sync failed",
        description: "There was an error syncing your calendar. Please try again.",
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
            <Calendar className="mr-2 h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>Connect your Google Calendar to sync and manage your sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Google Calendar connected</span>
              </div>
              {lastSynced && (
                <p className="text-sm text-muted-foreground">Last synced: {lastSynced.toLocaleString()}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to automatically sync your coaching sessions.
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
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
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
                "Connect Google Calendar"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Calendar</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your Google Calendar? Your existing synced events will remain, but no
              new events will be synced.
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
