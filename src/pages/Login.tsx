import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import PasswordInput from '../components/PasswordInput'
import Spinner from '../components/Spinner'
import { useAuth } from '../lib/AuthContext'

type Vue = 'connexion' | 'verification-2fa' | 'demande-code' | 'reinitialisation'

function SubmitButton({ submitting, label, labelSubmitting }: { submitting: boolean; label: string; labelSubmitting: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
    >
      {submitting && <Spinner size="sm" className="text-white [&>span:first-child]:border-white/30 [&>span:first-child]:border-t-white" />}
      {submitting ? labelSubmitting : label}
    </button>
  )
}

function LienSecondaire({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-700">
      {children}
    </button>
  )
}

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
    <div className="flex min-h-screen bg-slate-50">
      {/* Panneau de marque — masqué sur petit écran, la connexion reste utilisable sans lui */}
      <div className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-12 text-white lg:flex">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grille-connexion" width="42" height="42" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grille-connexion)" />
        </svg>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative">
          <div className="inline-flex rounded-lg bg-white p-2.5 shadow-lg">
            <img src="/logo.jpeg" alt="KFSTORE" className="h-8 w-auto" />
          </div>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            La plateforme qui pilote<br />votre réseau de boutiques
          </h2>
          <p className="max-w-sm text-sm text-teal-100">
            Stocks, ventes, dettes, transferts et Aide Humanitaire — tout GROUPE SKF SARL sur un seul back-office,
            boutique par boutique et consolidé au siège.
          </p>
        </div>

        <p className="relative text-xs text-teal-200/70">© {new Date().getFullYear()} GROUPE SKF SARL — KFSTORE</p>
      </div>

      {/* Formulaire */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <img src="/logo.jpeg" alt="KFSTORE" className="h-9 w-auto" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
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
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
                    <PasswordInput value={motDePasse} onChange={setMotDePasse} placeholder="••••••••" autoComplete="current-password" required />
                  </div>

                  {info && <p className="text-sm text-teal-700">{info}</p>}
                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <SubmitButton submitting={submitting} label="Se connecter" labelSubmitting="Connexion…" />
                  <LienSecondaire
                    onClick={() => {
                      setError(null)
                      setInfo(null)
                      setResetContact(contact)
                      setVue('demande-code')
                    }}
                  >
                    Mot de passe oublié ?
                  </LienSecondaire>
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
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      required
                      autoFocus
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <SubmitButton submitting={submitting} label="Valider" labelSubmitting="Vérification…" />
                  <LienSecondaire
                    onClick={() => {
                      setError(null)
                      setCode2FA('')
                      setVue('connexion')
                    }}
                  >
                    Retour à la connexion
                  </LienSecondaire>
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
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <SubmitButton submitting={submitting} label="Recevoir le code par SMS" labelSubmitting="Envoi…" />
                  <LienSecondaire
                    onClick={() => {
                      setError(null)
                      setVue('connexion')
                    }}
                  >
                    Retour à la connexion
                  </LienSecondaire>
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
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                    <PasswordInput value={nouveauMotDePasse} onChange={setNouveauMotDePasse} placeholder="••••••••" autoComplete="new-password" required minLength={6} />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <SubmitButton submitting={submitting} label="Réinitialiser le mot de passe" labelSubmitting="Validation…" />
                  <LienSecondaire
                    onClick={() => {
                      setError(null)
                      setVue('demande-code')
                    }}
                  >
                    Je n'ai pas reçu le code
                  </LienSecondaire>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
