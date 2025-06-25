// Placeholder for lib/mail.ts
export async function sendVerificationEmail(email: string, token: string) {
  console.log(`Sending verification email to ${email} with token ${token}`)
}
export async function sendTwoFactorEmail(email: string, token: string) {
  console.log(`Sending two-factor email to ${email} with token ${token}`)
}
export async function sendPasswordResetEmail(email: string, token: string) {
  console.log(`Sending password reset email to ${email} with token ${token}`)
}
