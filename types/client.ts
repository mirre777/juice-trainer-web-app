export interface Client {
  id: string
  name: string
  initials: string
  status: ClientStatus
  notes?: string
  lastWorkout?: {
    name: string
    date: string
    completion: number
  }
  workoutDays: {
    monday: boolean,
    tuesday: boolean,
    wednesday: boolean,
    thursday: boolean,
    friday: boolean,
    saturday: boolean,
    sunday: boolean,
  }
  email: string
  phone: string // Added phone field
  goal: string
  program: string
  createdAt: any
  inviteCode: string
  userId: string
  _lastUpdated?: number
}

export enum ClientStatus {
  Pending = "Pending",
  Active = "Active",
  Inactive = "Inactive",
  Deleted = "Deleted",
}