import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, clientIp, rateLimiter } from '@/lib/rate-limit'

afterEach(() => { vi.useRealTimers() })
describe('sign-in rate limiting', () => {
  it('allows ten attempts, blocks eleven, isolates IPs and expires the window', async () => {
    vi.useFakeTimers()
    const ip = '192.0.2.12'
    await rateLimiter.delete(ip)
    for (let count = 0; count < 10; count++) await checkRateLimit(ip)
    await expect(checkRateLimit(ip)).rejects.toThrow('RATE_LIMITED')
    await expect(checkRateLimit('192.0.2.13')).resolves.toBeUndefined()
    await vi.advanceTimersByTimeAsync(60_001)
    await expect(checkRateLimit(ip)).resolves.toBeUndefined()
  })
  it('only accepts forwarded IPs from an explicitly trusted proxy', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.0.2.1, 10.0.0.1' })
    expect(clientIp(headers, false)).toBe('127.0.0.1')
    expect(clientIp(headers, true)).toBe('192.0.2.1')
    expect(clientIp(new Headers({ 'x-forwarded-for': 'anything' }), true)).toBe('unknown')
  })
})
