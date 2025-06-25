// Placeholder for lib/tokens.ts
export async function generateVerificationToken(email: string) {
  return { email, token: "dummy_verification_token", expires: new Date() }
}
export async function generatePasswordResetToken(email: string) {
  return { email, token: "dummy_password_reset_token", expires: new Date() }
}
export async function generateTwoFactorToken(email: string) {
  return { email, token: "dummy_two_factor_token", expires: new Date() }
}
