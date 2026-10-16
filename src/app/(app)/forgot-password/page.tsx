'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
      setMessage('If that email is registered, a reset link has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        <input
          type="email"
          required
          placeholder="Your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
        <Link href="/login" className="block text-center text-sm text-gray-600 hover:text-gray-800">
          Back to login
        </Link>
      </form>
    </div>
  )
}