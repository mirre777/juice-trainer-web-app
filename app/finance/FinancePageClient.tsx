"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFinanceRecord, deleteFinanceRecord, getFinanceRecords, updateFinanceRecord } from "@/lib/api/finance"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.number(),
  date: z.date(),
})

type FinanceRecord = {
  id: string
  description: string
  amount: number
  date: Date
}

function FinancePageClient() {
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    data: initialFinanceRecords,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["financeRecords"],
    queryFn: getFinanceRecords,
  })

  useEffect(() => {
    if (initialFinanceRecords) {
      setFinanceRecords(initialFinanceRecords)
    }
  }, [initialFinanceRecords])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date(),
    },
  })

  const { mutate: createRecord, isLoading: isCreateLoading } = useMutation({
    mutationFn: createFinanceRecord,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Finance record created successfully.",
      })
      form.reset()
      refetch()
    },
    onError: (error) => {
      const appError = error as AppError
      toast({
        title: "Error",
        description: appError.message || "Failed to create finance record.",
        variant: "destructive",
      })
    },
  })

  const { mutate: updateRecord, isLoading: isUpdateLoading } = useMutation({
    mutationFn: updateFinanceRecord,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Finance record updated successfully.",
      })
      form.reset()
      refetch()
      setIsEditMode(false)
      setSelectedRecordId(null)
    },
    onError: (error) => {
      const appError = error as AppError
      toast({
        title: "Error",
        description: appError.message || "Failed to update finance record.",
        variant: "destructive",
      })
    },
  })

  const { mutate: deleteRecord, isLoading: isDeleteLoading } = useMutation({
    mutationFn: deleteFinanceRecord,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Finance record deleted successfully.",
      })
      refetch()
      setIsEditMode(false)
      setSelectedRecordId(null)
    },
    onError: (error) => {
      const appError = error as AppError
      toast({
        title: "Error",
        description: appError.message || "Failed to delete finance record.",
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedRecordId) {
      updateRecord({ id: selectedRecordId, ...values })
    } else {
      createRecord(values)
    }
  }

  const handleEdit = (record: FinanceRecord) => {
    setIsEditMode(true)
    setSelectedRecordId(record.id)
    form.setValue("description", record.description)
    form.setValue("amount", record.amount)
    form.setValue("date", record.date)
  }

  const handleDelete = (id: string) => {
    deleteRecord(id)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setSelectedRecordId(null)
    form.reset()
  }

  if (isLoading) {
    return (
      <Card className="w-[700px]">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              Finance Records
              <ReloadIcon className="ml-2 h-4 w-4 animate-spin" />
            </div>
          </CardTitle>
          <CardDescription>Loading finance records...</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Skeleton className="h-10 w-[350px]" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Skeleton className="h-10 w-[350px]" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Skeleton className="h-10 w-[350px]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-[700px]">
        <CardHeader>
          <CardTitle>Finance Records</CardTitle>
          <CardDescription>Error loading finance records.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-[700px]">
        <CardHeader>
          <CardTitle>Finance Records</CardTitle>
          <CardDescription>Add or update your finance records here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description" {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Amount"
                        {...field}
                        type="number"
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value)
                          field.onChange(isNaN(value) ? 0 : value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center" side="bottom">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreateLoading || isUpdateLoading}>
                {isEditMode
                  ? isUpdateLoading
                    ? "Updating..."
                    : "Update Record"
                  : isCreateLoading
                    ? "Creating..."
                    : "Add Record"}
              </Button>
              {isEditMode && (
                <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card className="w-[700px]">
        <CardHeader>
          <CardTitle>Existing Records</CardTitle>
          <CardDescription>View and manage your existing finance records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financeRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.amount}</TableCell>
                  <TableCell>{format(record.date, "PPP")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(record.id)} disabled={isDeleteLoading}>
                            {isDeleteLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancePageClient
