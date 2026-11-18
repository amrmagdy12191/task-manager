import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'
import { routeRedirect } from '@/lib/redirects'

const { auth } = NextAuth(authConfig)

export const proxy = auth((request) => {
  // Actions authorize themselves and return typed UNAUTHORIZED results. Redirecting
  // their POST here breaks the action protocol and hides expired-session feedback.
  if (request.method === 'POST' && request.headers.has('next-action')) return NextResponse.next()
  const redirect = routeRedirect(request.nextUrl, !!request.auth?.user?.id)
  return redirect ? NextResponse.redirect(redirect) : NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
