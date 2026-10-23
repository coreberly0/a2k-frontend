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

/** base is the API path, e.g. '/sales' or '/purchases' */
export function createBillApi(base: string) {
  return {
    upload(id: string, file: File) {
      const fd = new FormData()
      fd.append('bill', file)
      return api(`${base}/${id}/bill`, { method: 'POST', body: fd })
    },

    remove(id: string) {
      return api(`${base}/${id}/bill`, { method: 'DELETE' })
    },

    /** Opens the bill in a new tab (asks the backend for a short-lived link). */
    async open(id: string) {
      // open the tab first so the browser's popup blocker doesn't stop it
      const tab = window.open('', '_blank')
      try {
        const { url } = await api(`${base}/${id}/bill`)
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
    },
  }
}

export const salesBillApi = createBillApi('/sales')
export const purchaseBillApi = createBillApi('/purchases')

// kept so the purchases files keep working unchanged
export const uploadBill = purchaseBillApi.upload
export const removeBill = purchaseBillApi.remove
export const openBill = purchaseBillApi.open