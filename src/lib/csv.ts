function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function csvRow(...cells: (string | number)[]): string {
  return cells.map(csvEscape).join(';')
}

export function downloadCsv(filenamePrefix: string, lines: string[]) {
  const csv = '﻿' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${filenamePrefix}-${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
