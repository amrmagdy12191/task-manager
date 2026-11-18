'use client'

import { useConnectivity } from '@/components/ConnectivityProvider'

export function ConnectivityBanner() {
  const connection = useConnectivity()
  if (!connection || connection.isConnected || connection.dismissed) return null

  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
    <span>Unable to reach the server. Data shown may be stale.</span>
    <div className="flex shrink-0 gap-4">
      <button type="button" onClick={() => { void connection.retry() }} className="rounded font-medium underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Retry</button>
      <button type="button" onClick={connection.dismiss} aria-label="Dismiss connectivity warning" className="rounded font-medium underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Dismiss</button>
    </div>
  </div>
}
