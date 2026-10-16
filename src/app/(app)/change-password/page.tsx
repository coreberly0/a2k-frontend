'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (next.length < 8) return setError('New password must be at least 8 characters')
    if (next !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const token = localStorage.getItem('token') // use the name your app saves
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: current,
          new_password: next,
          confirm_password: confirm,
        }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Something went wrong')
      else {
        setMessage('Password changed.')
        setCurrent('')
        setNext('')
        setConfirm('')
      }
    } catch {
      setError('Cannot reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded">
      <h1 className="text-xl font-semibold mb-4">Change password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Current password</label>
          <input type="password" required value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input type="password" required value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm new password</label>
          <input type="password" required value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-700 text-sm">{message}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50">
          {loading ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  )
}