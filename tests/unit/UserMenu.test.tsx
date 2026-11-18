import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UserMenu from '@/components/ui/UserMenu'

vi.mock('@/lib/actions/auth', () => ({ signOutAction: vi.fn() }))

function setup() { render(<UserMenu displayName="Alice Bob" avatarInitials="AB" avatarColorHex="#6366f1" />) }

describe('UserMenu', () => {
  it('shows identity, toggles the menu and links to the profile', async () => {
    setup()
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'User menu for Alice Bob' })
    expect(trigger).toHaveTextContent('Alice Bob')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/profile')
    await user.click(trigger)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on an outside click', async () => {
    setup()
    await userEvent.click(screen.getByRole('button'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('supports arrow navigation and Escape restores trigger focus', async () => {
    setup()
    const user = userEvent.setup()
    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
