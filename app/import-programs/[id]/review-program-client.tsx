"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProgramSchemaType } from "@/lib/schemas/program-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppError } from "@/lib/utils/error-handler"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Program name must be at least 2 characters.",
  }),
  description: z.string().optional(),
})

interface ReviewProgramClientProps {
  programId: string
}

export default function ReviewProgramClient({ programId }: ReviewProgramClientProps) {
  const [program, setProgram] = useState<ProgramSchemaType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const importId = searchParams.get("importId")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchProgram = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/programs/${programId}`)
        if (!response.ok) {
          const error = (await response.json()) as AppError
          throw new Error(error.message)
        }
        const data = (await response.json()) as ProgramSchemaType
        setProgram(data)
        form.setValue("name", data.name)
        form.setValue("description", data.description || "")
      } catch (error: any) {
        toast({
          title: "Error!",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgram()
  }, [programId, form, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = (await response.json()) as AppError
        throw new Error(error.message)
      }

      toast({
        title: "Success!",
        description: "Program updated successfully.",
      })
      router.push(`/programs`)
    } catch (error: any) {
      toast({
        title: "Error!",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-80" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-50" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Program</CardTitle>
        <CardDescription>Review the program details and make any necessary changes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Program name" {...form.register("name")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" placeholder="Program description" {...form.register("description")} />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={form.handleSubmit(onSubmit)}>Update Program</Button>
      </CardFooter>
    </Card>
  )
}
