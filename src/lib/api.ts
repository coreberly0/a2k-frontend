const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

type Options = {
  method?: string
  body?: unknown
  auth?: boolean // false for login / forgot / reset routes
  headers?: Record<string, string>
}

// ---------- Token helpers ----------
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function setToken(token: string) {
  localStorage.setItem('access_token', token)
}

export function saveTokens(access: string, refresh?: string) {
  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export function clearToken() {
  clearTokens()
}

// ---------- Refresh (shared so parallel 401s refresh only once) ----------
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) return false
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (!data.access_token) return false
    saveTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// ---------- Request ----------
async function send(path: string, { method = 'GET', body, auth = true, headers: extra }: Options) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...extra,
  }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload: BodyInit | undefined
  if (body === undefined || body === null) payload = undefined
  else if (isForm || typeof body === 'string') payload = body as BodyInit
  else payload = JSON.stringify(body)

  return fetch(`${API_URL}${path}`, { method, headers, body: payload })
}

function logout(): never {
  clearTokens()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  throw new Error('Session expired. Please log in again.')
}

export async function api<T = any>(path: string, options: Options = {}): Promise<T> {
  let res = await send(path, options)

  // Expired access token: refresh once and retry
  if (res.status === 401 && options.auth !== false) {
    if (!(await refreshTokens())) logout()
    res = await send(path, options)
    if (res.status === 401) logout()
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed')
  return data as T
}