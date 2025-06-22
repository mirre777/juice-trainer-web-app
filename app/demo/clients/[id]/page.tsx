"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PageLayout } from "@/components/shared/page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Target,
  FileText,
  Clock,
  MessageSquare,
  Plus,
  Edit,
  Download,
  BarChart2,
  User,
  DollarSign,
  Clipboard,
  Activity,
} from "lucide-react"
import { useErrorHandler } from "@/hooks/use-error-handler"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const clientId = params.id as string
  const { error, handleError } = useErrorHandler({
    context: { component: "ClientDetailPage", clientId },
  })

  // Sample client data - in a real app, you would fetch this based on the ID
  const [client, setClient] = useState({
    id: clientId,
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "Jan 15, 2023",
    plan: "Strength Training",
    progress: 85,
    lastActive: "2 hours ago",
    goals: "Increase strength, Build muscle mass",
    notes: "Prefers morning sessions. Has previous shoulder injury.",
    workouts: [
      { id: "w1", name: "Upper Body Strength", completed: true, date: "May 15, 2023" },
      { id: "w2", name: "Lower Body Focus", completed: false, date: "May 18, 2023" },
      { id: "w3", name: "Full Body Circuit", completed: true, date: "May 10, 2023" },
      { id: "w4", name: "Core Strength", completed: true, date: "May 5, 2023" },
    ],
    measurements: [
      {
        date: "Jan 15, 2023",
        weight: "180 lbs",
        bodyFat: "18%",
        chest: "42 in",
        waist: "34 in",
        arms: "15 in",
        legs: "24 in",
      },
      {
        date: "Feb 15, 2023",
        weight: "178 lbs",
        bodyFat: "17%",
        chest: "42.5 in",
        waist: "33 in",
        arms: "15.5 in",
        legs: "24.5 in",
      },
      {
        date: "Mar 15, 2023",
        weight: "175 lbs",
        bodyFat: "16%",
        chest: "43 in",
        waist: "32 in",
        arms: "16 in",
        legs: "25 in",
      },
      {
        date: "Apr 15, 2023",
        weight: "173 lbs",
        bodyFat: "15%",
        chest: "43.5 in",
        waist: "31 in",
        arms: "16.5 in",
        legs: "25.5 in",
      },
    ],
    sessions: [
      { id: "s1", date: "May 15, 2023", time: "8:00 AM", type: "In-person", status: "Completed", duration: "60 min" },
      { id: "s2", date: "May 18, 2023", time: "9:00 AM", type: "Virtual", status: "Scheduled", duration: "45 min" },
      { id: "s3", date: "May 22, 2023", time: "8:00 AM", type: "In-person", status: "Scheduled", duration: "60 min" },
      { id: "s4", date: "May 25, 2023", time: "9:00 AM", type: "Virtual", status: "Scheduled", duration: "45 min" },
    ],
    metrics: [
      { name: "Weight", value: "173 lbs", change: "-7 lbs" },
      { name: "Body Fat", value: "15%", change: "-3%" },
      { name: "Bench Press", value: "185 lbs", change: "+25 lbs" },
      { name: "Squat", value: "225 lbs", change: "+45 lbs" },
    ],
    programs: [
      {
        id: "p1",
        name: "Strength Foundation",
        type: "Strength",
        progress: 85,
        startDate: "Jan 15, 2023",
        endDate: "Jul 15, 2023",
        status: "Active",
      },
      {
        id: "p2",
        name: "Mobility Improvement",
        type: "Mobility",
        progress: 60,
        startDate: "Feb 1, 2023",
        endDate: "May 1, 2023",
        status: "Completed",
      },
    ],
    billing: {
      plan: "Premium",
      amount: "$120/month",
      nextBilling: "Jun 15, 2023",
      paymentMethod: "Visa ending in 4242",
      invoices: [
        { id: "inv1", date: "May 15, 2023", amount: "$120.00", status: "Paid" },
        { id: "inv2", date: "Apr 15, 2023", amount: "$120.00", status: "Paid" },
        { id: "inv3", date: "Mar 15, 2023", amount: "$120.00", status: "Paid" },
      ],
    },
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      try {
        // Simulate potential error
        // if (Math.random() > 0.8) throw new Error("Failed to load client data");
        setIsLoading(false)
      } catch (err) {
        handleError(err, { operation: "loadClientData" })
        setIsLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [handleError])

  if (isLoading) {
    return (
      <PageLayout title="Client Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-300"></div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Client</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={client.name} description={client.plan}>
      <div className="mb-6">
        <Link href="/demo/clients" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Link>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden">
              <img
                src={`https://randomuser.me/api/portraits/men/${Number.parseInt(clientId.split("-")[1]) || 1}.jpg`}
                alt={client.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-lime-100 text-lime-800 hover:bg-lime-100">
                  {client.plan}
                </Badge>
                <span className="text-gray-500 text-sm">Last active: {client.lastActive}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Message
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button className="gap-2 bg-black hover:bg-gray-800">
              <Plus className="w-4 h-4" />
              New Session
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 w-full">
          <TabsTrigger value="overview" className="text-sm">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="text-sm">
            <Clipboard className="w-4 h-4 mr-2" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="workouts" className="text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="measurements" className="text-sm">
            <BarChart2 className="w-4 h-4 mr-2" />
            Measurements
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-sm">
            <DollarSign className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Join Date</p>
                      <p>{client.joinDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <Target className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                  <p>{client.goals}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                  <p>{client.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Workouts</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.workouts.slice(0, 3).map((workout) => (
                    <div key={workout.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <Clock className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{workout.name}</p>
                          <p className="text-sm text-gray-500">{workout.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={workout.completed ? "success" : "warning"}>
                          {workout.completed ? "Completed" : "Pending"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.metrics.map((metric, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">{metric.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{metric.value}</span>
                          <span
                            className={`text-xs ${metric.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                          >
                            {metric.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="mt-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Active Programs</CardTitle>
              <Button className="gap-2 bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4" />
                Assign Program
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {client.programs.map((program) => (
                  <div key={program.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium text-lg">{program.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{program.type}</Badge>
                          <Badge
                            variant={program.status === "Active" ? "default" : "secondary"}
                            className={program.status === "Active" ? "bg-lime-100 text-lime-800 hover:bg-lime-100" : ""}
                          >
                            {program.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Start: {program.startDate}</span>
                      <span className="text-gray-500">End: {program.endDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="mt-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Workout History</CardTitle>
              <Button className="gap-2 bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4" />
                Assign Workout
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {client.workouts.map((workout) => (
                  <div key={workout.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{workout.name}</p>
                        <p className="text-sm text-gray-500">{workout.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={workout.completed ? "success" : "warning"}>
                        {workout.completed ? "Completed" : "Pending"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="mt-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Body Measurements</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button className="gap-2 bg-black hover:bg-gray-800">
                  <Plus className="w-4 h-4" />
                  Add Measurement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Weight</th>
                      <th className="text-left py-3 px-4 font-medium">Body Fat</th>
                      <th className="text-left py-3 px-4 font-medium">Chest</th>
                      <th className="text-left py-3 px-4 font-medium">Waist</th>
                      <th className="text-left py-3 px-4 font-medium">Arms</th>
                      <th className="text-left py-3 px-4 font-medium">Legs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.measurements.map((measurement, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{measurement.date}</td>
                        <td className="py-3 px-4">{measurement.weight}</td>
                        <td className="py-3 px-4">{measurement.bodyFat}</td>
                        <td className="py-3 px-4">{measurement.chest}</td>
                        <td className="py-3 px-4">{measurement.waist}</td>
                        <td className="py-3 px-4">{measurement.arms}</td>
                        <td className="py-3 px-4">{measurement.legs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Training Sessions</CardTitle>
              <Button className="gap-2 bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4" />
                Schedule Session
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Time</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Duration</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.sessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{session.date}</td>
                        <td className="py-3 px-4">{session.time}</td>
                        <td className="py-3 px-4">{session.type}</td>
                        <td className="py-3 px-4">{session.duration}</td>
                        <td className="py-3 px-4">
                          <Badge variant={session.status === "Completed" ? "success" : "outline"}>
                            {session.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Billing Information</CardTitle>
              <Button className="gap-2 bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Current Plan</h4>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{client.billing.plan}</p>
                        <p className="text-sm text-gray-500">{client.billing.amount}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Plan
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-blue-500 rounded mr-3"></div>
                        <div>
                          <p className="font-medium">{client.billing.paymentMethod}</p>
                          <p className="text-sm text-gray-500">Next billing: {client.billing.nextBilling}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recent Invoices</h4>
                  <div className="space-y-2">
                    {client.billing.invoices.map((invoice) => (
                      <div key={invoice.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-medium">{invoice.date}</p>
                          <p className="text-sm text-gray-500">Invoice #{invoice.id}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="success">{invoice.status}</Badge>
                          <p className="font-medium">{invoice.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
