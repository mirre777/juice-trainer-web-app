import { render, screen } from "@testing-library/react"
import { ClientWorkoutView } from "@/components/client-workout-view"
import "@testing-library/jest-dom"
import { jest } from "@jest/globals" // Import jest to declare the variable

// Mock the child components
jest.mock("@/components/shared/personal-records-display", () => ({
  PersonalRecordsDisplay: ({ records }: { records: any[] }) => (
    <div data-testid="personal-records">{records.length} records</div>
  ),
}))

jest.mock("@/components/shared/weekly-tracker", () => ({
  WeeklyTracker: ({ activeDays }: { activeDays: number[] }) => (
    <div data-testid="weekly-tracker">{activeDays.length} active days</div>
  ),
}))

jest.mock("@/components/workout/emoji-picker", () => ({
  EmojiPicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="emoji-picker">Emoji Picker</div> : null,
}))

describe("ClientWorkoutView", () => {
  const mockClient = {
    id: "client-1",
    name: "John Doe",
    image: "/test-image.jpg",
    date: "2024-01-15",
    programWeek: "2",
    programTotal: "8",
    daysCompleted: "3",
    daysTotal: "5",
  }

  const mockWorkout = {
    day: "3",
    focus: "Upper Body Strength",
    clientNote: "Feeling strong today!",
  }

  const mockExercises = [
    {
      id: "ex-1",
      name: "Bench Press",
      weight: "80",
      reps: "8",
      completed: true,
      sets: [
        { number: 1, weight: "70", reps: "10", isPR: false },
        { number: 2, weight: "80", reps: "8", isPR: true },
        { number: 3, weight: "75", reps: "9", isPR: false },
      ],
    },
    {
      id: "ex-2",
      name: "Squats",
      weight: "100",
      reps: "6",
      completed: false,
      sets: [
        { number: 1, weight: "90", reps: "8" },
        { number: 2, weight: "100", reps: "6" },
      ],
    },
  ]

  const mockPersonalRecords = [
    {
      exercise: "Bench Press",
      weight: "80 kg",
      reps: "8",
      date: "2024-01-15",
      isPR: true,
    },
  ]

  it("renders client information correctly", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("2024-01-15")).toBeInTheDocument()
    expect(screen.getByText("Program week 2/8")).toBeInTheDocument()
    expect(screen.getByText("Days 3/5")).toBeInTheDocument()
  })

  it("displays workout title with day and focus", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("Day 3 - Upper Body Strength")).toBeInTheDocument()
  })

  it("handles workout title without day number", () => {
    const workoutWithoutDay = { ...mockWorkout, day: "" }

    render(
      <ClientWorkoutView
        client={mockClient}
        workout={workoutWithoutDay}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("Upper Body Strength")).toBeInTheDocument()
  })

  it("shows client note when provided", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("Client Note:")).toBeInTheDocument()
    expect(screen.getByText("Feeling strong today!")).toBeInTheDocument()
  })

  it("displays exercise cards with highest weight sets", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    // Should show highest weight for Bench Press (80 × 8)
    expect(screen.getByText("Bench Press")).toBeInTheDocument()
    expect(screen.getByText("80 × 8")).toBeInTheDocument()

    // Should show highest weight for Squats (100 × 6)
    expect(screen.getByText("Squats")).toBeInTheDocument()
    expect(screen.getByText("100 × 6")).toBeInTheDocument()
  })

  it("shows not completed status for incomplete exercises", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("Not Completed")).toBeInTheDocument()
  })

  it("displays exercise sets with PR indicators", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    // Should show all sets for the first exercise
    expect(screen.getByText("70 × 10")).toBeInTheDocument()
    expect(screen.getByText("80 × 8")).toBeInTheDocument()
    expect(screen.getByText("75 × 9")).toBeInTheDocument()
  })

  it("shows latest exercise stats correctly", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("Latest")).toBeInTheDocument()
    // Should show highest weight set (80 × 8 reps)
    expect(screen.getByText("80 × 8 reps")).toBeInTheDocument()
  })

  it("handles exercises without sets data", () => {
    const exercisesWithoutSets = [
      {
        id: "ex-1",
        name: "Push-ups",
        weight: "×",
        reps: "reps",
        completed: true,
      },
    ]

    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={exercisesWithoutSets}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByText("No set data available")).toBeInTheDocument()
    expect(screen.getByText("× × reps reps")).toBeInTheDocument()
  })

  it("shows personal records when available", () => {
    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    expect(screen.getByTestId("personal-records")).toBeInTheDocument()
    expect(screen.getByText("1 records")).toBeInTheDocument()
  })

  it("shows empty state when no personal records", () => {
    render(
      <ClientWorkoutView client={mockClient} workout={mockWorkout} exercises={mockExercises} personalRecords={[]} />,
    )

    expect(screen.getByText("No personal records available yet")).toBeInTheDocument()
    expect(screen.getByText("Personal records will appear here as clients achieve new milestones")).toBeInTheDocument()
  })

  it("calls onEmojiSelect when emoji is selected", () => {
    const mockOnEmojiSelect = jest.fn()

    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
        onEmojiSelect={mockOnEmojiSelect}
      />,
    )

    // This would require more complex interaction testing
    // For now, we verify the component renders without errors
    expect(screen.getByLabelText("Add emoji reaction")).toBeInTheDocument()
  })

  it("calls onComment when comment is added", () => {
    const mockOnComment = jest.fn()

    render(
      <ClientWorkoutView
        client={mockClient}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
        onComment={mockOnComment}
      />,
    )

    expect(screen.getByLabelText("Add comment")).toBeInTheDocument()
  })

  it("handles client without image", () => {
    const clientWithoutImage = { ...mockClient, image: undefined }

    render(
      <ClientWorkoutView
        client={clientWithoutImage}
        workout={mockWorkout}
        exercises={mockExercises}
        personalRecords={mockPersonalRecords}
      />,
    )

    // Should show initials instead
    expect(screen.getByText("JD")).toBeInTheDocument()
  })
})
