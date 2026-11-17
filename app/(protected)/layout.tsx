import { auth } from '@/lib/auth'
import { healthCheck } from '@/lib/health'
import { redirect } from 'next/navigation'
import { ConnectivityProvider } from '@/components/ConnectivityProvider'
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const health = await healthCheck()

  return <ConnectivityProvider initialConnected={health.success}>
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-900">
      <ConnectivityBanner />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  </ConnectivityProvider>
}
