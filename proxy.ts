import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'
import { routeRedirect } from '@/lib/redirects'

const { auth } = NextAuth(authConfig)

export const proxy = auth((request) => {
  const redirect = routeRedirect(request.nextUrl, !!request.auth?.user?.id)
  return redirect ? NextResponse.redirect(redirect) : NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
