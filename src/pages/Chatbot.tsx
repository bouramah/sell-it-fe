import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { ConversationMessage } from '../types'

const CONFIG_LABELS: Record<string, string> = {
  chatbot_actif: 'Chatbot actif — Web et Mobile',
  suivi_commande_automatique: 'Suivi de commande automatique',
  relance_echeances_dette: 'Relance des échéances de dette',
  escalade_operateur_humain: 'Escalade vers opérateur humain',
  reponses_langue_locale_test: 'Réponses en langue locale (test)',
}

export default function Chatbot() {
  const [config, setConfig] = useState<Record<string, boolean>>({})
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.chatbotConfig().then(setConfig)
  }, [])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  async function envoyer() {
    const texte = saisie.trim()
    if (!texte || envoiEnCours) return
    const historique = conversation
    setConversation([...historique, { auteur: 'client', texte }])
    setSaisie('')
    setEnvoiEnCours(true)
    try {
      const { reponse } = await api.chatbotTester(texte, historique)
      setConversation((c) => [...c, { auteur: 'bot', texte: reponse }])
    } catch {
      setConversation((c) => [...c, { auteur: 'bot', texte: "Erreur — l'assistant n'a pas pu répondre." }])
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chatbot service client</h1>
        <p className="text-sm text-slate-500">Configuration et test de l'assistant IA</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Testeur — contexte de compte fictif
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Simule une conversation avec un client de test (commande #CMD-1042, dette 210 000 GNF) — pour vérifier le
            comportement réel de l'assistant sans compte client.
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: 420, minHeight: 200 }}>
            {conversation.length === 0 && (
              <p className="text-sm text-slate-400">Écrivez un message ci-dessous pour démarrer le test.</p>
            )}
            {conversation.map((m, i) => (
              <div key={i} className={`flex ${m.auteur === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.auteur === 'client' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.texte}
                </div>
              </div>
            ))}
            {envoiEnCours && <p className="text-xs text-slate-400">L'assistant écrit…</p>}
            <div ref={finRef} />
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && envoyer()}
              placeholder="Écrire un message de test…"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={envoiEnCours}
            />
            <button
              onClick={envoyer}
              disabled={envoiEnCours || !saisie.trim()}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Configuration</h2>
          <ul className="space-y-3">
            {Object.entries(config).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-700">{CONFIG_LABELS[key] ?? key}</span>
                <span
                  className={`inline-block h-5 w-9 rounded-full transition-colors ${value ? 'bg-teal-700' : 'bg-slate-300'}`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                      value ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            "Chatbot actif" se pilote depuis Sécurité → Paramètres application. Les autres indicateurs reflètent la
            feuille de route, pas encore tous implémentés.
          </p>
        </section>
      </div>
    </div>
  )
}
