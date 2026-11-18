import { redirect } from 'next/navigation'
import { getProfileAction } from '@/lib/actions/profile'
import ProfileForm from '@/components/ui/ProfileForm'
import PasswordChangeForm from '@/components/ui/PasswordChangeForm'

export const metadata = { title: 'Profile | TaskFlow' }

export default async function ProfilePage() {
  const result = await getProfileAction()
  if (!result.success) {
    if (result.code === 'UNAUTHORIZED') redirect('/sign-in?callbackUrl=%2Fprofile')
    return <div role="alert" className="mx-auto max-w-xl p-8 text-red-700 dark:text-red-300">{result.error}</div>
  }
  const profile = result.data
  const sectionClass = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800'
  return <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:py-10">
    <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your profile</h1><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Manage your identity and account security.</p></div>
    <section aria-labelledby="profile-title" className={sectionClass}>
      <h2 id="profile-title" className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">Profile details</h2>
      <div className="mb-6"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p><p className="mt-1 break-all text-sm text-gray-600 dark:text-gray-400">{profile.email}</p></div>
      <ProfileForm initialDisplayName={profile.displayName} initialAvatarInitials={profile.avatarInitials} initialAvatarColorIndex={profile.avatarColorIndex} />
    </section>
    <section aria-labelledby="password-title" className={sectionClass}>
      <h2 id="password-title" className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Change password</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">Choose a new password with at least 8 characters.</p>
      <PasswordChangeForm />
    </section>
  </div>
}
