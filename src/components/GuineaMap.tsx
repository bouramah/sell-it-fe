import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { formatGNF } from '../lib/format'
import type { BoutiqueCarte } from '../types'

const GUINEA_CENTER: [number, number] = [10.0, -11.3]

interface GuineaMapProps {
  boutiques: BoutiqueCarte[]
}

export default function GuineaMap({ boutiques }: GuineaMapProps) {
  const positioned = boutiques.filter((b) => b.latitude != null && b.longitude != null)
  const maxCa = Math.max(1, ...positioned.map((b) => b.ca_periode))
  const sansCoordonnees = boutiques.filter((b) => b.latitude == null || b.longitude == null)

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <MapContainer center={GUINEA_CENTER} zoom={7} scrollWheelZoom={false} style={{ height: 450, width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positioned.map((b) => {
            const radius = 8 + (b.ca_periode / maxCa) * 16
            return (
              <CircleMarker
                key={b.boutique_id}
                center={[b.latitude!, b.longitude!]}
                radius={radius}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: b.alertes_stock > 0 ? '#f59e0b' : '#0f766e',
                  fillOpacity: 0.75,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">{b.nom}</div>
                    <div className="text-slate-600">CA période : {formatGNF(b.ca_periode)}</div>
                    {b.alertes_stock > 0 && <div className="text-amber-600">{b.alertes_stock} alerte(s) stock</div>}
                    <Link to={`/boutiques/${b.boutique_id}`} className="text-teal-700 hover:underline">
                      Voir la boutique →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {sansCoordonnees.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {sansCoordonnees.length} boutique(s) sans coordonnées ne sont pas affichées — renseignez-les depuis la fiche boutique.
        </p>
      )}
    </div>
  )
}
