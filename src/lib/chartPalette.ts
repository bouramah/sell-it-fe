// Palette catégorielle validée (CVD-safe, ordre fixe — ne jamais réordonner par valeur).
export const CATEGORICAL = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
] as const

// Hue principale pour les séries uniques (tendance CA, barres de classement) — proche du teal de marque.
export const PRIMARY = '#1baf7a'
export const PRIMARY_WASH = 'rgba(27, 175, 122, 0.10)'

export const CHART_INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff',
}

export function colorFor(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]
}
