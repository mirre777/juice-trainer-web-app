"use client"

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
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import type { ImportProgram } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ReloadIcon } from "@radix-ui/react-icons"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
})

interface ImportProgramsClientProps {
  programs: ImportProgram[]
}

export function ImportProgramsClient({ programs }: ImportProgramsClientProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()
  const [importedPrograms, setImportedPrograms] = useState<ImportProgram[]>(programs)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  })

  useEffect(() => {
    setImportedPrograms(programs)
  }, [programs])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setImporting(true)
    try {
      const response = await fetch("/api/import-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        const data = await response.json()
        setImportedPrograms(data)
        toast({
          title: "Success!",
          description: "Programs imported successfully.",
        })
        setOpen(false)
      } else {
        const errorData = await response.json()
        const error = errorData.error as AppError
        toast({
          title: "Error!",
          description: error.message || "Failed to import programs.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error!",
        description: error.message || "Failed to import programs.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Import Programs</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setIsLoading(true)
              window.location.reload()
            }}
            disabled={isLoading}
            variant="ghost"
          >
            <ReloadIcon
              className={cn("mr-2 h-4 w-4", {
                "animate-spin": isLoading,
              })}
            />
            Reload
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Program</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Program</DialogTitle>
                <DialogDescription>Add a new program by providing a URL.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/programs.json" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={importing}>
                    {importing ? "Importing..." : "Import"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importedPrograms?.length > 0 ? (
              importedPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.id}</TableCell>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>{program.description}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{program.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                <TableRow>
                  <TableCell className="font-medium">
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton />
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
