"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clientsPageStyles } from "../../../app/clients-new-design/styles";
import { WorkoutExercise } from '@/lib/firebase/workout-exercise-service';
import { useState, useEffect } from 'react';

type OneRMChartData = {
  time: Date
  oneRM: number
}

interface OneRMChartProps {
  clientId: string,
  exerciseId: string
}

export function OneRMChart({ clientId, exerciseId }: OneRMChartProps) {
  const [data, setData] = useState<OneRMChartData[]>([])

  useEffect(() => {
    fetchWorkoutExercises()
  }, [exerciseId])

  const fetchWorkoutExercises = async () => {
    const workoutExercisesResponse = await fetch(`/api/clients/${clientId}/workout-exercises?exerciseId=${exerciseId}`)
    const { workoutExercises } = await workoutExercisesResponse.json()
    console.log("OneRMChart: workoutExercises", workoutExercises)
    const data = workoutExercises.map((workoutExercise: WorkoutExercise) => ({
      time: new Date(workoutExercise.createdAt),
      oneRM: workoutExercise.oneRepMax ?? 0,
    }))
    console.log("OneRMChart: data", data)
    setData(data)
  }

  const formatTime = (time: Date) => {
    // display month in short format
    return time.toLocaleDateString("en-US", { month: "short" })
  }

  return (
    <div className={clientsPageStyles.oneRMChartContainer}>
      <h4 className={clientsPageStyles.oneRMChartTitle}>One Rep Max Progress</h4>
      <div style={{ width: '100%', height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" scale="time" tickFormatter={(unixTime) => formatTime(new Date(unixTime))} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="oneRM" stroke="#D2FF28" fill="#D2FF28" fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};