import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WelcomeCard } from '@/components/ui/WelcomeCard'

describe('WelcomeCard', () => {
  it('renders identity and whitespace-normalized initials', () => {
    render(<WelcomeCard displayName="Alice   Smith" email="alice@example.com" isConnected />)
    expect(screen.getByRole('heading')).toHaveTextContent('Welcome back, Alice Smith')
    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })
  it.each([true, false])('shows connection state %s in text', (isConnected) => {
    render(<WelcomeCard displayName="Alice" email="a@b.com" isConnected={isConnected} />)
    expect(screen.getByText(isConnected ? 'Connected' : 'Disconnected')).toBeInTheDocument()
  })
})
