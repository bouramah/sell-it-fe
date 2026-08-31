interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

/** Cercle en rotation — indicateur de chargement générique réutilisé sur tout le back-office
 * (aucun spinner n'existait auparavant : les pages restaient silencieusement vides/figées
 * pendant un chargement lent, ce qui donnait l'impression d'une appli plantée). */
export default function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status" aria-live="polite">
      <span
        className={`inline-block animate-spin rounded-full border-slate-200 border-t-teal-700 ${SIZES[size]}`}
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

/** Variante pleine page/section, centrée verticalement, pour remplacer le contenu d'une page
 * pendant son tout premier chargement. */
export function SpinnerBloc({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  )
}
