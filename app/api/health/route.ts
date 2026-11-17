import { NextResponse } from 'next/server'
import { healthCheck } from '@/lib/health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await healthCheck()
  return NextResponse.json(
    result.success ? { status: 'ok' } : { status: 'error', message: 'Database unreachable' },
    { status: result.success ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
