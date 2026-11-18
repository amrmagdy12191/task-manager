import { z } from 'zod'

const password = z.string().min(8, 'Password must be at least 8 characters.').refine(
  (value) => new TextEncoder().encode(value).length <= 72,
  'Password must be at most 72 bytes.',
)
const name = z.string().trim().min(1, 'Display name is required.').max(100, 'Use at most 100 characters.')

export const signUpSchema = z.object({
  name,
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password,
})
export const profileSchema = z.object({
  displayName: name,
  avatarInitials: z.string().trim().min(1, 'Avatar initials are required.').max(2, 'Use at most 2 initials.').transform((value) => value.toUpperCase()),
  avatarColorIndex: z.number().int().min(0).max(7),
})
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: password,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    result[key] = [...(result[key] ?? []), issue.message]
  }
  return result
}
