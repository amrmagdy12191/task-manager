import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env-schema'

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/taskflow',
  NEXTAUTH_SECRET: 'x'.repeat(40),
  NEXTAUTH_URL: 'http://localhost:3000',
}

describe('startup environment validation', () => {
  it('parses valid configuration', () => {
    expect(parseEnv(valid)).toMatchObject(valid)
  })
  it('allows demo mode without a database URL', () => {
    const { DATABASE_URL: unused, ...demo } = valid
    void unused
    expect(parseEnv({ ...demo, DATA_SOURCE: 'demo' })).toMatchObject({ DATA_SOURCE: 'demo' })
  })
  it('still requires the database URL in PostgreSQL mode', () => {
    expect(() => parseEnv({ ...valid, DATA_SOURCE: 'postgres', DATABASE_URL: undefined })).toThrow(/DATABASE_URL/)
    expect(() => parseEnv({ ...valid, DATA_SOURCE: 'invalid' })).toThrow(/DATA_SOURCE/)
  })
  it('names all missing settings without leaking values', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*NEXTAUTH_SECRET[\s\S]*NEXTAUTH_URL/)
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'invalid-private-value' })).toThrow(/DATABASE_URL/)
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'invalid-private-value' })).not.toThrow(/invalid-private-value/)
  })
  it('rejects invalid database protocols, short secrets and non-http origins', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'https://example.com' })).toThrow()
    expect(() => parseEnv({ ...valid, NEXTAUTH_SECRET: 'short' })).toThrow()
    expect(() => parseEnv({ ...valid, NEXTAUTH_URL: 'javascript:alert(1)' })).toThrow()
  })
})
