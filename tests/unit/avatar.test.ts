import { describe, expect, it } from 'vitest'
import { assignAvatarColor, deriveInitials, getAvatarColor, AVATAR_PALETTE, getAvatarTextColor } from '@/lib/avatar'

describe('avatar helpers', () => {
  it('has eight deterministic color choices', () => {
    expect(AVATAR_PALETTE).toHaveLength(8)
    expect(assignAvatarColor('alice@example.com')).toBe(assignAvatarColor('alice@example.com'))
    expect(new Set(['a', 'b', 'c', 'd'].map(assignAvatarColor)).size).toBeGreaterThan(1)
    for (const email of ['alice@example.com', '', 'Ä@example.com']) {
      expect(assignAvatarColor(email)).toBeGreaterThanOrEqual(0)
      expect(assignAvatarColor(email)).toBeLessThan(8)
    }
    expect(getAvatarColor(-1)).toBe(AVATAR_PALETTE[7])
    expect(getAvatarColor(8)).toBe(AVATAR_PALETTE[0])
    expect(getAvatarColor(NaN)).toBe(AVATAR_PALETTE[0])
  })
  it.each([['Alice Bob', 'AB'], ['Charlie', 'C'], ['Alice Bob Carol', 'AB'], ['  Alice  ', 'A'], ['a b c d', 'AB'], ['', '']])('derives initials from %s', (name, expected) => {
    expect(deriveInitials(name)).toBe(expected)
  })
  it('chooses legible text for every palette background', () => {
    for (const color of AVATAR_PALETTE) expect(getAvatarTextColor(color)).toBe('#000000')
    expect(getAvatarTextColor('#1e1b4b')).toBe('#ffffff')
  })
})
