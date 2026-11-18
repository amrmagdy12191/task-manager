import { afterEach, describe, expect, it, vi } from 'vitest'
import { databaseRead } from '@/lib/db-timeout'

afterEach(() => { vi.useRealTimers() })

describe('database response deadline', () => {
  it('bounds reads on a stalled connection', async () => {
    vi.useFakeTimers()
    const result = expect(databaseRead(new Promise<never>(() => {}))).rejects.toThrow('Database read timed out')
    await vi.advanceTimersByTimeAsync(2_000)
    await result
    expect(vi.getTimerCount()).toBe(0)
  })
  it('clears the deadline after a successful query', async () => {
    vi.useFakeTimers()
    expect(await databaseRead(Promise.resolve('ok'))).toBe('ok')
    expect(vi.getTimerCount()).toBe(0)
  })
})
