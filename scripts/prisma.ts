import nextEnv from '@next/env'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

nextEnv.loadEnvConfig(process.cwd())
const require = createRequire(import.meta.url)
const result = spawnSync(process.execPath, [require.resolve('prisma'), ...process.argv.slice(2)], {
  env: process.env,
  stdio: 'inherit',
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
