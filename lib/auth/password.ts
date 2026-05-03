import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

// ─── Hash ─────────────────────────────────────────────────────────────────────

export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS)
}

// ─── Compare ──────────────────────────────────────────────────────────────────

export async function comparePassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  if (!plaintext || !hash) return false
  return bcrypt.compare(plaintext, hash)
}

// ─── Validate Password Strength ───────────────────────────────────────────────

export interface PasswordValidation {
  valid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) errors.push('At least 8 characters required')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required')
  if (!/[0-9]/.test(password)) errors.push('At least one number required')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least one special character required')

  return { valid: errors.length === 0, errors }
}
