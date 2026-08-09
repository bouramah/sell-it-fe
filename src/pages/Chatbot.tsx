import { useEffect, useState } from 'react'
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

  useEffect(() => {
    api.chatbotConfig().then(setConfig)
    api.chatbotDemo().then(setConversation)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chatbot service client</h1>
        <p className="text-sm text-slate-500">Configuration et supervision des conversations</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Conversation — client mobile
          </h2>
          <div className="space-y-3">
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
            Toute réponse hors périmètre est escaladée vers un opérateur boutique ou siège.
          </p>
        </section>
      </div>
    </div>
  )
}
