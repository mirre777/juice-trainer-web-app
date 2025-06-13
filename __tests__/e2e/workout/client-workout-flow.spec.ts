import { test, expect } from "@playwright/test"

test.describe("Client Workout Data Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase authentication
    await page.addInitScript(() => {
      window.localStorage.setItem("auth-token", "mock-token")
    })

    // Mock API responses
    await page.route("**/api/workouts/**", async (route) => {
      const url = route.request().url()

      if (url.includes("/workouts/latest")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workout: {
              id: "workout-1",
              name: "Upper Body Strength",
              day: "3",
              focus: "Upper Body Strength",
              exercises: [
                {
                  id: "ex-1",
                  name: "Bench Press",
                  weight: "80",
                  reps: "8",
                  completed: true,
                  sets: [
                    { number: 1, weight: "70", reps: "10" },
                    { number: 2, weight: "80", reps: "8", isPR: true },
                    { number: 3, weight: "75", reps: "9" },
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
              ],
              personalRecords: [
                {
                  exercise: "Bench Press",
                  weight: "80 kg",
                  reps: "8",
                  date: "Jan 13, 2024",
                  isPR: true,
                },
              ],
            },
          }),
        })
      } else if (url.includes("/workouts/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workout: {
              id: "workout-1",
              name: "Upper Body Strength",
              day: "3",
              focus: "Upper Body Strength",
              clientName: "John Doe",
              date: "Jan 13, 2024",
              exercises: [
                {
                  id: "ex-1",
                  name: "Bench Press",
                  sets: [
                    { number: 1, weight: "70", reps: "10" },
                    { number: 2, weight: "80", reps: "8", isPR: true },
                    { number: 3, weight: "75", reps: "9" },
                  ],
                },
              ],
            },
          }),
        })
      }
    })
  })

  test("displays workout data correctly on client workout page", async ({ page }) => {
    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    // Wait for the page to load
    await page.waitForSelector('[data-testid="client-workout-view"]', { timeout: 10000 })

    // Check workout title
    await expect(page.locator("h1")).toContainText("Day 3 - Upper Body Strength")

    // Check client information
    await expect(page.locator("text=John Doe")).toBeVisible()
    await expect(page.locator("text=Jan 13, 2024")).toBeVisible()

    // Check exercise cards
    await expect(page.locator("text=Bench Press")).toBeVisible()
    await expect(page.locator("text=Squats")).toBeVisible()

    // Check highest weight display in exercise cards
    await expect(page.locator("text=80 × 8")).toBeVisible()
    await expect(page.locator("text=100 × 6")).toBeVisible()

    // Check not completed status
    await expect(page.locator("text=Not Completed")).toBeVisible()
  })

  test("shows exercise details when exercise is selected", async ({ page }) => {
    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Click on Bench Press exercise card
    await page.click("text=Bench Press")

    // Check exercise details section
    await expect(page.locator("text=Latest")).toBeVisible()
    await expect(page.locator("text=80 × 8 reps")).toBeVisible()

    // Check sets display
    await expect(page.locator("text=Sets")).toBeVisible()
    await expect(page.locator("text=70 × 10")).toBeVisible()
    await expect(page.locator("text=80 × 8")).toBeVisible()
    await expect(page.locator("text=75 × 9")).toBeVisible()

    // Check PR indicator
    await expect(page.locator('[data-testid="trophy-icon"]')).toBeVisible()
  })

  test("displays personal records section", async ({ page }) => {
    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Check personal records section
    await expect(page.locator("text=Recent Personal Records")).toBeVisible()
    await expect(page.locator("text=Bench Press")).toBeVisible()
    await expect(page.locator("text=80 kg")).toBeVisible()
    await expect(page.locator("text=8")).toBeVisible()
  })

  test("shows empty state when no personal records", async ({ page }) => {
    // Mock empty personal records
    await page.route("**/api/workouts/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workout: {
            id: "workout-1",
            name: "Upper Body Strength",
            day: "3",
            focus: "Upper Body Strength",
            exercises: [],
            personalRecords: [],
          },
        }),
      })
    })

    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Check empty state
    await expect(page.locator("text=No personal records available yet")).toBeVisible()
    await expect(page.locator("text=Personal records will appear here as clients achieve new milestones")).toBeVisible()
  })

  test("handles workout data loading states", async ({ page }) => {
    // Mock slow API response
    await page.route("**/api/workouts/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workout: {
            id: "workout-1",
            name: "Upper Body Strength",
            exercises: [],
          },
        }),
      })
    })

    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    // Check loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    // Wait for content to load
    await page.waitForSelector("text=Upper Body Strength", { timeout: 5000 })
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test("handles workout data error states", async ({ page }) => {
    // Mock API error
    await page.route("**/api/workouts/**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Failed to fetch workout data",
        }),
      })
    })

    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    // Check error state
    await expect(page.locator("text=Error loading workout data")).toBeVisible()
    await expect(page.locator("text=Please try again later")).toBeVisible()
  })

  test("navigates to exercise history", async ({ page }) => {
    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Click on "View history" link
    await page.click("text=View history")

    // Check navigation to exercise history page
    await expect(page).toHaveURL(/\/demo\/exercise-history\/ex-1/)
  })

  test("interacts with emoji and comment buttons", async ({ page }) => {
    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Test emoji button
    await page.click('[aria-label="Add emoji reaction"]')
    await expect(page.locator('[data-testid="emoji-picker"]')).toBeVisible()

    // Test comment button
    await page.click('[aria-label="Add comment"]')
    // This would trigger the onComment callback in a real implementation
  })

  test("scrolls through exercise cards when overflow", async ({ page }) => {
    // Mock workout with many exercises
    await page.route("**/api/workouts/**", async (route) => {
      const exercises = Array.from({ length: 10 }, (_, i) => ({
        id: `ex-${i + 1}`,
        name: `Exercise ${i + 1}`,
        weight: "50",
        reps: "10",
        completed: true,
        sets: [{ number: 1, weight: "50", reps: "10" }],
      }))

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workout: {
            id: "workout-1",
            name: "Full Body Workout",
            exercises,
          },
        }),
      })
    })

    await page.goto("/demo/client-workout2/users/user-123/workouts/workout-1")

    await page.waitForSelector('[data-testid="client-workout-view"]')

    // Check scroll arrows appear
    await expect(page.locator('[data-testid="scroll-right-arrow"]')).toBeVisible()

    // Click scroll right
    await page.click('[data-testid="scroll-right-arrow"]')

    // Check left arrow appears after scrolling
    await expect(page.locator('[data-testid="scroll-left-arrow"]')).toBeVisible()
  })
})
