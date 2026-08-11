import { useState } from 'react'
import { PRIMARY } from '../../lib/chartPalette'

interface BarDatum {
  label: string
  value: number
  sublabel?: string
}

interface BarChartHorizontalProps {
  data: BarDatum[]
  valueFormatter?: (v: number) => string
}

export default function BarChartHorizontal({ data, valueFormatter = String }: BarChartHorizontalProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))

  if (data.length === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-slate-400">Aucune donnée sur la période.</div>
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div
            key={i}
            className="group"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-slate-600">
                {d.label}
                {d.sublabel && <span className="ml-1 text-slate-400">{d.sublabel}</span>}
              </span>
              <span className="shrink-0 font-medium text-slate-900">{valueFormatter(d.value)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: PRIMARY,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
