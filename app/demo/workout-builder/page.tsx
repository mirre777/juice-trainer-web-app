import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, Users, Calendar, BarChart, Settings, Plus, Trash2, Save, Share2 } from "lucide-react"
import Link from "next/link"

export default function WorkoutBuilderPage() {
  // Sample exercise categories
  const exerciseCategories = [
    {
      name: "Upper Body",
      exercises: ["Bench Press", "Push-ups", "Pull-ups", "Shoulder Press", "Bicep Curls", "Tricep Extensions"],
    },
    {
      name: "Lower Body",
      exercises: ["Squats", "Deadlifts", "Lunges", "Leg Press", "Calf Raises", "Leg Extensions"],
    },
    {
      name: "Core",
      exercises: ["Crunches", "Planks", "Russian Twists", "Leg Raises", "Mountain Climbers", "Ab Rollouts"],
    },
    {
      name: "Cardio",
      exercises: ["Running", "Cycling", "Jumping Jacks", "Burpees", "Jump Rope", "High Knees"],
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r hidden md:block">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Juice</h2>
        </div>
        <nav className="mt-6">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">Main</div>
          <Link href="/demo/dashboard" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <BarChart className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link href="/demo/clients" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Users className="w-5 h-5 mr-3" />
            Clients
          </Link>
          <Link href="/demo/workouts" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Dumbbell className="w-5 h-5 mr-3" />
            Workouts
          </Link>
          <Link href="/demo/schedule" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Calendar className="w-5 h-5 mr-3" />
            Schedule
          </Link>
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase">Account</div>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Workout Builder</h1>
              <p className="text-gray-500">Create a new workout program</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md flex items-center gap-2 bg-white">
                <Save className="w-5 h-5" />
                Save Draft
              </button>
              <button className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Publish
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workout Details */}
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Workout Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Full Body Strength"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workout Type</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md">
                          <option>Strength</option>
                          <option>Cardio</option>
                          <option>HIIT</option>
                          <option>Flexibility</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md">
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Describe the workout..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Exercise 1 */}
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Exercise 1: Bench Press</h3>
                        <button className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                            <input
                              type="number"
                              defaultValue={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                            <input
                              type="number"
                              defaultValue={10}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rest (sec)</label>
                            <input
                              type="number"
                              defaultValue={60}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            placeholder="Any specific instructions..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Exercise 2 */}
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Exercise 2: Squats</h3>
                        <button className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                            <input
                              type="number"
                              defaultValue={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                            <input
                              type="number"
                              defaultValue={12}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rest (sec)</label>
                            <input
                              type="number"
                              defaultValue={90}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            placeholder="Any specific instructions..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-3 border border-dashed border-gray-300 rounded-md flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50">
                      <Plus className="w-5 h-5" />
                      Add Exercise
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exercise Library */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Exercise Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search exercises..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <Tabs defaultValue={exerciseCategories[0].name.toLowerCase()}>
                    <TabsList className="mb-4 flex flex-wrap gap-1 w-full">
                      {exerciseCategories.map((category) => (
                        <TabsTrigger key={category.name} value={category.name.toLowerCase()} className="text-sm">
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {exerciseCategories.map((category) => (
                      <TabsContent key={category.name} value={category.name.toLowerCase()}>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {category.exercises.map((exercise) => (
                            <div
                              key={exercise}
                              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            >
                              <span>{exercise}</span>
                              <Plus className="w-5 h-5 text-gray-500" />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
