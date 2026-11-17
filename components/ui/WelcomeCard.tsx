'use client'

import { useConnectivity } from '@/components/ConnectivityProvider'
import { initials } from '@/lib/initials'

interface WelcomeCardProps { displayName: string; email: string; isConnected: boolean }

export function WelcomeCard({ displayName, email, isConnected }: WelcomeCardProps) {
  const connection = useConnectivity()
  const connected = connection?.isConnected ?? isConnected

  return <section aria-labelledby="welcome-title" className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-6 flex items-center gap-4">
      <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">{initials(displayName)}</div>
      <div className="min-w-0">
        <h1 id="welcome-title" className="break-words text-xl font-semibold text-gray-900 dark:text-white">Welcome back, {displayName}</h1>
        <p className="break-all text-sm text-gray-500 dark:text-gray-400">{email}</p>
      </div>
    </div>
    <p role="status" className={`flex items-center gap-2 text-sm ${connected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      {connected ? 'Connected' : 'Disconnected'}
    </p>
  </section>
}
