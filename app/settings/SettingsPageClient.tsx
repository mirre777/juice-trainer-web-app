"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { generateUniversalInviteCode, updateUniversalInviteCode } from "@/lib/firebase/user-service"

export default function SettingsPageClient() {
  const { toast } = useToast()
  const { user, isLoading, error } = useCurrentUser()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [universalInviteCode, setUniversalInviteCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isUpdatingCode, setIsUpdatingCode] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setUniversalInviteCode(user.universalInviteCode || "")
    }
  }, [user])

  const handleGenerateInviteCode = async () => {
    setIsGeneratingCode(true)
    try {
      const result = await generateUniversalInviteCode(user?.id || "")
      if (result.success && result.inviteCode) {
        setUniversalInviteCode(result.inviteCode)
        toast({
          title: "Invite Code Generated",
          description: "Your invite code has been generated successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate invite code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invite code",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleUpdateInviteCode = async (newCode: string) => {
    setIsUpdatingCode(true)
    try {
      const result = await updateUniversalInviteCode(user?.id || "", newCode)
      if (result.success) {
        setUniversalInviteCode(newCode)
        toast({
          title: "Invite Code Updated",
          description: "Your invite code has been updated successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update invite code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invite code",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCode(false)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const result = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          universalInviteCode,
        }),
      })

      if (result.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-gray-500">Manage your account preferences</p>
        </div>

        <div className="border rounded-lg bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6">
            <h3 className="text-xl font-semibold">Profile</h3>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="/abstract-profile.png" alt="Profile Avatar" />
                <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Name</Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName"> </Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <div className="flex items-center">
                <Input
                  id="inviteCode"
                  placeholder="Invite Code"
                  value={universalInviteCode}
                  onChange={(e) => setUniversalInviteCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => handleUpdateInviteCode(universalInviteCode)}
                  disabled={isUpdatingCode}
                >
                  {isUpdatingCode ? "Updating..." : "Update"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={handleGenerateInviteCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? "Generating..." : "Generate"}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Share this code with clients:{" "}
                <a href={`https://app.juice.fitness/invite/${universalInviteCode}`}>
                  https://app.juice.fitness/invite/{universalInviteCode}
                </a>
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
