import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const localEnv = loadEnv('development', process.cwd(), '')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 10_000,
    env: {
      DATA_SOURCE: 'postgres',
      DATABASE_URL: localEnv.DATABASE_URL ?? '',
      NEXTAUTH_SECRET: localEnv.NEXTAUTH_SECRET ?? '',
      NEXTAUTH_URL: localEnv.NEXTAUTH_URL ?? '',
    },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
})
