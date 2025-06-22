"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProgramContext } from "@/contexts/program-context"

interface NewProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NewProgramDialog({ open, onOpenChange }: NewProgramDialogProps) {
  const [title, setTitle] = useState("")
  const [weeks, setWeeks] = useState(4)
  const { createNewProgram } = useProgramContext()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && weeks > 0) {
      createNewProgram(title, weeks)
      onOpenChange(false)
      setTitle("")
      setWeeks(4)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workout Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="program-title">Program Title</Label>
            <Input
              id="program-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 12-Week Strength Builder"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program-weeks">Duration (weeks)</Label>
            <Input
              id="program-weeks"
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(Number.parseInt(e.target.value) || 1)}
              min={1}
              max={52}
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={!title.trim() || weeks < 1}>
              Create Program
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
