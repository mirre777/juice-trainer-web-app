import { Client, ClientStatus } from "@/types"

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Emma Thompson",
    email: "emma.thompson@gmail.com",
    phone: "+49 1577 657 9555",
    status: ClientStatus.Active,
    initials: "ET",
    workoutDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false
    },
    notes: "",
    goal: "",
    program: "",
    createdAt: new Date(),
    inviteCode: "",
    userId: "",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@yahoo.com",
    phone: "+49 1577 123 4567",
    status: ClientStatus.Pending,
    initials: "MC",
    goal: "",
    program: "",
    createdAt: new Date(),
    inviteCode: "",
    notes: "",
    userId: "",
    workoutDays: {
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: true,
      sunday: false
    },
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.johnson@hotmail.com",
    phone: "+49 1577 234 5678",
    status: ClientStatus.Active,
    initials: "SJ",
    goal: "",
    program: "",
    createdAt: new Date(),
    inviteCode: "",
    notes: "",
    userId: "",
    workoutDays: {
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false
    }
  },
  {
    id: "4",
    name: "Ryan Cooper",
    email: "ryan.cooper@outlook.com",
    phone: "+49 1577 345 6789",
    status: ClientStatus.Pending,
    initials: "RC",
    goal: "",
    program: "",
    createdAt: new Date(),
    inviteCode: "",
    notes: "",
    userId: "",
    workoutDays: {
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: false,
      sunday: false
    }
  },
  {
    id: "5",
    name: "Jessica Martinez",
    email: "jessica.martinez@gmail.com",
    phone: "+49 1577 456 7890",
    status: ClientStatus.Active,
    initials: "JM",
    goal: "",
    program: "",
    createdAt: new Date(),
    inviteCode: "",
    notes: "",
    userId: "",
    workoutDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: false,
      saturday: false,
      sunday: false
    }
  }
]