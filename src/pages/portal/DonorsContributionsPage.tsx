import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { campaignOptionsForSelect } from '../../lib/fundraisingCampaigns'
import { isStaffLike } from '../../lib/roles'
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

type DonationType = 'Monetary' | 'InKind' | 'Time' | 'Skills' | 'SocialMedia'

const DONATION_TYPES: DonationType[] = ['Monetary', 'InKind', 'Time', 'Skills', 'SocialMedia']

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

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

function sortFilteredByDate(
  rows: DonationWithSupporter[],
  order: 'newest' | 'oldest',
): DonationWithSupporter[] {
  return [...rows].sort((a, b) => {
    const da = a.donation_date ?? ''
    const db = b.donation_date ?? ''
    if (da !== db) {
      const cmp = da.localeCompare(db)
      return order === 'newest' ? -cmp : cmp
    }
    return order === 'newest' ? b.donation_id - a.donation_id : a.donation_id - b.donation_id
  })
}

async function fetchDonations(): Promise<{
  data: DonationWithSupporter[] | null
  error: { message: string } | null
}> {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured.' } }
  }

  // Cap payload size; raise limit if you need a full export in-app.
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
    .limit(1000)

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  const rows: DonationWithSupporter[] = (data ?? []).map(row => {
    const r = row as Omit<DonationWithSupporter, 'supporters'> & {
      supporters: SupporterEmbed | NonNullable<SupporterEmbed>[] | null
    }
    return { ...r, supporters: embedSupporter(r.supporters) }
  })
  return { data: rows, error: null }
}

const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

