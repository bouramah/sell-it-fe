import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import SearchInput from '../components/SearchInput'
import StatCard from '../components/StatCard'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import type { ComptabiliteConsolidee, CompteResultatBoutique, EcritureComptable, EtatStockValorise } from '../types'

type Onglet = 'resultat' | 'journal' | 'stock'

const NATURE_LABELS: Record<string, string> = {
  vente: 'Vente',
  achat: 'Achat',
  depense: 'Dépense',
  remboursement: 'Remboursement',
}

export default function Comptabilite() {
  const [onglet, setOnglet] = useState<Onglet>('resultat')
  const [data, setData] = useState<ComptabiliteConsolidee | null>(null)
  const [journal, setJournal] = useState<EcritureComptable[] | null>(null)
  const [stock, setStock] = useState<EtatStockValorise | null>(null)
  const [denied, setDenied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.comptabilite().then(setData).catch(() => setDenied(true))
  }, [])

  useEffect(() => {
    if (onglet === 'journal' && !journal) api.journalComptable().then(setJournal).catch(() => setDenied(true))
    if (onglet === 'stock' && !stock) api.stockValorise().then(setStock).catch(() => setDenied(true))
  }, [onglet, journal, stock])

  const getFieldsComptes = useCallback((c: CompteResultatBoutique) => [nomBoutique(c.boutique_id)], [nomBoutique])
  const { query, setQuery, filtered } = useSearch(data?.comptes ?? [], getFieldsComptes)

  const getFieldsJournal = useCallback(
    (e: EcritureComptable) => [nomBoutique(e.boutique_id), e.libelle, e.auteur ?? ''],
    [nomBoutique],
  )
  const { query: queryJournal, setQuery: setQueryJournal, filtered: journalFiltre } = useSearch(journal ?? [], getFieldsJournal)

  const getFieldsStock = useCallback((l: { boutique_id: string; produit_nom: string }) => [nomBoutique(l.boutique_id), l.produit_nom], [nomBoutique])
  const { query: queryStock, setQuery: setQueryStock, filtered: stockFiltre } = useSearch(stock?.lignes ?? [], getFieldsStock)

  async function handleExport() {
    setExporting(true)
    try {
      await api.exporterComptabiliteXlsx()
    } finally {
      setExporting(false)
    }
  }

  if (denied) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        La comptabilité est réservée au gérant (sa boutique), au responsable achats et à l'administrateur (réseau).
      </div>
    )
  }
  if (!data) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comptabilité</h1>
          <p className="text-sm text-slate-500">Résultats, journal des opérations et stock valorisé — sans double saisie</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {exporting ? 'Export…' : 'Exporter (Excel)'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="CA consolidé — cumulé" value={formatGNF(data.ca_consolide)} />
        <StatCard label="Marge nette consolidée" value={formatGNF(data.marge_nette_consolidee)} />
        <StatCard label="Dépenses consolidées" value={formatGNF(data.depenses_consolidees)} />
        <StatCard label="Marge nette moyenne" value={`${data.marge_nette_moyenne_pct} %`} />
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            ['resultat', 'Compte de résultat'],
            ['journal', 'Journal des opérations'],
            ['stock', 'Stock valorisé'],
          ] as [Onglet, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            className={`px-3 py-2 text-sm font-medium ${
              onglet === id ? 'border-b-2 border-teal-700 text-teal-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {onglet === 'resultat' && (
        <section>
          <p className="mb-3 text-xs text-slate-400">
            Calculé en temps réel à partir des commandes, réceptions fournisseurs et dépenses enregistrées — non modifiable
          </p>
          <div className="mb-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une boutique…" />
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Boutique</th>
                  <th className="px-4 py-3 text-right">Chiffre d'affaires</th>
                  <th className="px-4 py-3 text-right">Achats</th>
                  <th className="px-4 py-3 text-right">Dépenses</th>
                  <th className="px-4 py-3 text-right">Marge nette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.boutique_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{nomBoutique(c.boutique_id)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.chiffre_affaires)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.achats)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.depenses)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${c.marge_nette < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatGNF(c.marge_nette)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {onglet === 'journal' && (
        <section>
          <p className="mb-3 text-xs text-slate-400">
            Chaque écriture est dérivée d'une opération déjà enregistrée (vente, achat, dépense, remboursement) — aucune
            saisie comptable manuelle
          </p>
          <div className="mb-3">
            <SearchInput value={queryJournal} onChange={setQueryJournal} placeholder="Rechercher (boutique, libellé, auteur)…" />
          </div>
          {!journal ? (
            <div className="text-slate-400">Chargement…</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Boutique</th>
                    <th className="px-4 py-3">Nature</th>
                    <th className="px-4 py-3">Libellé</th>
                    <th className="px-4 py-3">Auteur</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journalFiltre.map((e) => (
                    <tr key={`${e.operation_source_type}-${e.id}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{new Date(e.date).toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-slate-600">{nomBoutique(e.boutique_id)}</td>
                      <td className="px-4 py-3 text-slate-600">{NATURE_LABELS[e.nature] ?? e.nature}</td>
                      <td className="px-4 py-3 text-slate-900">{e.libelle}</td>
                      <td className="px-4 py-3 text-slate-500">{e.auteur ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${e.sens === 'credit' ? 'text-teal-700' : 'text-red-600'}`}>
                        {e.sens === 'credit' ? '+' : '-'}
                        {formatGNF(e.montant)}
                      </td>
                    </tr>
                  ))}
                  {journalFiltre.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Aucune écriture.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {onglet === 'stock' && (
        <section>
          <p className="mb-3 text-xs text-slate-400">
            Valorisé au coût moyen d'achat (prix fournisseurs actifs) — un produit sans prix d'achat renseigné apparaît à 0,
            plutôt que d'inventer une valeur
          </p>
          <div className="mb-3">
            <SearchInput value={queryStock} onChange={setQueryStock} placeholder="Rechercher (boutique, produit)…" />
          </div>
          {!stock ? (
            <div className="text-slate-400">Chargement…</div>
          ) : (
            <>
              <div className="mb-3">
                <StatCard label="Valeur totale du stock" value={formatGNF(stock.valeur_totale)} />
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Boutique</th>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3 text-right">Quantité</th>
                      <th className="px-4 py-3 text-right">Coût unitaire moyen</th>
                      <th className="px-4 py-3 text-right">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockFiltre.map((l) => (
                      <tr key={`${l.boutique_id}-${l.produit_id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{nomBoutique(l.boutique_id)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{l.produit_nom}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{l.quantite}</td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {l.cout_unitaire_moyen ? formatGNF(l.cout_unitaire_moyen) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(l.valeur)}</td>
                      </tr>
                    ))}
                    {stockFiltre.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                          Aucune ligne de stock.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
