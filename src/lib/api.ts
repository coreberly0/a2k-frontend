const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

type ApiOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown
  headers?: Record<string, string>
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken()
  const isForm = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let body: BodyInit | undefined
  if (options.body === undefined || options.body === null) body = undefined
  else if (isForm || typeof options.body === 'string') body = options.body as BodyInit
  else body = JSON.stringify(options.body)

  const res = await fetch(`${API}${path}`, { ...options, headers, body })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}