import { checkDataConnection } from './data'
import type { ActionResult } from './action-result'

// Public liveness exception: no user data is accessed.
export async function healthCheck(): Promise<ActionResult<{ db: 'ok' }>> {
  try {
    await checkDataConnection()
    return { success: true, data: { db: 'ok' } }
  } catch {
    return { success: false, error: 'Database unavailable', code: 'DB_UNREACHABLE' }
  }
}
