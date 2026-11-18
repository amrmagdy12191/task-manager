import { defineConfig, devices } from '@playwright/test'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3010', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start -- --port 3010',
    url: 'http://localhost:3010/api/auth/session',
    reuseExistingServer: false,
    env: { DATA_SOURCE: 'demo', DEMO_DATA_FILE: '.cache/e2e-demo.json', NEXTAUTH_URL: 'http://localhost:3010', TRUST_PROXY_HEADERS: 'true' },
    timeout: 120_000,
  },
})
