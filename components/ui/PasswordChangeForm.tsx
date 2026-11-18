'use client'

import { useActionState, useEffect, useState } from 'react'
import { changePasswordAction } from '@/lib/actions/profile'
import type { ActionResult } from '@/lib/action-result'
import { requestAction } from '@/lib/client-action'
import { useRouter } from 'next/navigation'
import { buttonClass, FieldError, FormFeedback, inputClass, labelClass } from './FormFeedback'

const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
const fields = [
  ['currentPassword', 'Current password', 'current-password'],
  ['newPassword', 'New password', 'new-password'],
  ['confirmPassword', 'Confirm new password', 'new-password'],
] as const

export default function PasswordChangeForm() {
  const router = useRouter()
  const [values, setValues] = useState(empty)
  const [saved, setSaved] = useState(false)
  const [result, action, pending] = useActionState<ActionResult<{ success: true }> | null, FormData>(async (_previous, form) => {
    setSaved(false)
    if (form.get('newPassword') !== form.get('confirmPassword')) return {
      success: false, code: 'VALIDATION_ERROR', error: 'Please check the highlighted fields.', fieldErrors: { confirmPassword: ['Passwords do not match.'] },
    }
    const response = await requestAction(() => changePasswordAction(Object.fromEntries(form)))
    if (!response.success && response.code === 'UNAUTHORIZED') router.replace('/sign-in?callbackUrl=%2Fprofile&reason=session-expired')
    if (response.success) { setValues(empty); setSaved(true) }
    return response
  }, null)
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(timer)
  }, [saved])
  const errors = result && !result.success ? result.code === 'WRONG_PASSWORD' ? { currentPassword: [result.error] } : result.fieldErrors : undefined

  return <form action={action} noValidate aria-busy={pending} className="space-y-5">
    {fields.map(([field, label, autocomplete]) => <div key={field}>
      <label htmlFor={field} className={labelClass}>{label}</label>
      <input id={field} name={field} type="password" required minLength={field === 'newPassword' ? 8 : undefined} maxLength={72} autoComplete={autocomplete} className={inputClass}
        value={values[field]} onChange={(event) => setValues({ ...values, [field]: event.target.value })} disabled={pending}
        aria-invalid={!!errors?.[field]} aria-describedby={errors?.[field] ? `${field}-error` : undefined} />
      <FieldError id={`${field}-error`} errors={errors?.[field]} />
    </div>)}
    <FormFeedback result={result && !result.success && result.code === 'WRONG_PASSWORD' ? null : result} successMessage={saved ? 'Password updated.' : undefined} />
    <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Updating…' : 'Update password'}</button>
  </form>
}
