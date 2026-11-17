import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTheme, initTheme, setTheme } from '@/lib/theme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.unstubAllGlobals()
})

describe('theme preference', () => {
  it('persists and applies a selected theme', () => {
    setTheme('dark')
    expect(getTheme()).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    setTheme('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })
  it('falls back to the system for missing or invalid preferences', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    localStorage.setItem('theme', 'invalid')
    expect(getTheme()).toBe('dark')
    initTheme()
    expect(document.documentElement).toHaveClass('dark')
  })
  it('still applies the theme when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled') })
    expect(() => setTheme('dark')).not.toThrow()
    expect(document.documentElement).toHaveClass('dark')
  })
})
