import Modal from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-700 hover:bg-teal-800'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
