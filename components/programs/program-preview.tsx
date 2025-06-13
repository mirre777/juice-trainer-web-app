"use client"

import { useState } from "react"
import type { WorkoutProgram, WorkoutRoutine, ProgramExercise } from "@/types/workout-program"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Printer, Download, Share2 } from "lucide-react"

interface ProgramPreviewProps {
  program: WorkoutProgram
  onClose: () => void
}

export default function ProgramPreview({ program, onClose }: ProgramPreviewProps) {
  const [activeWeek, setActiveWeek] = useState<number>(1)

  if (!program) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(program, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${program.program_title.replace(/\s+/g, "-").toLowerCase()}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <div className="space-y-6 print:p-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Program Preview</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={onClose}>Back to Editor</Button>
        </div>
      </div>

      <div className="print:block">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{program.program_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p>{program.program_weeks} weeks</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Routines</p>
                <p>{program.routine_count} routines</p>
              </div>
            </div>
            {program.program_notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Program Notes</p>
                <p className="whitespace-pre-wrap">{program.program_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6 print:hidden">
          <h2 className="text-xl font-semibold mb-3">Weekly View</h2>
          <Tabs
            value={`week-${activeWeek}`}
            onValueChange={(value) => setActiveWeek(Number.parseInt(value.replace("week-", "")))}
          >
            <TabsList className="mb-4">
              {Array.from({ length: program.program_weeks }, (_, i) => i + 1).map((week) => (
                <TabsTrigger key={week} value={`week-${week}`}>
                  Week {week}
                </TabsTrigger>
              ))}
            </TabsList>

            {Array.from({ length: program.program_weeks }, (_, i) => i + 1).map((week) => (
              <TabsContent key={week} value={`week-${week}`} className="space-y-6">
                {program.routines.map((routine, routineIndex) => (
                  <WeeklyRoutineView key={routineIndex} routine={routine} week={week} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="print:block">
          <h2 className="text-xl font-semibold mb-3">Routine Details</h2>
          <div className="space-y-6">
            {program.routines.map((routine, routineIndex) => (
              <RoutineView key={routineIndex} routine={routine} programWeeks={program.program_weeks} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeeklyRoutineView({ routine, week }: { routine: WorkoutRoutine; week: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{routine.routine_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Exercise</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>RPE</TableHead>
              <TableHead>Rest</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routine.exercises.map((exercise, exerciseIndex) => {
              const weekData = exercise.weeks.find((w) => w.week_number === week)
              if (!weekData) return null

              return (
                <TableRow key={exerciseIndex}>
                  <TableCell className="font-medium">
                    <div>
                      {exercise.exercise}
                      <Badge variant="outline" className="ml-2">
                        {exercise.exercise_category}
                      </Badge>
                    </div>
                    {exercise.exercise_notes && (
                      <p className="text-xs text-muted-foreground mt-1">{exercise.exercise_notes}</p>
                    )}
                  </TableCell>
                  <TableCell>{weekData.set_count}</TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex} className={`${set.warmup ? "text-amber-600" : ""}`}>
                        {set.warmup && "(W) "}
                        {set.reps}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.rpe}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.rest}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.notes}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RoutineView({ routine, programWeeks }: { routine: WorkoutRoutine; programWeeks: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{routine.routine_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {routine.exercises.map((exercise, exerciseIndex) => (
            <AccordionItem key={exerciseIndex} value={`exercise-${exerciseIndex}`}>
              <AccordionTrigger>
                <div className="flex items-center">
                  <span>{exercise.exercise}</span>
                  <Badge variant="outline" className="ml-2">
                    {exercise.exercise_category}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ExerciseProgressionView exercise={exercise} programWeeks={programWeeks} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

function ExerciseProgressionView({ exercise, programWeeks }: { exercise: ProgramExercise; programWeeks: number }) {
  return (
    <div className="space-y-4">
      {exercise.exercise_notes && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">Notes:</p>
          <p className="text-sm">{exercise.exercise_notes}</p>
        </div>
      )}

      {exercise.exercise_video && (
        <div>
          <p className="text-sm font-medium mb-1">Video Reference:</p>
          <a
            href={exercise.exercise_video}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {exercise.exercise_video}
          </a>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">Weekly Progression</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>RPE</TableHead>
              <TableHead>Rest</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: programWeeks }, (_, i) => i + 1).map((week) => {
              const weekData = exercise.weeks.find((w) => w.week_number === week)
              if (!weekData)
                return (
                  <TableRow key={week}>
                    <TableCell>Week {week}</TableCell>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No data for this week
                    </TableCell>
                  </TableRow>
                )

              return (
                <TableRow key={week}>
                  <TableCell>Week {week}</TableCell>
                  <TableCell>{weekData.set_count}</TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex} className={`${set.warmup ? "text-amber-600" : ""}`}>
                        {set.warmup && "(W) "}
                        {set.reps}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.rpe}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.rest}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {weekData.sets.map((set, setIndex) => (
                      <div key={setIndex}>
                        {set.notes}
                        {setIndex < weekData.sets.length - 1 ? ", " : ""}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
