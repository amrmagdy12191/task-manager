import NextAuth, { CredentialsSignin } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { env } from './env'
import { authConfig } from './auth.config'
import { authorizeCredentials } from './credentials'
import { checkRateLimit, clientIp } from './rate-limit'

class RateLimited extends CredentialsSignin { code = 'RATE_LIMITED' }

export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  ...authConfig,
  adapter: env.DATA_SOURCE === 'postgres' ? PrismaAdapter((await import('./db')).db) : undefined,
  providers: [Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials, request) {
      try { await checkRateLimit(clientIp(request.headers, env.TRUST_PROXY_HEADERS)) }
      catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMITED') throw new RateLimited()
        throw error
      }
      return authorizeCredentials(credentials)
    },
  })],
}))
