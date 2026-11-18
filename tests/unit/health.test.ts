import { beforeEach, describe, expect, it, vi } from 'vitest'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('@/lib/data', () => ({ checkDataConnection: query }))
import { GET } from '@/app/api/health/route'

beforeEach(() => { query.mockReset() })

describe('public health endpoint', () => {
  it('returns an uncached successful response when PostgreSQL is reachable', async () => {
    query.mockResolvedValue([{ '?column?': 1 }])
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok' })
  })
  it('returns 503 without disclosing connection details', async () => {
    query.mockRejectedValue(new Error('private database connection details'))
    const response = await GET()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'error', message: 'Database unreachable' })
  })
})
