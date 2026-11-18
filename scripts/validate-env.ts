import nextEnv from '@next/env'
import { parseEnv } from '../lib/env-schema'

nextEnv.loadEnvConfig(process.cwd())
parseEnv(process.env)
