"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Program } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

const programSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  lessons: z.array(
    z.object({
      title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
      }),
      content: z.string().optional(),
    }),
  ),
})

interface ReviewProgramClientProps {
  initialData: Program
  programId: string
}

export const ReviewProgramClient: React.FC<ReviewProgramClientProps> = ({ initialData, programId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      lessons: initialData?.lessons || [],
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  async function onSubmit(values: z.infer<typeof programSchema>) {
    try {
      setIsSubmitting(true)
      await fetch(`/api/import-programs/${programId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      })
      toast({
        title: "Success",
        description: "Program updated successfully.",
      })
      router.refresh()
      router.push(`/programs/${programId}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                <Skeleton className="h-4 w-20" />
              </Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                <Skeleton className="h-4 w-20" />
              </Label>
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Program</CardTitle>
        <CardDescription>Please review the program details and make any necessary changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Program Title" {...field} />
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
                    <Textarea placeholder="Program Description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              {initialData?.lessons?.map((lesson, index) => (
                <div key={index} className="mb-4">
                  <Separator />
                  <div className="mt-2">
                    <Badge>Lesson {index + 1}</Badge>
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor={`lesson-${index}-title`}>Title</Label>
                    <Input id={`lesson-${index}-title`} defaultValue={lesson.title} readOnly />
                  </div>
                  <div className="grid gap-2 mt-4">
                    <Label htmlFor={`lesson-${index}-content`}>Content</Label>
                    <Textarea
                      id={`lesson-${index}-content`}
                      defaultValue={lesson.content}
                      className="resize-none"
                      readOnly
                    />
                  </div>
                </div>
              ))}
            </div>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                Update
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
