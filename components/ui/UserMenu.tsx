'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { signOutAction } from '@/lib/actions/auth'
import AvatarBadge from './AvatarBadge'

interface UserMenuProps { displayName: string; avatarInitials: string; avatarColorHex: string }

export default function UserMenu({ displayName, avatarInitials, avatarColorHex }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    function outside(event: MouseEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  return <div ref={root} className="relative min-w-0" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={(event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      trigger.current?.focus()
    }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
      const current = items.indexOf(document.activeElement as HTMLElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[next]?.focus()
    }
  }}>
    <button ref={trigger} type="button" aria-label={`User menu for ${displayName}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(!open)} onKeyDown={(event) => { if (!open && event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}
      className="flex max-w-full items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-gray-100 dark:hover:bg-gray-800">
      <AvatarBadge initials={avatarInitials} colorHex={avatarColorHex} size="sm" />
      <span className="max-w-36 truncate sm:max-w-64">{displayName}</span><span aria-hidden="true">⌄</span>
    </button>
    {open && <div ref={menu} id={menuId} role="menu" aria-label="Account" className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="block rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700">Profile</Link>
      <form action={signOutAction}>
        <button type="submit" role="menuitem" className="block w-full rounded px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700">Sign out</button>
      </form>
    </div>}
  </div>
}
