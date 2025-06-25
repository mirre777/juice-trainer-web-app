// Placeholder for lib/api/user.ts
export async function updateUserSettings(settings: {
  userId: string
  name: string
  receiveEmailNotifications: boolean
}) {
  // Simulate API call
  console.log("Updating user settings:", settings)
  return {
    id: settings.userId,
    name: settings.name,
    email: "mock@example.com",
    receiveEmailNotifications: settings.receiveEmailNotifications,
  }
}
