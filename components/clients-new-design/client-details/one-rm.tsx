"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clientsPageStyles } from "../../../app/clients/styles";
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

// Format date for chart display (month and day only)
const formatChartDate = (value: any) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export function OneRMChart({ clientId, exerciseId }: OneRMChartProps) {
  const [data, setData] = useState<OneRMChartData[]>([])

  useEffect(() => {
    fetchWorkoutExercises()
  }, [exerciseId])

  const fetchWorkoutExercises = async () => {
    const workoutExercisesResponse = await fetch(`/api/clients/${clientId}/workout-exercises?exerciseId=${exerciseId}`)
    const { workoutExercises } = await workoutExercisesResponse.json()
    console.log("OneRMChart: workoutExercises", workoutExercises)
    const data = workoutExercises
      .map((workoutExercise: WorkoutExercise) => ({
        time: new Date(workoutExercise.createdAt),
        oneRM: workoutExercise.oneRepMax ?? 0,
      }))
      .sort((a: OneRMChartData, b: OneRMChartData) => a.time.getTime() - b.time.getTime()) // Sort by time ascending (oldest to newest)
    console.log("OneRMChart: sorted data", data)
    setData(data)
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
            <XAxis
              dataKey="time"
              scale="time"
              domain={['auto', 'auto']}
              tickFormatter={formatChartDate}
            />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="oneRM" stroke="#D2FF28" fill="#D2FF28" fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};