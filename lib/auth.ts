import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { env } from './env'
import { authConfig } from './auth.config'
import { authorizeCredentials } from './credentials'

export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  ...authConfig,
  adapter: env.DATA_SOURCE === 'postgres' ? PrismaAdapter((await import('./db')).db) : undefined,
  providers: [Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: authorizeCredentials,
  })],
}))
