import { useMemo, useRef, useState } from 'react'
import { CHART_INK, PRIMARY, PRIMARY_WASH } from '../../lib/chartPalette'

interface Point {
  label: string
  value: number
}

interface LineAreaChartProps {
  data: Point[]
  height?: number
  valueFormatter?: (v: number) => string
  labelFormatter?: (label: string) => string
}

const VB_W = 600
const VB_H = 220
const PAD_L = 8
const PAD_R = 8
const PAD_T = 12
const PAD_B = 24

export default function LineAreaChart({ data, height = 220, valueFormatter = String, labelFormatter = (l) => l }: LineAreaChartProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data])
  const innerW = VB_W - PAD_L - PAD_R
  const innerH = VB_H - PAD_T - PAD_B
  const n = data.length

  const xAt = (i: number) => PAD_L + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_T + innerH - (v / max) * innerH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${xAt(n - 1)} ${PAD_T + innerH} L ${xAt(0)} ${PAD_T + innerH} Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!rootRef.current || n === 0) return
    const rect = rootRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VB_W
    let closest = 0
    let closestDist = Infinity
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(xAt(i) - relX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    }
    setHover(closest)
  }

  if (data.length === 0 || max === 0) {
    return <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>Aucune donnée sur la période.</div>
  }

  const showEveryNth = Math.max(1, Math.ceil(n / 7))
  const lastRegularShown = Math.floor((n - 1) / showEveryNth) * showEveryNth

  return (
    <div ref={rootRef} className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {gridLines.map((g) => (
          <line
            key={g}
            x1={PAD_L}
            x2={VB_W - PAD_R}
            y1={PAD_T + innerH * (1 - g)}
            y2={PAD_T + innerH * (1 - g)}
            stroke={CHART_INK.grid}
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={PRIMARY_WASH} stroke="none" />
        <path d={linePath} fill="none" stroke={PRIMARY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) =>
          i % showEveryNth === 0 || (i === n - 1 && n - 1 - lastRegularShown >= showEveryNth / 2) ? (
            <text key={i} x={xAt(i)} y={VB_H - 6} fontSize={10} fill={CHART_INK.muted} textAnchor="middle">
              {labelFormatter(d.label)}
            </text>
          ) : null
        )}

        {hover !== null && (
          <>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD_T} y2={PAD_T + innerH} stroke={CHART_INK.axis} strokeWidth={1} />
            <circle cx={xAt(hover)} cy={yAt(data[hover].value)} r={4} fill={PRIMARY} stroke="#ffffff" strokeWidth={2} />
          </>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xAt(hover) / VB_W) * 100}%`,
            top: `${(yAt(data[hover].value) / VB_H) * 100 - 4}%`,
          }}
        >
          <div className="text-slate-500">{labelFormatter(data[hover].label)}</div>
          <div className="font-semibold text-slate-900">{valueFormatter(data[hover].value)}</div>
        </div>
      )}
    </div>
  )
}
