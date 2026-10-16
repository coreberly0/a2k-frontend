'use client'
import Modal from '@/components/ui/Modal'
import SaleForm, { Sale } from '@/components/sales/SaleForm'

const PencilIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

interface EditSaleProps {
  open: boolean
  sale: Sale | null
  saving: boolean
  error: string
  onSubmit: (values: any) => void
  onClose: () => void
}

export default function EditSale({ open, sale, saving, error, onSubmit, onClose }: EditSaleProps) {
  if (!sale) return null

  return (
    <Modal
      open={open}
      title="Edit Bill"
      description={`Update bill ${sale.bill_no}`}
      icon={PencilIcon}
      tone="info"
      size="lg"
      onClose={onClose}
    >
      <SaleForm
        key={sale.id}
        initial={sale}
        saving={saving}
        error={error}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}