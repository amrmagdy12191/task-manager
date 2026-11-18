import type { ActionResult } from '@/lib/action-result'

export const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
export const buttonClass = 'rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
export const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.length ? <p id={id} className="mt-1 text-sm text-red-700 dark:text-red-300">{errors[0]}</p> : null
}

export function FormFeedback({ result, successMessage }: { result: ActionResult<unknown> | null; successMessage?: string }) {
  if (!result) return null
  if (result.success) return successMessage ? <p role="status" className="text-sm text-green-700 dark:text-green-300">{successMessage}</p> : null
  return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{result.error}</p>
}
