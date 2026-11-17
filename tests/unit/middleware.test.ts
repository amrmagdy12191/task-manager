import { describe, expect, it } from 'vitest'
import { routeRedirect, safeCallbackUrl } from '@/lib/redirects'

describe('route protection', () => {
  it('preserves pathname and query string', () => {
    const redirect = routeRedirect(new URL('http://localhost:3000/board?q=mine&sort=due'), false)
    expect(redirect?.pathname).toBe('/sign-in')
    expect(redirect?.searchParams.get('callbackUrl')).toBe('/board?q=mine&sort=due')
  })
  it.each(['/api/health', '/api/auth/session', '/sign-in'])('allows public route %s', (path) => {
    expect(routeRedirect(new URL(path, 'http://localhost'), false)).toBeNull()
  })
  it.each(['/api/health-private', '/api/auth-other', '/sign-in-private'])('protects lookalike route %s', (path) => {
    expect(routeRedirect(new URL(path, 'http://localhost'), false)?.pathname).toBe('/sign-in')
  })
  it('redirects authenticated sign-in visits home', () => {
    expect(routeRedirect(new URL('http://localhost/sign-in'), true)?.pathname).toBe('/')
    expect(routeRedirect(new URL('http://localhost/board'), true)).toBeNull()
  })
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/%2f%2fevil.example', 'javascript:alert(1)', '/sign-in', '/api/auth/signout', '/%00bad'])('rejects unsafe callback %s', (url) => {
    expect(safeCallbackUrl(url)).toBe('/')
  })
  it('accepts local callback paths with queries', () => {
    expect(safeCallbackUrl('/board?filter=mine')).toBe('/board?filter=mine')
  })
})
