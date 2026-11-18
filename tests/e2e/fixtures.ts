import { test as base, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'

export const test = base.extend({
  context: async ({ context }, provideContext) => {
    // The isolated test server trusts proxy headers. Each test gets an independent
    // simulated client IP while exercising the real production rate-limit path.
    const suffix = randomBytes(14).toString('hex').match(/.{4}/g)?.join(':') ?? '1'
    await context.setExtraHTTPHeaders({ 'x-forwarded-for': `fd00:${suffix}` })
    await provideContext(context)
  },
})
export { expect }
