import { auth } from '@/lib/auth'
import { healthCheck } from '@/lib/health'
import { redirect } from 'next/navigation'
import { ConnectivityProvider } from '@/components/ConnectivityProvider'
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner'
import { getSession } from '@/lib/actions/session'
import { getAvatarColor, deriveInitials } from '@/lib/avatar'
import UserMenu from '@/components/ui/UserMenu'
import Link from 'next/link'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const [health, identity] = await Promise.all([healthCheck(), getSession()])
  const displayName = identity.success ? identity.data.displayName : session.user.name ?? 'User'

  return <ConnectivityProvider initialConnected={health.success}>
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-900">
      <ConnectivityBanner />
      <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-8 dark:border-gray-800 dark:bg-gray-900">
        <Link href="/" className="shrink-0 text-lg font-bold text-indigo-700 dark:text-indigo-300">TaskFlow</Link>
        <UserMenu displayName={displayName} avatarInitials={identity.success ? identity.data.avatarInitials : deriveInitials(displayName)} avatarColorHex={getAvatarColor(identity.success ? identity.data.avatarColorIndex : 0)} />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  </ConnectivityProvider>
}
