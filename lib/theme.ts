// Browser utilities for the later Views-phase toggle.
export type Theme = 'dark' | 'light'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* The system preference also works when storage is disabled. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try { window.localStorage.setItem('theme', theme) } catch { /* Keep the in-memory theme. */ }
}

export function initTheme() { setTheme(getTheme()) }
