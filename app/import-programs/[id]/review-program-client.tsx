"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Program } from "@prisma/client"
import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface ReviewProgramClientProps {
  program: Program
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Program name must be at least 2 characters.",
  }),
})

export const ReviewProgramClient = ({ program }: ReviewProgramClientProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: program?.name || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const response = await fetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update program")
      }

      toast({
        title: "Success",
        description: "Program updated successfully.",
      })
      router.refresh()
      setOpen(false)
    } catch (error: any) {
      console.error("Error updating program:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update program.",
      })
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/programs/${program.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete program")
      }

      toast({
        title: "Success",
        description: "Program deleted successfully.",
      })
      router.refresh()
      router.push(`/import-programs`)
    } catch (error: any) {
      console.error("Error deleting program:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete program.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit program</DialogTitle>
            <DialogDescription>Make changes to your program here. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" placeholder="Program name" className="col-span-3" {...form.register("name")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Button variant="destructive" onClick={() => onDelete()} disabled={loading}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </>
  )
}
