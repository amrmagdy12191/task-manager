import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignUpForm } from '@/components/ui/SignUpForm'

export const metadata = { title: 'Sign Up | TaskFlow' }

export default async function SignUpPage() {
  if ((await auth())?.user?.id) redirect('/')
  return <main className="flex min-h-dvh items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
    <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="sign-up-title">
      <h1 id="sign-up-title" className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">Already have an account? <Link href="/sign-in" className="font-medium text-indigo-700 underline dark:text-indigo-300">Sign in</Link></p>
    </section>
  </main>
}
