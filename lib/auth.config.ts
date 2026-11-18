import type { NextAuthConfig } from 'next-auth'
import { env } from './env'

// Kept independent of Prisma so session verification does not need a database connection.
export const authConfig = {
  secret: env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
} satisfies NextAuthConfig
