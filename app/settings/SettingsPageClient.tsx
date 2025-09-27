"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { LogOut, Trash2, Users, X } from "lucide-react"
import { PageLayout } from "@/components/shared/page-layout"
import { LogoutModal } from "@/components/auth/logout-modal"
import { ClientStatus } from "@/types/client"

export default function SettingsPageClient() {
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [clientCount, setClientCount] = useState(0)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [subscriptionPlan, setSubscriptionPlan] = useState("trainer_basic")

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

          fetchClientCount()
          setInviteCode(data.universalInviteCode || "")
          setUserData({
            name: data.name || "",
            email: data.email || "",
            phone: "", // Not available in current API response
          })
          setSubscriptionPlan(data.subscriptionPlan || "trainer_basic")
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

  const fetchClientCount = async () => {
    const response = await fetch("/api/clients", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data = await response.json()
    const clients = data.clients
    // count clients with status "Active"
    const activeClients = clients.filter((client: any) => client.status === ClientStatus.Active)
    setClientCount(activeClients.length)
  }

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

  const getClientCapacity = () => {
    return subscriptionPlan === "trainer_basic" ? 3 :
           subscriptionPlan === "trainer_pro" ? 10 :
           subscriptionPlan === "trainer_elite" ? 25 :
           3
  }

  const calculateSubscriptionProgress = () => {
    const progress = (clientCount / getClientCapacity()) * 100
    if (progress > 100) {
      return 100
    }
    if (progress < 0) {
      return 0
    }
    return progress
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    setSaveMessage("")

    try {
      // Check if user has more than 3 active clients
      if (clientCount > 3) {
        setSaveMessage(`Cannot cancel subscription. You currently have ${clientCount} active clients, but the Basic plan only allows 3 clients. Please remove ${clientCount - 3} client(s) before cancelling your subscription.`)
        setShowCancelSubscriptionModal(false)
        setIsLoading(false)
        // Clear message after 8 seconds (longer for this important message)
        setTimeout(() => setSaveMessage(""), 8000)
        return
      }

      // Get current user ID
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("User not authenticated")
      }

      const userData = await response.json()
      const userId = userData.uid

      // Call API to cancel subscription (downgrade to basic)
      const cancelResponse = await fetch("/api/payments/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId: subscriptionPlan, // Downgrade to basic plan
        }),
      })

      const cancelData = await cancelResponse.json()

      if (!cancelResponse.ok) {
        throw new Error(cancelData.error || "Failed to cancel subscription")
      }

      setSaveMessage("Subscription cancelled successfully. You've been downgraded to the Basic plan.")
      setSubscriptionPlan("trainer_basic")
      setShowCancelSubscriptionModal(false)

      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(""), 5000)
    } catch (error: any) {
      setSaveMessage(`Error cancelling subscription: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    console.log('handleDeleteAccount')
    try {
      setIsLoading(true)

      // Using HTTP client with automatic authentication
      const response = await fetch("/api/users", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }

        // Refresh page - let the app's auth logic handle the redirect
        window.location.reload()
        setShowDeleteAccountModal(false)
        // Handle successful deletion (redirect, show message, etc.)
      } else {
        const errorData = await response.json()
        setSaveMessage(`Error deleting account: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setSaveMessage("Failed to delete account. Please try again.")
    } finally {
      setIsLoading(false)
      setShowDeleteAccountModal(false)
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
                      /trainer-invite/
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

        {/* Subscription Plan Section */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                  <div>
                    <h3 className="font-medium text-lg capitalize">
                      {subscriptionPlan === "trainer_basic" ? "Basic Plan" :
                       subscriptionPlan === "trainer_pro" ? "Pro Plan" :
                       subscriptionPlan === "trainer_elite" ? "Elite Plan" :
                       subscriptionPlan}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscriptionPlan === "trainer_basic" ? "Up to 10 clients" :
                       subscriptionPlan === "trainer_pro" ? "Up to 25 clients" :
                       subscriptionPlan === "trainer_elite" ? "Unlimited clients" :
                       "Current subscription plan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {subscriptionPlan === "trainer_basic" ? "€0" :
                       subscriptionPlan === "trainer_pro" ? "€49" :
                       subscriptionPlan === "trainer_elite" ? "€69" :
                       "—"}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                {/* Client Capacity Progress Bar */}
                <div className="p-4 border rounded-md bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Client Capacity ({clientCount} / {getClientCapacity()})
                       </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {clientCount} / {getClientCapacity()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${calculateSubscriptionProgress()}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>
                      {getClientCapacity()}
                    </span>
                  </div>
                </div>

                {/* Upgrade CTA */}
                <div className="p-4 border rounded-md bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Need more clients?</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Upgrade your plan to increase your client capacity and unlock advanced features
                      </p>
                    </div>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.location.href = "/pricing"}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

                {/* Cancel Subscription Button - Only show if not on basic plan */}
                {subscriptionPlan !== "trainer_basic" && (
                  <div className="p-4 border border-red-200 rounded-md bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Cancel Subscription</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Downgrade to the Basic plan and reduce your monthly costs
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => setShowCancelSubscriptionModal(true)}
                      >
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                )}
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
            <Button variant="destructive" onClick={() => handleDeleteAccount()}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Modal */}
      <LogoutModal open={showLogoutModal} onOpenChange={setShowLogoutModal} />

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelSubscriptionModal} onOpenChange={setShowCancelSubscriptionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-500" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              {clientCount > 3 ? (
                <span className="text-red-600 font-medium">
                  ⚠️ You currently have {clientCount} active clients. You must remove {clientCount - 3} client(s) before cancelling your subscription.
                </span>
              ) : (
                <>
                  Are you sure you want to cancel your current subscription? You will be downgraded to the Basic plan
                  (€0/month) and your client capacity will be reduced to 3 clients. This action can be reversed by upgrading again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {clientCount > 3 ? (
              <Button variant="outline" onClick={() => setShowCancelSubscriptionModal(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCancelSubscriptionModal(false)}>
                  Keep Current Plan
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? "Cancelling..." : "Yes, Cancel Subscription"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
