export interface Client {
  id: string
  name: string
  initials: string
  status: ClientStatus
  progress: number
  sessions: {
    completed: number
    total: number
  }
  completion: number
  notes: string
  bgColor: string
  textColor: string
  lastWorkout: {
    name: string
    date: string
    completion: number
  }
  metrics: any[]
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