export function DonorsContributionsPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)

  const [donationTypeFilter, setDonationTypeFilter] = useState<'all' | DonationType>('all')
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)

  const [editing, setEditing] = useState<DonationWithSupporter | null>(null)
  const [deleting, setDeleting] = useState<DonationWithSupporter | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const queryFn = useMemo(() => () => fetchDonations(), [])

  const { data: rawRows, loading, error, refetch } = useSupabaseQuery(queryFn)

  const filteredRows = useMemo(() => {
    const rows = rawRows ?? []
    let subset =
      donationTypeFilter === 'all' ? rows : rows.filter(r => r.donation_type === donationTypeFilter)
    if (donationTypeFilter === 'all') {
      return sortDonationsBySupporterFrequency(subset)
    }
    return sortFilteredByDate(subset, sortByDate)
  }, [rawRows, donationTypeFilter, sortByDate])

  useEffect(() => {
    setPage(1)
  }, [donationTypeFilter, sortByDate, pageSize])

  const totalFiltered = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const rangeFrom = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalFiltered)

  const saveEdit = async () => {
    if (!supabase || !editing) return
    setSaving(true)
    setFormError(null)
    const campaign = editing.campaign_name?.trim() || null
    const { error: upErr } = await supabase
      .from('donations')
      .update({
        donation_type: editing.donation_type,
        donation_date: editing.donation_date,
        amount: editing.amount,
        estimated_value: editing.estimated_value,
        notes: editing.notes,
        is_recurring: editing.is_recurring,
        campaign_name: campaign,
        channel_source: editing.channel_source,
        currency_code: editing.currency_code,
        impact_unit: editing.impact_unit,
      })
      .eq('donation_id', editing.donation_id)

    if (upErr) setFormError(upErr.message)
    else {
      setEditing(null)
      refetch()
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!supabase || !deleting) return
    setSaving(true)
    setFormError(null)
    const { error: delErr } = await supabase.from('donations').delete().eq('donation_id', deleting.donation_id)
    if (delErr) setFormError(delErr.message)
    else {
      setDeleting(null)
      refetch()
    }
    setSaving(false)
  }

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
            {donationTypeFilter === 'all' ? (
              <>
                With <strong className="text-[var(--wt-text)]">All types</strong>, rows are ordered by donor frequency, then
                date (newest first). Filter by type to sort by donation date only.
              </>
            ) : (
              <>
                Filtered by <strong className="text-[var(--wt-text)]">{donationTypeFilter}</strong>; sorted by donation date
                ({sortByDate === 'newest' ? 'newest first' : 'oldest first'}).
              </>
            )}
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

      {formError && <p className="text-sm text-[#dc2626]">{formError}</p>}

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-center rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3 text-sm">
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Donation type</span>
          <select
            className={selectClass}
            value={donationTypeFilter}
            onChange={e => setDonationTypeFilter(e.target.value as 'all' | DonationType)}
          >
            <option value="all">All types</option>
            {DONATION_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {donationTypeFilter !== 'all' && (
          <label className="flex flex-col gap-1 min-w-[10rem]">
            <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Date order</span>
            <select className={selectClass} value={sortByDate} onChange={e => setSortByDate(e.target.value as 'newest' | 'oldest')}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows per page</span>
          <select
            className={selectClass}
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {!loading && !error && (
          <p className="text-[var(--wt-text-2)] lg:ml-auto tabular-nums">
            Showing {rangeFrom}–{rangeTo} of {totalFiltered}
          </p>
        )}
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
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map(row => (
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
                    {staff && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null)
                              setEditing({ ...row })
                            }}
                            className="text-[var(--wt-accent)] hover:underline text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null)
                              setDeleting(row)
                            }}
                            className="text-[#dc2626] hover:underline text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {totalFiltered === 0 && (
              <p className="text-sm text-[var(--wt-text-2)] px-4 py-8 text-center">No donations found.</p>
            )}
          </div>
        )}
      </div>

      {!loading && !error && totalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--wt-text)]">
          <p className="text-[var(--wt-text-2)] tabular-nums">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
            >
              First
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
            >
              Next
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {editing && staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Edit donation #{editing.donation_id}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Donation date
                <input
                  type="date"
                  value={editing.donation_date?.slice(0, 10) ?? ''}
                  onChange={e => setEditing({ ...editing, donation_date: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Type
                <select
                  value={editing.donation_type?.trim() ?? ''}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      donation_type: e.target.value || null,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                >
                  <option value="">—</option>
                  {editing.donation_type?.trim() &&
                  !DONATION_TYPES.includes(editing.donation_type.trim() as DonationType) ? (
                    <option value={editing.donation_type.trim()}>
                      {editing.donation_type.trim()} (from record)
                    </option>
                  ) : null}
                  {DONATION_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Amount
                <input
                  type="number"
                  step="any"
                  value={editing.amount ?? ''}
                  onChange={e =>
                    setEditing({ ...editing, amount: e.target.value === '' ? null : parseFloat(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Est. value
                <input
                  type="number"
                  step="any"
                  value={editing.estimated_value ?? ''}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      estimated_value: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Currency
                <input
                  value={editing.currency_code ?? ''}
                  onChange={e => setEditing({ ...editing, currency_code: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Impact unit
                <input
                  value={editing.impact_unit ?? ''}
                  onChange={e => setEditing({ ...editing, impact_unit: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Channel
                <input
                  value={editing.channel_source ?? ''}
                  onChange={e => setEditing({ ...editing, channel_source: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Campaign
                <select
                  value={(editing.campaign_name ?? '').trim()}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      campaign_name: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                >
                  {campaignOptionsForSelect(editing.campaign_name).map(o => (
                    <option key={o.value === '' ? '__none' : o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_recurring)}
                  onChange={e => setEditing({ ...editing, is_recurring: e.target.checked })}
                  className="rounded border-[var(--wt-border)]"
                />
                Recurring
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Notes
                <textarea
                  value={editing.notes ?? ''}
                  onChange={e => setEditing({ ...editing, notes: e.target.value || null })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Delete donation?</h2>
            <p className="text-sm text-[var(--wt-text-2)]">
              This will permanently remove donation #{deleting.donation_id} from the database. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
