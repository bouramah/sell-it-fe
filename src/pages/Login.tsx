import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../lib/AuthContext'

type Vue = 'connexion' | 'verification-2fa' | 'demande-code' | 'reinitialisation'

export default function Login() {
  const { user, login, verifier2FA } = useAuth()
  const [vue, setVue] = useState<Vue>('connexion')

  const [contact, setContact] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [code2FA, setCode2FA] = useState('')

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
      const { otpRequis } = await login(contact, motDePasse)
      if (otpRequis) setVue('verification-2fa')
    } catch {
      setError('Numéro ou mot de passe incorrect.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifier2FA(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verifier2FA(contact, code2FA)
    } catch {
      setError('Code invalide ou expiré.')
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
        <div className="mb-6">
          <img src="/logo.jpeg" alt="KFSTORE" className="h-9 w-auto" />
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
                <PasswordInput value={motDePasse} onChange={setMotDePasse} placeholder="••••••••" autoComplete="current-password" required />
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

        {vue === 'verification-2fa' && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Vérification en deux étapes</h1>
            <p className="mb-6 text-sm text-slate-500">
              Un code de vérification vous a été envoyé par SMS au {contact}.
            </p>

            <form onSubmit={handleVerifier2FA} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Code reçu par SMS</label>
                <input
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Vérification…' : 'Valider'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setCode2FA('')
                  setVue('connexion')
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-700"
              >
                Retour à la connexion
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
                <PasswordInput value={nouveauMotDePasse} onChange={setNouveauMotDePasse} placeholder="••••••••" autoComplete="new-password" required minLength={6} />
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
