// Bound response time even when an established database socket stops responding.
// Prisma still owns the underlying query; callers must not use this for writes/retries.
export async function databaseRead<T>(query: PromiseLike<T>, timeoutMs = 2_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Database read timed out')), timeoutMs)
      }),
    ])
  } finally { clearTimeout(timer) }
}
