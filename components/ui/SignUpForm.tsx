'use client'

import { useActionState, useState } from 'react'
import { signUpAction } from '@/lib/actions/auth'
import type { ActionResult } from '@/lib/action-result'
import { requestAction } from '@/lib/client-action'
import { buttonClass, FieldError, FormFeedback, inputClass, labelClass } from './FormFeedback'

export function SignUpForm() {
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [result, action, pending] = useActionState<ActionResult<{ userId: string }> | null, FormData>(
    async (_previous, form) => requestAction(() => signUpAction(Object.fromEntries(form))), null,
  )
  const errors = result && !result.success ? result.fieldErrors : undefined
  return <form action={action} noValidate aria-busy={pending} className="space-y-5">
    <FormFeedback result={result} />
    {(['name', 'email', 'password'] as const).map((field) => <div key={field}>
      <label htmlFor={field} className={labelClass}>{field === 'name' ? 'Name' : field === 'email' ? 'Email' : 'Password'}</label>
      <input id={field} name={field} type={field === 'name' ? 'text' : field} required
        maxLength={field === 'name' ? 100 : field === 'email' ? 254 : 72} minLength={field === 'password' ? 8 : undefined}
        autoComplete={field === 'password' ? 'new-password' : field} className={inputClass}
        value={values[field]} onChange={(event) => setValues({ ...values, [field]: event.target.value })}
        aria-invalid={!!errors?.[field]} aria-describedby={errors?.[field] ? `${field}-error` : undefined} disabled={pending} />
      <FieldError id={`${field}-error`} errors={errors?.[field]} />
    </div>)}
    <p className="text-sm text-gray-600 dark:text-gray-400">Use at least 8 characters for your password.</p>
    <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>{pending ? 'Creating account…' : 'Create account'}</button>
  </form>
}
