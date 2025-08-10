"use client"

import { MoreVertical } from "lucide-react"
import { clientsPageStyles } from "../../../app/clients-new-design/styles"
import { FirebaseWorkout } from "@/lib/firebase/workout-service"
import { Client } from "@/types/client"
import { getCurrentWeek } from "@/lib/utils/date-utils"
import { useEffect, useState } from "react"

interface ClientDetailsHeaderProps {
  client: Client
  workouts: FirebaseWorkout[]
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Session = {
  date: Date;
  completed: boolean;
}

export type WeeklySessions = Map<WeekDay, Session>;

export function ClientDetailsHeader({ client, workouts }: ClientDetailsHeaderProps) {
  const [weeklySessions, setWeeklySessions] = useState<WeeklySessions>(new Map());

  useEffect(() => {
    const fetchWeeklySessions = async () => {
      const weeklySessions = await getWeeklySessions(workouts)
      console.log("weeklySessions", weeklySessions)
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
        completed: false
      };
      weeklySessions.set(i as WeekDay, session);

    }
    return weeklySessions;
  }

  function getWeekDay(date: Date): WeekDay {
    console.log("date", date, date instanceof Date)
    if (date && date instanceof Date) {
      return date.getDay() === 0 ? 7 : date.getDay() as WeekDay;
    }
    return 0 as WeekDay;
  }

  async function getWeeklySessions(workouts: FirebaseWorkout[]): Promise<WeeklySessions> {
    // start date monday this week
    const { startDate, endDate } = getCurrentWeek();
    // create a map where the key is the date and the value is the boolean if the workout is completed
    const weeklySessions = initializeWeeklySessions(startDate);
    // set the workout completed to true if the workout is completed
    workouts.forEach((workout) => {
      if (workout.completedAt) {
        // Convert string to Date object
        const completedDate = new Date(workout.completedAt);
        const weekDay = getWeekDay(completedDate);
        console.log("weekDay", weekDay)
        const session: Session = {
          date: completedDate,
          completed: true
        };
        weeklySessions.set(weekDay, session);
      }
    });
    console.log("weeklySessions", weeklySessions)
    return weeklySessions;
  }


  const getWorkoutDayStyle = (isActive: boolean) => {
    return isActive ? clientsPageStyles.workoutDayActive : clientsPageStyles.workoutDayInactive
  }

  const getDateLabel = (session: Session, weekDay: WeekDay) => {
    // should return the day of the month
    return DAYS[weekDay - 1];
  };

  return (
    <div className={clientsPageStyles.clientHeaderCard}>
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
              <h1 className={clientsPageStyles.clientHeaderName}>{client.name}</h1>
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
                className={getWorkoutDayStyle(session.completed)}
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