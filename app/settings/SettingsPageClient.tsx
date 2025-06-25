"use client"

import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { useUser } from "@/hooks/use-user"
import { AppError } from "@/lib/utils/error-handler"

import { SettingsModal } from "./settings-modal"

interface SettingsPageClientProps {
  orgId: string
}

export const SettingsPageClient = ({ orgId }: SettingsPageClientProps) => {
  const { t } = useTranslation()
  const { user } = useUser()

  const [isResetting, setIsResetting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const reset = useMutation(api.organizations.reset)
  const leave = useMutation(api.organizations.leave)

  const onReset = useCallback(async () => {
    try {
      setIsResetting(true)
      await reset({ orgId })
      window.location.reload()
    } catch (error) {
      if (error instanceof AppError) {
        toast.error(error.message)
      } else {
        toast.error(t("somethingWentWrong"))
      }
    } finally {
      setIsResetting(false)
    }
  }, [reset, orgId, t])

  const onLeave = useCallback(async () => {
    try {
      setIsLeaving(true)
      await leave({ orgId })
      window.location.href = "/select-org"
    } catch (error) {
      if (error instanceof AppError) {
        toast.error(error.message)
      } else {
        toast.error(t("somethingWentWrong"))
      }
    } finally {
      setIsLeaving(false)
    }
  }, [leave, orgId, t])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsModal
          disabled={isResetting}
          isLoading={isResetting}
          label={t("resetWorkspace")}
          description={t("resetWorkspaceDescription")}
          onClick={onReset}
        />
        <SettingsModal
          disabled={isLeaving || !user}
          isLoading={isLeaving}
          label={t("leaveWorkspace")}
          description={t("leaveWorkspaceDescription")}
          onClick={onLeave}
        />
      </div>
    </div>
  )
}
