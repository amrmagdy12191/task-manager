import { getSession } from '@/lib/actions/session'
import { redirect } from 'next/navigation'
import { WelcomeCard } from '@/components/ui/WelcomeCard'
import { signOutAction } from '@/lib/actions/auth'

export default async function HomePage() {
  const result = await getSession()
  if (!result.success) redirect('/sign-in')

  return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
    <WelcomeCard
      displayName={result.data.displayName}
      email={result.data.email}
      isConnected={result.success}
    />
    <form action={signOutAction}>
      <button type="submit" className="rounded px-3 py-2 text-sm text-gray-600 underline hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-gray-400 dark:hover:text-white">Sign out</button>
    </form>
  </div>
}
