export interface Client {
  id: string
  name: string
  initials: string
  status: string
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
  goal: string
  program: string
  createdAt: Date
  inviteCode: string
  userId: string
  phone: string
  _lastUpdated: number
}

export interface ClientFormData {
  name: string
  email: string
  phone?: string
  goal?: string
  program?: string
  notes?: string
}

export interface ClientStats {
  totalClients: number
  activeClients: number
  pendingClients: number
  completedWorkouts: number
}
