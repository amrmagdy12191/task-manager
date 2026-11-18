export const AVATAR_PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'] as const

export function getAvatarColor(index: number): string {
  const normalized = Number.isFinite(index) ? ((Math.trunc(index) % 8) + 8) % 8 : 0
  return AVATAR_PALETTE[normalized] ?? AVATAR_PALETTE[0]
}

export function assignAvatarColor(email: string): number {
  let hash = 5381
  for (const character of email.trim().toLowerCase()) hash = (Math.imul(hash, 33) + (character.codePointAt(0) ?? 0)) >>> 0
  return hash % 8
}

export function deriveInitials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]?.toUpperCase() ?? '').join('').slice(0, 2)
}

export function getAvatarTextColor(hex: string): string {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722
  return 1.05 / (luminance + 0.05) >= 4.5 ? '#ffffff' : '#000000'
}
