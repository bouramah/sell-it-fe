import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  allowEmpty?: string // label for a "clear selection" option, e.g. "Toutes les boutiques"
  disabled?: boolean
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  required,
  allowEmpty,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const allOptions: SelectOption[] = allowEmpty ? [{ value: '', label: allowEmpty }, ...options] : options
  const filtered = query
    ? allOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : allOptions

  function select(option: SelectOption) {
    onChange(option.value)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) select(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        required={required && !value}
        disabled={disabled}
        value={open ? query : selectedLabel}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlight(0)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          if (disabled) return
          setOpen(true)
          setQuery('')
          setHighlight(0)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Aucun résultat</div>}
          {filtered.map((o, i) => (
            <button
              type="button"
              key={o.value || '__empty__'}
              onMouseDown={(e) => {
                e.preventDefault()
                select(o)
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${
                i === highlight ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
              } ${o.value === value ? 'font-medium' : ''}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
