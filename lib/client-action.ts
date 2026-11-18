import { unstable_rethrow } from 'next/navigation'
import type { ActionResult } from './action-result'

// Network failures must leave the form usable; framework redirects still propagate.
export async function requestAction<T>(operation: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try { return await operation() }
  catch (error) {
    unstable_rethrow(error)
    return { success: false, code: 'DB_UNREACHABLE', error: 'Unable to connect. Check your connection and try again.' }
  }
}
