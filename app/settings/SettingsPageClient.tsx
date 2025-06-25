"use client"

import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { updateUserSettings } from "@/lib/api/user"
import { useUser } from "@/lib/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

interface SettingsPageClientProps {
  defaultName: string
  defaultEmail: string
  defaultReceiveEmailNotifications: boolean
}

export function SettingsPageClient({
  defaultName,
  defaultEmail,
  defaultReceiveEmailNotifications,
}: SettingsPageClientProps) {
  const { t } = useTranslation("settings")
  const { user, updateUser } = useUser()
  const [receiveEmailNotifications, setReceiveEmailNotifications] = useState(defaultReceiveEmailNotifications)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName,
    },
  })

  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async ({ name, receiveEmailNotifications }: { name: string; receiveEmailNotifications: boolean }) => {
      if (!user) {
        throw new Error("User not found")
      }

      return await updateUserSettings({
        userId: user.id,
        name,
        receiveEmailNotifications,
      })
    },
    onSuccess: async (data) => {
      toast.success(t("settings_updated"))
      await updateUser(data)
    },
    onError: (error) => {
      const appError = error as AppError
      toast.error(appError.message || t("settings_update_failed"))
    },
  })

  const handleUpdateSettings = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await updateSettings({ name: values.name, receiveEmailNotifications })
    },
    [updateSettings, receiveEmailNotifications],
  )

  return (
    <div className="grid gap-6">
      <div>
        <h3 className="text-lg font-medium">{t("profile")}</h3>
        <p className="text-sm text-muted-foreground">{t("profile_description")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdateSettings)} className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" value={defaultEmail} disabled />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="receive-email">{t("receive_email_notifications")}</Label>
            <Switch
              id="receive-email"
              checked={receiveEmailNotifications}
              onCheckedChange={(checked) => setReceiveEmailNotifications(checked)}
            />
          </div>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? t("updating") : t("update_settings")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
