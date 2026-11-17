import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Link from 'next/link'
import { ConnectivityProvider } from '@/components/ConnectivityProvider'
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner'
import { WelcomeCard } from '@/components/ui/WelcomeCard'

afterEach(() => { vi.unstubAllGlobals() })

function renderStatus() {
  return render(<ConnectivityProvider initialConnected>
    <ConnectivityBanner />
    <WelcomeCard displayName="Alice" email="alice@example.com" isConnected />
    <Link href="/">Continue browsing</Link>
  </ConnectivityProvider>)
}

describe('connectivity state', () => {
  it('warns on failure and Retry updates both banner and card after recovery', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    renderStatus()
    expect(await screen.findByRole('alert')).toHaveTextContent('Data shown may be stale')
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })
  it('can be dismissed without blocking navigation or claiming to be connected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    renderStatus()
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss connectivity warning' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue browsing' })).toHaveAttribute('href', '/')
  })
})
