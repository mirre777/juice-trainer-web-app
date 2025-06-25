"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { programSchema } from "@/lib/validations/program"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProgram } from "@/lib/actions/program"
import { ReloadIcon } from "@radix-ui/react-icons"
import type { AppError } from "@/lib/utils/error-handler"

interface ImportProgramsClientProps {
  className?: string
}

export default function ImportProgramsClient({ className }: ImportProgramsClientProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const { mutate: create, isLoading } = useMutation({
    mutationFn: async ({ name, description }: z.infer<typeof programSchema>) => {
      return await createProgram({ name, description })
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Program created successfully",
      })
      await queryClient.invalidateQueries({
        queryKey: ["programs"],
      })
      form.reset()
      setOpen(false)
    },
    onError: (error) => {
      const appError = error as AppError
      toast({
        title: "Error",
        description: appError.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: z.infer<typeof programSchema>) {
    create({ name: values.name, description: values.description })
  }

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn(className)}>
          Import Programs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Programs</DialogTitle>
          <DialogDescription>Create a new program by filling out the form below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Program Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Program Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
