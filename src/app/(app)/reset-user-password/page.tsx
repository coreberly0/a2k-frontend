'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Lock, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    setToken(params.get('access_token') || '')
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      await api('/auth/update-password', {
        method: 'POST',
        body: { access_token: token, new_password: password },
        auth: false,
      })
      setDone(true)
      setTimeout(() => router.replace('/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-3 text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/30'

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-xl">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-signal text-ink">
          <Truck size={26} strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">New password</h1>
          <p className="mt-1 text-sm text-gravel">Choose a new password for your account.</p>
        </div>

        {!token ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            This reset link is invalid or expired. Request a new one from the sign in page.
          </p>
        ) : done ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Password changed. Redirecting to sign in…
          </p>
        ) : (
          <>
            <input type="password" className={inputCls} placeholder="New password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" className={inputCls} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal py-3 font-semibold text-ink disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? 'Saving…' : 'Change password'}
            </button>
          </>
        )}
      </form>
    </main>
  )
}