import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  globalIgnores([
    'node_modules/**', '.next/**', '.cache/**', 'dist/**', 'build/**', 'coverage/**',
    'playwright-report/**', 'test-results/**', '**/*.min.js', 'next-env.d.ts',
  ]),
])
