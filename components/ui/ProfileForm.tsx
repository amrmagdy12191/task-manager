'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from '@/lib/actions/profile'
import { AVATAR_PALETTE, getAvatarTextColor } from '@/lib/avatar'
import type { ActionResult } from '@/lib/action-result'
import type { ProfileInput } from '@/lib/data/types'
import { requestAction } from '@/lib/client-action'
import { buttonClass, FieldError, FormFeedback, inputClass, labelClass } from './FormFeedback'

interface ProfileFormProps { initialDisplayName: string; initialAvatarInitials: string; initialAvatarColorIndex: number }

export default function ProfileForm({ initialDisplayName, initialAvatarInitials, initialAvatarColorIndex }: ProfileFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarInitials, setAvatarInitials] = useState(initialAvatarInitials)
  const [color, setColor] = useState(initialAvatarColorIndex)
  const [saved, setSaved] = useState(false)
  const [result, action, pending] = useActionState<ActionResult<ProfileInput> | null, FormData>(async (_previous, form) => {
    setSaved(false)
    const response = await requestAction(() => updateProfileAction({ ...Object.fromEntries(form), avatarColorIndex: Number(form.get('avatarColorIndex')) }))
    if (!response.success && response.code === 'UNAUTHORIZED') router.replace('/sign-in?callbackUrl=%2Fprofile&reason=session-expired')
    if (response.success) {
      setDisplayName(response.data.displayName)
      setAvatarInitials(response.data.avatarInitials)
      setSaved(true)
      router.refresh()
    }
    return response
  }, null)
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(timer)
  }, [saved])
  const errors = result && !result.success ? result.fieldErrors : undefined

  return <form action={action} noValidate aria-busy={pending} className="space-y-5">
    <div>
      <label htmlFor="displayName" className={labelClass}>Display name</label>
      <input id="displayName" name="displayName" required maxLength={100} autoComplete="name" className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={pending} aria-invalid={!!errors?.displayName} aria-describedby={errors?.displayName ? 'displayName-error' : undefined} />
      <FieldError id="displayName-error" errors={errors?.displayName} />
    </div>
    <div>
      <label htmlFor="avatarInitials" className={labelClass}>Avatar initials</label>
      <input id="avatarInitials" name="avatarInitials" required maxLength={2} pattern=".{1,2}" className={`${inputClass} max-w-24 uppercase`} value={avatarInitials} onChange={(event) => setAvatarInitials(event.target.value)} disabled={pending} aria-invalid={!!errors?.avatarInitials} aria-describedby={errors?.avatarInitials ? 'avatarInitials-error' : undefined} />
      <FieldError id="avatarInitials-error" errors={errors?.avatarInitials} />
    </div>
    <fieldset disabled={pending}>
      <legend className={labelClass}>Avatar color</legend>
      <div className="flex flex-wrap gap-2">
        {AVATAR_PALETTE.map((hex, index) => <button key={hex} type="button" aria-label={`Avatar color ${index + 1}`} aria-pressed={color === index} onClick={() => setColor(index)} className="rounded-full p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60">
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: hex, color: getAvatarTextColor(hex) }} aria-hidden="true">{color === index ? '✓' : ''}</span>
        </button>)}
      </div>
      <input type="hidden" name="avatarColorIndex" value={color} />
      <FieldError id="avatarColorIndex-error" errors={errors?.avatarColorIndex} />
    </fieldset>
    <FormFeedback result={result} successMessage={saved ? 'Changes saved.' : undefined} />
    <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save changes'}</button>
  </form>
}
