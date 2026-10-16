'use client'
import Modal from '@/components/ui/Modal'
import SaleForm from '@/components/sales/SaleForm'

const PlusIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

interface AddSaleProps {
  open: boolean
  saving: boolean
  error: string
  onSubmit: (values: any) => void
  onClose: () => void
}

export default function AddSale({ open, saving, error, onSubmit, onClose }: AddSaleProps) {
  return (
    <Modal
      open={open}
      title="Add Bill"
      description="Enter the sale details below"
      icon={PlusIcon}
      tone="success"
      size="lg"
      onClose={onClose}
    >
      <SaleForm
        key="new"
        initial={null}
        saving={saving}
        error={error}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}