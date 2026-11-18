export function safeCallbackUrl(value: string | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded)) return '/'
    const url = new URL(value, 'http://taskflow.local')
    if (url.origin !== 'http://taskflow.local' || ['/sign-in', '/sign-up'].includes(url.pathname) || url.pathname.startsWith('/api/auth')) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return '/' }
}

export function routeRedirect(url: URL, isLoggedIn: boolean): URL | null {
  const isSignIn = ['/sign-in', '/sign-up'].includes(url.pathname)
  const isPublic = isSignIn || url.pathname === '/api/health' || url.pathname === '/api/auth' || url.pathname.startsWith('/api/auth/')
  if (!isLoggedIn && !isPublic) {
    const target = new URL('/sign-in', url)
    target.searchParams.set('callbackUrl', `${url.pathname}${url.search}`)
    return target
  }
  return isLoggedIn && isSignIn ? new URL('/', url) : null
}
