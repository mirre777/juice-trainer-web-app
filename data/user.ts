// Placeholder for data/user.ts
export async function getUserByEmail(email: string) {
  // Mock user data
  if (email === "test@example.com") {
    return {
      id: "user1",
      email: "test@example.com",
      password: "hashed_password",
      emailVerified: true,
      isTwoFactorEnabled: false,
    }
  }
  return null
}

export async function getUserById(id: string) {
  // Mock user data
  if (id === "user1") {
    return {
      id: "user1",
      email: "test@example.com",
      password: "hashed_password",
      emailVerified: true,
      isTwoFactorEnabled: false,
    }
  }
  return null
}
