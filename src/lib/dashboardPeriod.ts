export type PeriodPreset = 'heure' | '24h' | '7j' | '31j' | 'personnalise'

export const PRESET_LABELS: Record<PeriodPreset, string> = {
  heure: 'Dernière heure',
  '24h': '24 dernières heures',
  '7j': '7 derniers jours',
  '31j': '31 derniers jours',
  personnalise: 'Personnalisé',
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function periodFromPreset(preset: PeriodPreset, customDebut?: string, customFin?: string): { debut: string; fin: string } {
  const now = new Date()

  if (preset === 'personnalise') {
    const debut = customDebut ? new Date(`${customDebut}T00:00:00`) : new Date(now.getTime() - 7 * 86400000)
    const fin = customFin ? new Date(`${customFin}T23:59:59`) : now
    return { debut: toLocalIso(debut), fin: toLocalIso(fin) }
  }

  const hours: Record<Exclude<PeriodPreset, 'personnalise'>, number> = {
    heure: 1,
    '24h': 24,
    '7j': 24 * 7,
    '31j': 24 * 31,
  }

  const debut = new Date(now.getTime() - hours[preset] * 3600000)
  return { debut: toLocalIso(debut), fin: toLocalIso(now) }
}
