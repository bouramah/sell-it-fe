interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Rechercher…', className = '' }: SearchInputProps) {
  return (
    <div className={`relative w-full max-w-xs ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      />
    </div>
  )
}
