"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { User, LogOut, Trash2 } from "lucide-react"
import { PageLayout } from "@/components/shared/page-layout"
import { LogoutModal } from "@/components/auth/logout-modal"

export default function SettingsPageClient() {
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingData(true)
      setSaveMessage("")

      try {
        console.log("🔍 Fetching user data from /api/auth/me...")
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("📡 API Response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("✅ User data from API:", data)

          setInviteCode(data.universalInviteCode || "")
          setUserData({
            name: data.name || "",
            email: data.email || "",
            phone: "", // Not available in current API response
          })
          setSaveMessage("") // Clear any previous error messages
        } else {
          const errorData = await response.json()
          console.error("❌ API Error:", errorData)

          if (response.status === 401) {
            setSaveMessage("Authentication failed. Please log in again.")
          } else if (response.status === 500) {
            setSaveMessage(`Server error: ${errorData.details || errorData.error}`)
          } else {
            setSaveMessage(`Failed to load user data: ${errorData.error}`)
          }
        }
      } catch (error) {
        console.error("💥 Network error:", error)
        setSaveMessage("Network error loading user data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveChanges = async () => {
    setIsLoading(true)
    setSaveMessage("")

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          universalInviteCode: inviteCode,
        }),
      })

      if (response.ok) {
        setSaveMessage("Changes saved successfully!")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        const errorData = await response.json()
        let errorMessage =
          errorData.error?.message || errorData.error || "An unknown error occurred while saving changes."

        // Check for the specific "invite code is already taken" message
        if (errorMessage.includes("invite code is already taken")) {
          errorMessage = "Sorry, your last rep failed. This invite code is already taken."
        }

        setSaveMessage(`Error: ${errorMessage}`)
      }
    } catch (error) {
      setSaveMessage("Error saving changes")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout title="Settings" description="Manage your account preferences">
      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled={true}
                      onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter your invite code (max 10 characters)"
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Share this code with clients: {typeof window !== "undefined" ? window.location.origin : ""}
                      /invite/
                      {inviteCode || "YOUR_CODE"}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-black text-white" onClick={handleSaveChanges} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                  {saveMessage && (
                    <p
                      className={`text-sm ${saveMessage.includes("Error") || saveMessage.includes("Failed") || saveMessage.includes("Authentication") || saveMessage.includes("Server") ? "text-red-600" : "text-green-600"}`}
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <h3 className="font-medium">Log Out</h3>
                    <p className="text-sm text-gray-500">Sign out of your account</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setShowLogoutModal(true)}
                >
                  Log Out
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md border-red-200 bg-red-50">
                <div className="flex items-center">
                  <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                  <div>
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={() => setShowDeleteAccountModal(true)}
                >
                  Delete
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccountModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive">Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Modal */}
      <LogoutModal open={showLogoutModal} onOpenChange={setShowLogoutModal} />
    </PageLayout>
  )
}
