export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'DB_UNREACHABLE' | 'NOT_FOUND' | 'SIGN_UP_FAILED' | 'WRONG_PASSWORD' | 'RATE_LIMITED' | 'DB_ERROR'; fieldErrors?: Record<string, string[]> }
