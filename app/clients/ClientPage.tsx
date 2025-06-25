"use client"

import ClientTable from "@/components/ClientTable"
import ClientToolbar from "@/components/ClientToolbar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PlusIcon } from "@radix-ui/react-icons"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/actions/client.actions"
import { revalidatePath } from "next/cache"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
})

const ClientPage = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await createClient(values)
      if ((res as AppError)?.error) {
        return toast({
          title: "Something went wrong.",
          description: (res as AppError).error,
          variant: "destructive",
        })
      }

      toast({
        title: "Success!",
        description: "Client created.",
      })
      form.reset()
      setOpen(false)
      revalidatePath("/clients")
    } catch (error: any) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-gray-500">Manage your clients.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
              <DialogDescription>Add a new client to your list.</DialogDescription>
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
                        <Input placeholder="Client Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="mail@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Submit</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <ClientToolbar />
      <ClientTable />
    </div>
  )
}

export default ClientPage
