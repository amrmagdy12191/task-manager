import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/ui/SignInForm'
import { safeCallbackUrl } from '@/lib/redirects'
import Link from 'next/link'

export const metadata = { title: 'Sign In | TaskFlow' }

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string | string[]; reason?: string }>
}) {
  const session = await auth()
  if (session?.user?.id) redirect('/')
  const { callbackUrl, reason } = await searchParams

  return <main className="flex min-h-dvh items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
    <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title" className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">Sign in to TaskFlow</h1>
      {reason === 'session-expired' && <p role="status" className="mb-5 text-sm text-gray-700 dark:text-gray-300">Your session ended. Please sign in again.</p>}
      <SignInForm callbackUrl={safeCallbackUrl(typeof callbackUrl === 'string' ? callbackUrl : undefined)} />
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">New to TaskFlow? <Link href="/sign-up" className="font-medium text-indigo-700 underline dark:text-indigo-300">Create an account</Link></p>
    </section>
  </main>
}
