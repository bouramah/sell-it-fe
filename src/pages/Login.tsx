import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../lib/AuthContext'

type Vue = 'connexion' | 'demande-code' | 'reinitialisation'

export default function Login() {
  const { user, login } = useAuth()
  const [vue, setVue] = useState<Vue>('connexion')

  const [contact, setContact] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [resetContact, setResetContact] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [info, setInfo] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(contact, motDePasse)
    } catch {
      setError('Numéro ou mot de passe incorrect.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDemandeCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { message } = await api.motDePasseOublie(resetContact)
      setInfo(message)
      setVue('reinitialisation')
    } catch {
      setError("Impossible d'envoyer le code pour le moment.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReinitialisation(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.reinitialiserMotDePasse(resetContact, resetCode, nouveauMotDePasse)
      setInfo('Mot de passe réinitialisé. Vous pouvez vous connecter.')
      setVue('connexion')
      setContact(resetContact)
      setMotDePasse('')
      setResetCode('')
      setNouveauMotDePasse('')
    } catch {
      setError('Code invalide ou expiré.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
            K
          </div>
          <div className="text-sm font-bold tracking-tight text-slate-900">KFSTORE</div>
        </div>

        {vue === 'connexion' && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Connexion</h1>
            <p className="mb-6 text-sm text-slate-500">Accès réservé au personnel GROUPE SKF SARL</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Numéro de téléphone</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="620 00 00 00"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              {info && <p className="text-sm text-teal-700">{info}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Connexion…' : 'Se connecter'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setInfo(null)
                  setResetContact(contact)
                  setVue('demande-code')
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-700"
              >
                Mot de passe oublié ?
              </button>
            </form>
          </>
        )}

        {vue === 'demande-code' && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Mot de passe oublié</h1>
            <p className="mb-6 text-sm text-slate-500">
              Un code de vérification à usage unique vous sera envoyé par SMS.
            </p>

            <form onSubmit={handleDemandeCode} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Numéro de téléphone</label>
                <input
                  value={resetContact}
                  onChange={(e) => setResetContact(e.target.value)}
                  placeholder="620 00 00 00"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Envoi…' : 'Recevoir le code par SMS'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setVue('connexion')
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-700"
              >
                Retour à la connexion
              </button>
            </form>
          </>
        )}

        {vue === 'reinitialisation' && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Nouveau mot de passe</h1>
            {info && <p className="mb-6 text-sm text-slate-500">{info}</p>}

            <form onSubmit={handleReinitialisation} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Code reçu par SMS</label>
                <input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Validation…' : 'Réinitialiser le mot de passe'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setVue('demande-code')
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-700"
              >
                Je n'ai pas reçu le code
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
