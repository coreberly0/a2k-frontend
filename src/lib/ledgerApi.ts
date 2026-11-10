// lib/ledgerApi.ts
import { api } from '@/lib/api'

export type LedgerEntry = {
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  file_count?: number
}

export type Ledger = {
  customer: { name: string }
  opening_balance: number
  entries: LedgerEntry[]
  total_debit: number
  total_credit: number
  closing_balance: number
}

export const getLedger = (customerId: string, from?: string, to?: string) => {
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  const qs = q.toString()
  return api<Ledger>(`/ledger/${customerId}${qs ? `?${qs}` : ''}`)
}

export const getBalances = () => api<any[]>('/ledger/balances')