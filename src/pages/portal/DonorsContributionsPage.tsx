import { useMemo } from 'react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type SupporterEmbed = {
  display_name: string | null
  organization_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
} | null

export type DonationWithSupporter = {
  donation_id: number
  supporter_id: number | null
  donation_type: string | null
  donation_date: string | null
  is_recurring: boolean | null
  campaign_name: string | null
  channel_source: string | null
  currency_code: string | null
  amount: number | null
  estimated_value: number | null
  impact_unit: string | null
  notes: string | null
  supporters: SupporterEmbed
}

/** PostgREST may return a nested FK as one object or a single-element array depending on typings. */
function embedSupporter(s: SupporterEmbed | NonNullable<SupporterEmbed>[] | null | undefined): SupporterEmbed {
  if (s == null) return null
  return Array.isArray(s) ? (s[0] ?? null) : s
}

function donorLabel(row: DonationWithSupporter): string {
  const s = row.supporters
  if (!s) return '—'
  if (s.display_name?.trim()) return s.display_name.trim()
  if (s.organization_name?.trim()) return s.organization_name.trim()
  const parts = [s.first_name, s.last_name].filter(Boolean).join(' ').trim()
  if (parts) return parts
  return '—'
}

function donorEmail(row: DonationWithSupporter): string {
  return row.supporters?.email?.trim() || '—'
}

function formatAmount(row: DonationWithSupporter): string {
  const unit = row.impact_unit?.toLowerCase() ?? ''
  const val = row.amount ?? row.estimated_value
  if (val == null) return '—'
  const n = Number(val)
  if (Number.isNaN(n)) return '—'
  if (unit === 'hours' || row.donation_type === 'Time') {
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} hrs`
  }
  if (unit === 'items' || row.donation_type === 'InKind') {
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} items (est.)`
  }
  const cur = row.currency_code?.trim() || ''
  if (cur) {
    return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function sortDonationsBySupporterFrequency(rows: DonationWithSupporter[]): DonationWithSupporter[] {
  const counts = new Map<number | string, number>()
  for (const d of rows) {
    const key = d.supporter_id ?? 'none'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...rows].sort((a, b) => {
    const ca = counts.get(a.supporter_id ?? 'none') ?? 0
    const cb = counts.get(b.supporter_id ?? 'none') ?? 0
    if (cb !== ca) return cb - ca
    const da = a.donation_date ?? ''
    const db = b.donation_date ?? ''
    if (da !== db) return db.localeCompare(da)
    return b.donation_id - a.donation_id
  })
}

async function fetchDonationsSortedByFrequency(): Promise<{
  data: DonationWithSupporter[] | null
  error: { message: string } | null
}> {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured.' } }
  }

  const { data, error } = await supabase
    .from('donations')
    .select(`
      donation_id,
      supporter_id,
      donation_type,
      donation_date,
      is_recurring,
      campaign_name,
      channel_source,
      currency_code,
      amount,
      estimated_value,
      impact_unit,
      notes,
      supporters (
        display_name,
        organization_name,
        first_name,
        last_name,
        email
      )
    `)

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  const rows: DonationWithSupporter[] = (data ?? []).map(row => {
    const r = row as Omit<DonationWithSupporter, 'supporters'> & {
      supporters: SupporterEmbed | NonNullable<SupporterEmbed>[] | null
    }
    return { ...r, supporters: embedSupporter(r.supporters) }
  })
  return { data: sortDonationsBySupporterFrequency(rows), error: null }
}

export function DonorsContributionsPage() {
  const queryFn = useMemo(
    () => () => fetchDonationsSortedByFrequency(),
    [],
  )

  const { data: rows, loading, error, refetch } = useSupabaseQuery(queryFn)

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load donations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Donors & Contributions</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1 max-w-2xl">
            All donations from your database. Rows are ordered by{' '}
            <strong className="text-[var(--wt-text)]">donor frequency</strong> (supporters with the most
            donations listed first), then by donation date (newest first).
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="shrink-0 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading donations…
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-[#dc2626]">{error}</p>
            <p className="text-xs text-[var(--wt-text-2)] mt-2">
              If this is a permission error, add a Supabase RLS policy allowing authenticated users to read{' '}
              <code className="text-[var(--wt-text)]">donations</code> and{' '}
              <code className="text-[var(--wt-text)]">supporters</code>, or adjust your project policies.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Donor</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount / value</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Recurring</th>
                  <th className="px-4 py-3 font-medium min-w-[8rem]">Campaign</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Channel</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map(row => (
                  <tr
                    key={row.donation_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] tabular-nums">{row.donation_id}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{donorLabel(row)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] text-xs max-w-[12rem] truncate">
                      {donorEmail(row)}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{row.donation_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {row.donation_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatAmount(row)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{row.is_recurring ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] max-w-[10rem] truncate">
                      {row.campaign_name?.trim() || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)]">{row.channel_source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(rows ?? []).length === 0 && (
              <p className="text-sm text-[var(--wt-text-2)] px-4 py-8 text-center">No donations found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
