// Placeholder for lib/tokens.ts
export async function generateVerificationToken(email: string) {
  return { email, token: "mock_verification_token", expires: new Date(Date.now() + 3600 * 1000) }
}
export async function generatePasswordResetToken(email: string) {
  return { email, token: "mock_password_reset_token", expires: new Date(Date.now() + 3600 * 1000) }
}
export async function generateTwoFactorToken(email: string) {
  return { email, token: "mock_two_factor_token", expires: new Date(Date.now() + 300 * 1000) }
}
