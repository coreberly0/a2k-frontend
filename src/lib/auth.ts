import { clearTokens } from './api'

export type User = {
  id?: string
  name?: string
  email?: string
  role?: string
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function logout() {
  clearTokens() // removes access_token, refresh_token and user
  window.location.href = '/login'
}