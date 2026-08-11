import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatGNF } from '../lib/format'
import type { BoutiqueCarte } from '../types'

const LON_MIN = -15.1
const LON_MAX = -7.6
const LAT_MIN = 7.1
const LAT_MAX = 12.7
const WIDTH = 600
const HEIGHT = 450

function project(lat: number, lon: number): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT
  return [x, y]
}

// Silhouette simplifiée de la Guinée — approximative, à but illustratif seulement (pas une frontière officielle).
const OUTLINE = [
  [10.9, -14.7], [11.7, -13.7], [12.4, -12.3], [12.5, -10.9], [12.0, -9.7],
  [11.4, -8.6], [10.2, -7.9], [8.6, -8.0], [7.6, -8.4], [7.3, -9.4],
  [7.6, -10.6], [8.4, -11.2], [9.0, -12.6], [9.4, -13.4], [9.9, -13.9],
].map(([lat, lon]) => project(lat, lon))

const outlinePath = `M ${OUTLINE.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ')} Z`

const DECLUTTER_RADIUS = 20

interface PositionedBoutique extends BoutiqueCarte {
  x: number
  y: number
}

// Regroupe les boutiques dont les marqueurs se chevauchent (ex : plusieurs boutiques à Conakry)
// et les répartit en petit cercle autour du centre du groupe pour qu'elles restent cliquables.
function declutter(points: PositionedBoutique[]): PositionedBoutique[] {
  const groups: PositionedBoutique[][] = []
  const used = new Set<string>()
  for (const p of points) {
    if (used.has(p.boutique_id)) continue
    const group = [p]
    used.add(p.boutique_id)
    for (const q of points) {
      if (used.has(q.boutique_id)) continue
      if (Math.hypot(p.x - q.x, p.y - q.y) < DECLUTTER_RADIUS) {
        group.push(q)
        used.add(q.boutique_id)
      }
    }
    groups.push(group)
  }

  return groups.flatMap((group) => {
    if (group.length === 1) return group
    const cx = group.reduce((s, g) => s + g.x, 0) / group.length
    const cy = group.reduce((s, g) => s + g.y, 0) / group.length
    const spread = 12 + group.length * 3
    return group.map((g, i) => ({
      ...g,
      x: cx + spread * Math.cos((2 * Math.PI * i) / group.length),
      y: cy + spread * Math.sin((2 * Math.PI * i) / group.length),
    }))
  })
}

interface GuineaMapProps {
  boutiques: BoutiqueCarte[]
}

export default function GuineaMap({ boutiques }: GuineaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const raw = boutiques.filter((b) => b.latitude != null && b.longitude != null)
  const maxCa = Math.max(1, ...raw.map((b) => b.ca_periode))
  const positioned = declutter(
    raw.map((b) => {
      const [x, y] = project(b.latitude!, b.longitude!)
      return { ...b, x, y }
    })
  )

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height="450"
        role="img"
        aria-label="Carte de la Guinée avec les boutiques"
        className="rounded-lg border border-slate-200"
      >
        <path d={outlinePath} fill="#ccfbf1" stroke="#0d9488" strokeWidth={2.5} strokeLinejoin="round" />
        {positioned.map((b) => {
          const { x, y } = b
          const radius = 6 + (b.ca_periode / maxCa) * 14
          const isHovered = hovered === b.boutique_id
          return (
            <g key={b.boutique_id} onMouseEnter={() => setHovered(b.boutique_id)} onMouseLeave={() => setHovered(null)}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? radius + 2 : radius}
                fill={b.alertes_stock > 0 ? '#f59e0b' : '#0f766e'}
                fillOpacity={isHovered ? 0.95 : 0.65}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer transition-all"
              />
              {isHovered && (
                <text x={x} y={y - radius - 6} textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
                  {b.nom}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hovered && (() => {
        const b = positioned.find((x) => x.boutique_id === hovered)
        if (!b) return null
        return (
          <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
            <div className="font-semibold text-slate-900">{b.nom}</div>
            <div className="text-slate-600">CA période : {formatGNF(b.ca_periode)}</div>
            {b.alertes_stock > 0 && <div className="text-amber-600">{b.alertes_stock} alerte(s) stock</div>}
            <Link to={`/boutiques/${b.boutique_id}`} className="pointer-events-auto text-teal-700 hover:underline">
              Voir la boutique →
            </Link>
          </div>
        )
      })()}

      {boutiques.some((b) => b.latitude == null || b.longitude == null) && (
        <p className="mt-2 text-xs text-slate-400">
          {boutiques.filter((b) => b.latitude == null || b.longitude == null).length} boutique(s) sans coordonnées ne sont pas affichées — renseignez-les depuis la fiche boutique.
        </p>
      )}
    </div>
  )
}
