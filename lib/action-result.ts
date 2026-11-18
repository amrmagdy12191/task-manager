export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'DB_UNREACHABLE' | 'NOT_FOUND' }
