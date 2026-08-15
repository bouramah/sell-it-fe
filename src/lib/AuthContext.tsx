import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { clearToken, getToken, setToken } from './auth'
import type { UtilisateurConnecte } from '../types/write'

interface AuthContextValue {
  user: UtilisateurConnecte | null
  loading: boolean
  // Renvoie otpRequis=true si la 2FA est exigée pour ce compte — dans ce cas la connexion
  // n'est pas encore effective, il faut appeler verifier2FA(contact, code) pour la terminer.
  login: (contact: string, motDePasse: string) => Promise<{ otpRequis: boolean }>
  verifier2FA: (contact: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UtilisateurConnecte | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .moi()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(contact: string, motDePasse: string) {
    const { otp_requis, access_token } = await api.login({ contact, mot_de_passe: motDePasse })
    if (otp_requis || !access_token) return { otpRequis: true }
    setToken(access_token)
    const me = await api.moi()
    setUser(me)
    return { otpRequis: false }
  }

  async function verifier2FA(contact: string, code: string) {
    const { access_token } = await api.verifier2FA({ contact, code })
    if (!access_token) throw new Error('Code invalide ou expiré')
    setToken(access_token)
    const me = await api.moi()
    setUser(me)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, verifier2FA, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
