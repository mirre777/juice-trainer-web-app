export interface Client {
  id: string
  name: string
  initials: string
  status: "Pending" | "Active" | "Inactive" | "Deleted"
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
