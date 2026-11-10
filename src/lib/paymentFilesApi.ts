// src/lib/paymentFilesApi.ts
// Receipt files (UPI screenshot / bank slip) of a payment.
// Backend: GET/POST /payments/:id/files, DELETE /payments/:id/files/:fileId
import { api } from '@/lib/api'

export type PaymentFile = {
  id: string
  name: string
  mime_type: string
  size_bytes: number
  url: string | null // signed link, valid 5 minutes
}

export type ReceiptFile = PaymentFile

export function listPaymentFiles(paymentId: string): Promise<PaymentFile[]> {
  return api(`/payments/${paymentId}/files`)
}

export function uploadPaymentFiles(paymentId: string, files: File[]) {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f)) // field name must be "files"
  return api(`/payments/${paymentId}/files`, { method: 'POST', body: fd })
}

export function deletePaymentFile(paymentId: string, fileId: string) {
  return api(`/payments/${paymentId}/files/${fileId}`, { method: 'DELETE' })
}

// used by SaleForm and the Sales page
export const paymentFilesApi = {
  list: listPaymentFiles,
  upload: uploadPaymentFiles,
  remove: deletePaymentFile,
}