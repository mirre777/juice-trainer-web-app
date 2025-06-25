"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useState } from "react"
import { createFeedback } from "@/lib/actions/feedback.actions"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  feedback: z.string().min(10, { message: "Feedback must be at least 10 characters." }),
})

export function FeedbackModal() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      feedback: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createFeedback(values)

      if ("error" in result) {
        const appError = result as AppError
        toast({
          variant: "destructive",
          title: "Error submitting feedback.",
          description: appError.error,
        })
      } else {
        toast({
          title: "Feedback submitted successfully!",
          description: "Thanks for your feedback.",
        })
        form.reset()
        setOpen(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting feedback.",
        description: error.message,
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Give Feedback</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>We value your feedback!</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide your feedback below. Your input helps us improve our services.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us what you think..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Submit</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
