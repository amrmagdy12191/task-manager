'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface ConnectivityState {
  isConnected: boolean
  dismissed: boolean
  dismiss: () => void
  retry: () => Promise<void>
}

const ConnectivityContext = createContext<ConnectivityState | null>(null)

export function useConnectivity() { return useContext(ConnectivityContext) }

export function ConnectivityProvider({ initialConnected, children }: { initialConnected: boolean; children: React.ReactNode }) {
  const [isConnected, setConnected] = useState(initialConnected)
  const [dismissed, setDismissed] = useState(false)
  const active = useRef(true)
  const pending = useRef<AbortController | null>(null)

  const retry = useCallback(async () => {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    const timeout = setTimeout(() => controller.abort(), 4_000)
    try {
      const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal })
      if (active.current) {
        setConnected(response.ok)
        if (response.ok) setDismissed(false)
      }
    } catch {
      if (active.current) setConnected(false)
    } finally {
      clearTimeout(timeout)
      if (pending.current === controller) pending.current = null
    }
  }, [])

  useEffect(() => {
    active.current = true
    const initial = setTimeout(() => { void retry() }, 0)
    const interval = setInterval(() => { void retry() }, 30_000)
    return () => {
      active.current = false
      clearTimeout(initial)
      clearInterval(interval)
      pending.current?.abort()
      pending.current = null
    }
  }, [retry])

  return <ConnectivityContext.Provider value={{ isConnected, dismissed, dismiss: () => setDismissed(true), retry }}>
    {children}
  </ConnectivityContext.Provider>
}
