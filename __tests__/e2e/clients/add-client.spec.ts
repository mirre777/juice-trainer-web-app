import { test, expect } from "@playwright/test"

test.describe("Add Client Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login")
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')

    // Wait for login to complete and redirect
    await page.waitForURL("**/overview")

    // Navigate to clients page
    await page.click("text=Clients")
    await page.waitForURL("**/clients")
  })

  test("should display the clients page", async ({ page }) => {
    // Check that we're on the clients page
    await expect(page).toHaveURL(/.*\/clients/)

    // Check that the page title is visible
    await expect(page.locator('h1:has-text("Clients")')).toBeVisible()

    // Check that the add client button is visible
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible()
  })

  test("should open the add client modal when clicking the add client button", async ({ page }) => {
    // Click the add client button
    await page.click('button:has-text("Add Client")')

    // Check that the modal is visible
    await expect(page.locator('div:has-text("Add New Client")')).toBeVisible()

    // Check that the form fields are visible
    await expect(page.locator('label:has-text("Full Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("Goal")')).toBeVisible()
    await expect(page.locator('button:has-text("Select a program")')).toBeVisible()
  })

  test("should validate required fields in the add client form", async ({ page }) => {
    // Click the add client button
    await page.click('button:has-text("Add Client")')

    // Submit the form without filling required fields
    await page.click('button:has-text("Add Client"):not(:has-text("Add Client Button"))')

    // Check that the validation error is visible
    await expect(page.locator("text=Name is required")).toBeVisible()
  })

  test("should add a new client successfully", async ({ page }) => {
    // Click the add client button
    await page.click('button:has-text("Add Client")')

    // Fill out the form
    await page.fill('input[id="fullName"]', "John Doe")
    await page.fill('input[id="email"]', "john@example.com")
    await page.fill('textarea[id="goal"]', "Get stronger")

    // Open the program dropdown and select an option
    await page.click('button:has-text("Select a program")')
    await page.click("text=Strength Training")

    // Submit the form
    await page.click('button:has-text("Add Client"):not(:has-text("Add Client Button"))')

    // Check that the invitation dialog is visible
    await expect(page.locator("text=Invite John Doe")).toBeVisible()

    // Close the invitation dialog
    await page.click('button:has-text("Done")')

    // Check that the client is added to the list
    await expect(page.locator("text=John Doe")).toBeVisible()
  })

  test("should filter clients using the search bar", async ({ page }) => {
    // Assume we have at least one client named "John Doe"

    // Type in the search bar
    await page.fill('input[placeholder="Search clients..."]', "John")

    // Check that only matching clients are shown
    await expect(page.locator("text=John Doe")).toBeVisible()
    await expect(page.locator("text=Jane Smith")).not.toBeVisible()
  })

  test("should filter clients by status", async ({ page }) => {
    // Click the status filter dropdown
    await page.click('button:has-text("All")')

    // Select "Active" status
    await page.click("text=Active")

    // Check that only active clients are shown
    await expect(page.locator("text=Active")).toBeVisible()
    await expect(page.locator("text=Pending")).not.toBeVisible()
  })

  test("should navigate to client details when clicking on a client", async ({ page }) => {
    // Click on a client card
    await page.click('div:has-text("John Doe")')

    // Check that we're on the client details page
    await page.waitForURL("**/clients/*")

    // Check that the client name is visible
    await expect(page.locator('h1:has-text("John Doe")')).toBeVisible()
  })
})
