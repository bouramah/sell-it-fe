import { useState } from 'react'
import { CHART_INK, colorFor } from '../../lib/chartPalette'

interface Slice {
  label: string
  value: number
}

interface DonutChartProps {
  data: Slice[]
  valueFormatter?: (v: number) => string
  size?: number
}

const SIZE = 160
const STROKE = 26
const R = (SIZE - STROKE) / 2
const CX = SIZE / 2
const CY = SIZE / 2
const CIRC = 2 * Math.PI * R

export default function DonutChart({ data, valueFormatter = String, size = SIZE }: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-slate-400">Aucune donnée sur la période.</div>
  }

  let offset = 0
  const arcs = data.map((d, i) => {
    const frac = d.value / total
    const dash = frac * CIRC
    const arc = { ...d, i, dashArray: `${dash} ${CIRC - dash}`, dashOffset: -offset, color: colorFor(i), frac }
    offset += dash
    return arc
  })

  const scale = size / SIZE

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={size} height={size}>
          <g transform={`rotate(-90 ${CX} ${CY})`}>
            {arcs.map((a) => (
              <circle
                key={a.i}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={hover === a.i ? STROKE + 4 : STROKE}
                strokeDasharray={a.dashArray}
                strokeDashoffset={a.dashOffset}
                style={{ transition: 'stroke-width 120ms ease' }}
                onMouseEnter={() => setHover(a.i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ transform: `scale(${scale})` }}
          >
            <div className="text-[11px] text-slate-500">{arcs[hover].label}</div>
            <div className="text-sm font-semibold text-slate-900">{valueFormatter(arcs[hover].value)}</div>
            <div className="text-[10px] text-slate-400">{Math.round(arcs[hover].frac * 100)}%</div>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {arcs.map((a) => (
          <div
            key={a.i}
            className="flex items-center justify-between gap-2 text-sm"
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="truncate text-slate-600">{a.label}</span>
            </span>
            <span className="shrink-0 font-medium" style={{ color: CHART_INK.primary }}>
              {valueFormatter(a.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
