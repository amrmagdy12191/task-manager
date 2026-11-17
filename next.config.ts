import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: { '/*': ['./data/demo-data.json'] },
}
export default nextConfig
