import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchableSelect({ options, value, onChange, placeholder = 'Search...' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-31.5 text-center bg-surface border border-border-subtle p-2.5 rounded-xl text-text-primary text-[11px] transition-colors"
      >
        {selectedLabel}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border-subtle rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="p-2.5 bg-void border-b border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-text-muted p-3">No results</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery('')
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  o.value === value
                    ? 'bg-trace/20 text-trace'
                    : 'text-text-primary hover:bg-surface-hover'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect