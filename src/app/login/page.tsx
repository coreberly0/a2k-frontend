'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, Receipt, Wallet, Users } from 'lucide-react'
import { api, getToken, saveTokens, clearTokens } from '@/lib/api'

const features = [
  { icon: Receipt, title: 'Sales & purchases', text: 'Every bill and invoice in one trail.' },
  { icon: Wallet, title: 'Expenses', text: 'Know where each rupee went.' },
  { icon: Users, title: 'Drivers & vehicles', text: 'Your whole fleet, one place.' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
        auth: false, // a wrong password must show an error, not "session expired"
      })
      if (!data.access_token) throw new Error('Login failed. Try again.')
      saveTokens(data.access_token, data.refresh_token)

      const me = await api('/auth/me')
      localStorage.setItem(
        'user',
        JSON.stringify({ id: me.id, email: me.email, name: me.full_name, role: me.role })
      )
      router.replace('/dashboard')
    } catch (err: any) {
      clearTokens()
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputWrap =
    'flex items-center gap-3 rounded-xl border border-black/10 bg-paper/60 px-3.5 transition focus-within:border-signal focus-within:bg-white focus-within:ring-4 focus-within:ring-signal/20'
  // the last class removes the blue/yellow browser autofill background
  const inputCls =
    'w-full bg-transparent py-3.5 text-base text-ink outline-none placeholder:text-gravel/60 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#fff_inset]'
  const btnCls =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-signal py-3.5 font-semibold text-ink shadow-lg shadow-signal/30 transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60'
  const errBox = 'rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700'

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-2">
      {/* brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="hazard absolute inset-x-0 top-0 h-2" />

        {/* background texture: faint grid + warm glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-signal/15 blur-3xl"
        />

        {/* logo lockup */}
        <div className="relative flex items-center gap-5">
          <div className="rounded-2xl bg-paper px-5 py-3 shadow-xl shadow-black/40">
            <Image
              src="/images/a2k-logo.png"
              alt="A2K Transport"
              width={390}
              height={174}
              priority
              className="h-16 w-auto"
            />
          </div>
          <div className="h-10 w-px bg-white/15" />
          <div className="leading-tight">
            <p className="font-display text-xl font-bold tracking-wide">A2K Transport</p>
            <p className="mt-1 text-xs font-medium tracking-wide text-gravel">Load Ledger</p>
          </div>
        </div>

        {/* headline + features */}
        <div className="relative">
          <h2 className="font-display text-6xl font-bold leading-[1.05]">
            Every load.<br />
            Every rupee.<br />
            <span className="text-signal">One ledger.</span>
          </h2>

          <ul className="mt-10 max-w-md space-y-3">
            {features.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-signal/15 text-signal">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-paper">{title}</span>
                  <span className="block text-sm text-gravel">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-gravel/70">
          © {new Date().getFullYear()} A2K Transport
        </p>
      </section>

      {/* form panel */}
      <section className="flex flex-col items-center justify-between px-6 py-8">
        <div className="flex w-full flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {/* mobile logo (brand panel is hidden below lg) */}
            <div className="mb-8 flex justify-center lg:hidden">
              <Image
                src="/images/a2k-logo.png"
                alt="A2K Transport"
                width={390}
                height={174}
                priority
                className="h-16 w-auto"
              />
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-xl shadow-ink/5 sm:p-10">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h1 className="font-display text-4xl font-bold text-ink">Welcome back</h1>
                  <p className="mt-2 text-sm text-gravel">
                    Sign in to continue to your dashboard.
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Email</span>
                  <div className={inputWrap}>
                    <Mail size={18} className="shrink-0 text-gravel" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      placeholder="you@company.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Password</span>
                  <div className={inputWrap}>
                    <Lock size={18} className="shrink-0 text-gravel" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="rounded-md p-1 text-gravel transition hover:bg-black/5 hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {error && <p role="alert" className={errBox}>{error}</p>}

                <button type="submit" disabled={loading} className={btnCls}>
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* provider credit */}
        <div className="mt-8 flex w-full max-w-md items-center justify-center gap-2.5 border-t border-black/5 pt-5 text-gravel">
          <span className="text-xs">Powered by</span>
          <Image
            src="/images/coreberly-logo.png"
            alt="Coreberly"
            width={333}
            height={290}
            className="h-11 w-auto"
          />
        </div>
      </section>
    </main>
  )
}