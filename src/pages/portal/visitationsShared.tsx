import type { ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

export type ResidentJoin = {
  internal_code?: string | null
  case_control_no?: string | null
} | { internal_code?: string | null; case_control_no?: string | null }[] | null

export type ResidentOption = {
  resident_id: number
  internal_code: string | null
  case_control_no: string | null
}

export function residentCodesLabel(internal_code?: string | null, case_control_no?: string | null): string {
  const code = (internal_code ?? '').trim()
  const cc = (case_control_no ?? '').trim()
  if (code && cc) return `${code} (${cc})`
  if (code) return code
  if (cc) return cc
  return ''
}

export function embedResident(r: ResidentJoin): { internal_code?: string | null; case_control_no?: string | null } | null {
  if (r == null) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}

export function residentLabelFromRow(row: {
  resident_id: number | null
  residents?: ResidentJoin
}): string {
  const r = embedResident(row.residents ?? null)
  const parts = residentCodesLabel(r?.internal_code, r?.case_control_no)
  if (parts) return parts
  if (row.resident_id != null) return `Resident #${row.resident_id}`
  return '—'
}

export function parseISODateToUTC(dateStr: string | null | undefined): number | null {
  const d = (dateStr ?? '').toString().slice(0, 10)
  if (!d) return null
  const t = Date.parse(`${d}T00:00:00Z`)
  return Number.isFinite(t) ? t : null
}

export function formatFriendlyDate(dateStr: string | null | undefined): string {
  const t = parseISODateToUTC(dateStr)
  if (t == null) return '—'
  const d = new Date(t)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

export const inputClass =
  'w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

export function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="p-6 border-b border-[var(--wt-border)]">
          <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--wt-text-2)] mt-1">{subtitle}</p>}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export async function fetchResidentOptions(): Promise<{ data: ResidentOption[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select('resident_id, internal_code, case_control_no')
    .order('resident_id', { ascending: true })
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ResidentOption[], error: null }
}
