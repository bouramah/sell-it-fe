import { CANAL_LABELS, MODE_PAIEMENT_LABELS, type DashboardKpis } from '../types'
import { csvRow, downloadCsv } from './csv'

export function exportDashboardCsv(kpis: DashboardKpis, periodeLabel: string) {
  const lines: string[] = []

  lines.push(csvRow('Tableau de bord KFSTORE'))
  lines.push(csvRow('Période', periodeLabel))
  lines.push(csvRow('Du', new Date(kpis.debut).toLocaleString('fr-FR')))
  lines.push(csvRow('Au', new Date(kpis.fin).toLocaleString('fr-FR')))
  lines.push('')

  lines.push(csvRow('VENTES'))
  lines.push(csvRow('Chiffre d\'affaires', kpis.ventes.chiffre_affaires))
  lines.push(csvRow('Nombre de commandes', kpis.ventes.nombre_commandes))
  lines.push(csvRow('Panier moyen', kpis.ventes.panier_moyen))
  lines.push('')

  lines.push(csvRow('Par canal'))
  lines.push(csvRow('Canal', 'Montant', 'Nombre'))
  for (const c of kpis.ventes.par_canal) {
    lines.push(csvRow(CANAL_LABELS[c.canal], c.montant, c.nombre))
  }
  lines.push('')

  lines.push(csvRow('Par mode de paiement'))
  lines.push(csvRow('Mode', 'Montant'))
  for (const m of kpis.ventes.par_mode_paiement) {
    lines.push(csvRow(MODE_PAIEMENT_LABELS[m.mode], m.montant))
  }
  lines.push('')

  lines.push(csvRow('Top produits'))
  lines.push(csvRow('Produit', 'Quantité', 'Montant'))
  for (const p of kpis.ventes.top_produits) {
    lines.push(csvRow(p.produit_nom, p.quantite, p.montant))
  }
  lines.push('')

  lines.push(csvRow('Top boutiques'))
  lines.push(csvRow('Boutique', 'Montant'))
  for (const b of kpis.ventes.top_boutiques) {
    lines.push(csvRow(b.nom, b.montant))
  }
  lines.push('')

  lines.push(csvRow('CAISSE'))
  lines.push(csvRow('Encaissements', kpis.caisse.encaissements))
  lines.push(csvRow('Décaissements', kpis.caisse.decaissements))
  lines.push(csvRow('Flux net', kpis.caisse.flux_net))
  lines.push('')

  lines.push(csvRow('STOCK'))
  lines.push(csvRow('Entrées', kpis.stock.entrees))
  lines.push(csvRow('Sorties', kpis.stock.sorties))
  lines.push('')

  lines.push(csvRow('FINANCE'))
  lines.push(csvRow('Dépenses', kpis.finance.depenses))
  lines.push(csvRow('Marge nette', kpis.finance.marge_nette))
  lines.push(csvRow('Dettes clients en cours (solde actuel)', kpis.finance.dettes_clients_en_cours))
  lines.push('')

  lines.push(csvRow('BOUTIQUES'))
  lines.push(csvRow('Boutique', 'CA période', 'Alertes stock'))
  for (const b of kpis.boutiques) {
    lines.push(csvRow(b.nom, b.ca_periode, b.alertes_stock))
  }

  downloadCsv('kfstore-dashboard', lines)
}
