import { getAvatarTextColor } from '@/lib/avatar'

interface AvatarBadgeProps { initials: string; colorHex: string; size?: 'sm' | 'md' | 'lg' }
const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' }

export default function AvatarBadge({ initials, colorHex, size = 'md' }: AvatarBadgeProps) {
  return <span aria-hidden="true" style={{ backgroundColor: colorHex, color: getAvatarTextColor(colorHex) }} className={`${sizes[size]} flex shrink-0 select-none items-center justify-center rounded-full font-semibold uppercase`}>{initials.slice(0, 2)}</span>
}
