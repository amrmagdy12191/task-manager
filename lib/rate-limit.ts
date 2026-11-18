import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import { isIP } from 'node:net'

const shared = globalThis as unknown as { signInLimiter?: RateLimiterMemory }
export const rateLimiter = shared.signInLimiter ??= new RateLimiterMemory({ points: 10, duration: 60 })

export async function checkRateLimit(ip: string): Promise<void> {
  try { await rateLimiter.consume(ip) }
  catch (error) {
    if (error instanceof RateLimiterRes) throw new Error('RATE_LIMITED')
    throw error
  }
}

export function clientIp(headers: Headers, trustProxy: boolean): string {
  if (!trustProxy) return '127.0.0.1'
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  return isIP(ip) ? ip : 'unknown'
}
