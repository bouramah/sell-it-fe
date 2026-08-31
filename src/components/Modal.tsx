import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean // pour le contenu tabulaire (plusieurs colonnes) qui ne tient pas dans max-w-lg
}

export default function Modal({ title, onClose, children, wide = false }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white p-6 shadow-2xl ring-1 ring-black/5`}>
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
