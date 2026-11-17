'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { safeCallbackUrl } from '@/lib/redirects'

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirect: false,
      })
      if (!result?.ok || result.error) {
        setError('Invalid email or password.')
        return
      }
      router.push(safeCallbackUrl(callbackUrl))
      router.refresh()
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally { setLoading(false) }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

  return <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-5">
    {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</div>}
    <div>
      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
      <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} />
    </div>
    <div>
      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
      <input id="password" name="password" type="password" required maxLength={72} autoComplete="current-password" className={inputClass} />
    </div>
    <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
}
