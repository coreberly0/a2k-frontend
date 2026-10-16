'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getToken, saveTokens, clearTokens } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already signed in: go straight to the dashboard
  useEffect(() => {
    if (getToken()) router.replace('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Log in
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
        auth: false, // a wrong password must show an error, not "session expired"
      })
      if (!data.access_token) throw new Error('Login failed. Try again.')
      saveTokens(data.access_token, data.refresh_token)

      // 2. Get the role (login does not return it).
      //    A user with no role fails here with "No access. Ask the admin."
      const me = await api('/auth/me')
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: me.id,
          email: me.email,
          name: me.full_name,
          role: me.role,
        })
      )

      // 3. Open the dashboard
      router.replace('/dashboard')
    } catch (err: any) {
      clearTokens()
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form
        onSubmit={handleLogin}
        style={{ width: '100%', maxWidth: 360, display: 'grid', gap: 12 }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in</h1>

        <label style={{ display: 'grid', gap: 4 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            style={{ padding: 10, fontSize: 16 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ padding: 10, fontSize: 16 }}
          />
        </label>

        {error && (
          <p role="alert" style={{ margin: 0, color: '#b00020' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ padding: 12, fontSize: 16 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}