export function initials(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('')
}
