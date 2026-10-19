// lib/billApi.ts
import { api } from '@/lib/api'

export const BILL_MAX_MB = 5
export const BILL_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

/** Returns an error message, or '' if the file is fine. */
export function checkBillFile(file: File): string {
  if (!BILL_TYPES.includes(file.type)) return 'Only PDF, JPG, PNG or WEBP files are allowed'
  if (file.size > BILL_MAX_MB * 1024 * 1024) return `File must be ${BILL_MAX_MB} MB or smaller`
  return ''
}

export function uploadBill(purchaseId: string, file: File) {
  const fd = new FormData()
  fd.append('bill', file)
  return api(`/purchases/${purchaseId}/bill`, { method: 'POST', body: fd })
}

export function removeBill(purchaseId: string) {
  return api(`/purchases/${purchaseId}/bill`, { method: 'DELETE' })
}

/** Opens the bill in a new tab (asks the backend for a short-lived link). */
export async function openBill(purchaseId: string) {
  // open the tab first so the browser's popup blocker doesn't stop it
  const tab = window.open('', '_blank')
  try {
    const { url } = await api(`/purchases/${purchaseId}/bill`)
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.href = url
    }
  } catch (e) {
    tab?.close()
    throw e
  }
}