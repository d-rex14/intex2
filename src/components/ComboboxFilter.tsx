import { useEffect, useRef, useState } from 'react'

export type ComboboxOption = {
  value: string
  label: string
}

type Props = {
  label: string
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const selectClass =
  'w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

export function ComboboxFilter({ label, options, value, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayText = open ? query : (selected?.label ?? '')

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  // Always ensure the "all" option appears first even when filtered
  const allOption = options.find((o) => o.value === 'all')
  const filteredWithAll =
    allOption && query.trim() && !filtered.find((o) => o.value === 'all')
      ? [allOption, ...filtered]
      : filtered

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const select = (opt: ComboboxOption) => {
    onChange(opt.value)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`flex flex-col gap-1 relative ${className ?? ''}`}>
      <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</span>
      <input
        ref={inputRef}
        className={selectClass}
        value={displayText}
        placeholder={placeholder ?? `Filter ${label.toLowerCase()}…`}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            setQuery('')
            inputRef.current?.blur()
          }
        }}
        autoComplete="off"
      />
      {open && filteredWithAll.length > 0 && (
        <ul
          className="absolute z-50 top-full mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-lg py-1"
          role="listbox"
        >
          {filteredWithAll.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] ${
                opt.value === value
                  ? 'text-[var(--wt-accent)] font-medium'
                  : 'text-[var(--wt-text)]'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                select(opt)
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
