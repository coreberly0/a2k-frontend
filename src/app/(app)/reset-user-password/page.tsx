'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Lock, Mail, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { api, getToken } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Only signed-in users can open this page (the server also checks for admin)
  useEffect(() => {
    if (!getToken()) router.replace('/login')
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      await api('/employees/reset-password', {
        method: 'POST',
        body: {
          email: email.trim(),
          new_password: password,
          confirm_password: confirm,
        },
      })
      setDone(true)
      setEmail('')
      setPassword('')
      setConfirm('')
    } catch (err: any) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  const inputWrap =
    'flex items-center gap-3 rounded-lg border border-black/10 bg-white px-3 transition focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/30'
  const inputCls = 'w-full bg-transparent py-3 text-ink outline-none placeholder:text-gravel/60'

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-gravel hover:text-ink"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid h-12 w-12 place-items-center rounded-xl bg-signal text-ink">
          <Truck size={26} strokeWidth={2.25} />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Reset password</h1>
          <p className="mt-1 text-sm text-gravel">
            Enter the employee's email and choose a new password for them.
          </p>
        </div>

        {done && (
          <p className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            Password changed. You can reset another one below.
          </p>
        )}

        <div className={inputWrap}>
          <Mail size={18} className="shrink-0 text-gravel" />
          <input
            type="email"
            className={inputCls}
            placeholder="Employee email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={inputWrap}>
          <Lock size={18} className="shrink-0 text-gravel" />
          <input
            type={show ? 'text' : 'password'}
            className={inputCls}
            placeholder="New password (min 8)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="text-gravel hover:text-ink"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className={inputWrap}>
          <Lock size={18} className="shrink-0 text-gravel" />
          <input
            type={show ? 'text' : 'password'}
            className={inputCls}
            placeholder="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal py-3 font-semibold text-ink shadow-lg shadow-signal/20 transition hover:brightness-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
          {loading ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </main>
  )
}