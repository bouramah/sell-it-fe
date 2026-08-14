import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import SearchableSelect from '../components/SearchableSelect'
import type { Boutique, Utilisateur } from '../types'

type Cible = 'utilisateur' | 'boutique'

export default function NotificationsPush() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [cible, setCible] = useState<Cible>('utilisateur')
  const [utilisateurId, setUtilisateurId] = useState('')
  const [boutiqueId, setBoutiqueId] = useState('')
  const [titre, setTitre] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ destinataires: number; notifies: number } | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.utilisateurs().then(setUtilisateurs)
    api.boutiques().then(setBoutiques)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (cible === 'utilisateur' && !utilisateurId) {
      setError('Sélectionnez un utilisateur.')
      return
    }
    if (cible === 'boutique' && !boutiqueId) {
      setError('Sélectionnez une boutique.')
      return
    }
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.envoyerNotificationPush({
        cible,
        utilisateur_id: cible === 'utilisateur' ? utilisateurId : null,
        boutique_id: cible === 'boutique' ? boutiqueId : null,
        titre,
        message,
      })
      setResult(res)
      setTitre('')
      setMessage('')
    } catch {
      setError("Échec de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications push</h1>
        <p className="text-sm text-slate-500">
          Envoyer un message à un membre du personnel, ou à toute l'équipe active d'une boutique.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Destinataire</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={cible === 'utilisateur'}
                onChange={() => setCible('utilisateur')}
              />
              Un utilisateur
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={cible === 'boutique'}
                onChange={() => setCible('boutique')}
              />
              Toute une boutique
            </label>
          </div>
        </div>

        {cible === 'utilisateur' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Utilisateur</label>
            <SearchableSelect
              value={utilisateurId}
              onChange={setUtilisateurId}
              options={utilisateurs.map((u) => ({ value: u.id, label: `${u.prenom} ${u.nom} — ${u.contact}` }))}
              placeholder="Sélectionner un utilisateur…"
              required
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
            <SearchableSelect
              value={boutiqueId}
              onChange={setBoutiqueId}
              options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
              placeholder="Sélectionner une boutique…"
              required
            />
            <p className="mt-1 text-xs text-slate-400">Envoyé à tout le personnel actif rattaché à cette boutique.</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Titre</label>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              result.notifies > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {result.notifies} / {result.destinataires} destinataire(s) notifié(s).
            {result.notifies === 0 && (
              <> Aucun appareil n'a de notifications activées pour {result.destinataires > 1 ? 'ces comptes' : 'ce compte'}.</>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  )
}
