"use client"

import { MoreVertical } from "lucide-react"
import { clientsPageStyles } from "../../../app/clients-new-design/styles"
import { FirebaseWorkout } from "@/lib/firebase/workout-service"
import { Client } from "@/types/client"
import { getCurrentWeek } from "@/lib/utils/date-utils"
import { useEffect, useState } from "react"
import { capitalize } from "@/lib/utils"

interface ClientDetailsHeaderProps {
  client: Client
  workouts: FirebaseWorkout[]
  selectedWorkout: FirebaseWorkout | null
  handleWorkoutSelect: (workout: FirebaseWorkout | null) => void;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Session = {
  date: Date;
  completed: boolean;
  workout: FirebaseWorkout | null;
}

export type WeeklySessions = Map<WeekDay, Session>;

export function ClientDetailsHeader({ client, workouts, selectedWorkout, handleWorkoutSelect }: ClientDetailsHeaderProps) {
  const [weeklySessions, setWeeklySessions] = useState<WeeklySessions>(new Map());

  useEffect(() => {
    const fetchWeeklySessions = async () => {
      const weeklySessions = await getWeeklySessions(workouts)
      setWeeklySessions(weeklySessions)
    }
    fetchWeeklySessions()
  }, [client,workouts])

  function initializeWeeklySessions(startDate: Date): WeeklySessions {
    const weeklySessions = new Map<WeekDay, Session>();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i - 1);
      const session: Session = {
        date,
        completed: false,
        workout: null
      };
      weeklySessions.set(i as WeekDay, session);

    }
    return weeklySessions;
  }

  function getWeekDay(date: Date): WeekDay {
    if (date && date instanceof Date) {
      return date.getDay() === 0 ? 7 : date.getDay() as WeekDay;
    }
    return 0 as WeekDay;
  }

  async function getWeeklySessions(workouts: FirebaseWorkout[]): Promise<WeeklySessions> {
    // start date monday this week
    const { startDate } = getCurrentWeek();
    // create a map where the key is the date and the value is the boolean if the workout is completed
    const weeklySessions = initializeWeeklySessions(startDate);
    // set the workout completed to true if the workout is completed
    workouts.forEach((workout) => {
      // Convert string to Date object
      const completedDate = new Date(workout.completedAt ?? workout.startedAt);
      const weekDay = getWeekDay(completedDate);
      const session: Session = {
        date: completedDate,
        completed: true,
        workout: workout
      };
      weeklySessions.set(weekDay, session);
    });
    console.log("weeklySessions", weeklySessions)
    return weeklySessions;
  }


  const getWorkoutDayStyle = (isActive: boolean) => {
    return isActive ? clientsPageStyles.workoutDayActive : clientsPageStyles.workoutDayInactive
  }

  const getWorkoutSelectedStyle = (workout: FirebaseWorkout | null) => {
    return selectedWorkout?.id === workout?.id ? clientsPageStyles.workoutDaySelected : ""
  }

  const getDateLabel = (session: Session, weekDay: WeekDay) => {
    // should return the day of the month
    return DAYS[weekDay - 1];
  };

  return (
    <div>
      <div className={clientsPageStyles.clientHeaderFlex}>
        <div className={clientsPageStyles.clientHeaderInfo}>
          <div
            className={clientsPageStyles.clientHeaderAvatar}
            style={{
              backgroundColor: "#D2FF28",
              color: "black"
            }}
          >
            {client.initials}
          </div>

          <div>
            <div className={clientsPageStyles.clientHeaderNameRow}>
              <h1 className={clientsPageStyles.clientHeaderName}>{capitalize(client.name)}</h1>
              <button className={clientsPageStyles.clientHeaderButton}>
                <MoreVertical className={clientsPageStyles.clientHeaderIcon} />
              </button>
            </div>

            <div className={clientsPageStyles.clientContactInfo}>
              <p className={clientsPageStyles.clientContactText}>{client.email}</p>
              <p className={clientsPageStyles.clientContactText}>{client.phone}</p>
            </div>
          </div>
        </div>

        <div className={clientsPageStyles.workoutDaysContainer}>
          <div className={clientsPageStyles.workoutDaysFlex}>
          {Array.from(weeklySessions.entries()).map(([weekDay, session], index) => (
              <div
                key={index}
                className={getWorkoutDayStyle(session.completed) + " " + getWorkoutSelectedStyle(session.workout)}
                onClick={() => handleWorkoutSelect(session.workout)}
              >
                {getDateLabel(session, weekDay)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}