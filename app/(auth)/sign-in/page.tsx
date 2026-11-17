import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/ui/SignInForm'
import { safeCallbackUrl } from '@/lib/redirects'

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
  const session = await auth()
  if (session?.user?.id) redirect('/')
  const { callbackUrl } = await searchParams

  return <main className="flex min-h-dvh items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
    <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title" className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">Sign in to TaskFlow</h1>
      <SignInForm callbackUrl={safeCallbackUrl(typeof callbackUrl === 'string' ? callbackUrl : undefined)} />
    </section>
  </main>
}
