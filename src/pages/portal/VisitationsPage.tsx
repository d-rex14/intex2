import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type VisitationRow = {
  visitation_id: number
  resident_id: number | null
  visit_date: string | null
  social_worker: string | null
  visit_type: string | null
  location_visited: string | null
  family_members_present: string | null
  purpose: string | null
  observations: string | null
  family_cooperation_level: string | null
  safety_concerns_noted: boolean | null
  follow_up_needed: boolean | null
  follow_up_notes: string | null
  visit_outcome: string | null
  residents?: {
    first_name?: string | null
    last_name?: string | null
  } | { first_name?: string | null; last_name?: string | null }[] | null
}

type ResidentOption = {
  resident_id: number
  first_name: string | null
  last_name: string | null
}

function embedResident(r: VisitationRow['residents']): { first_name?: string | null; last_name?: string | null } | null {
  if (r == null) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}

function residentLabel(row: VisitationRow): string {
  const r = embedResident(row.residents)
  const parts = [r?.first_name, r?.last_name].filter(Boolean).join(' ').trim()
  if (parts) return parts
  if (row.resident_id != null) return `Resident #${row.resident_id}`
  return '—'
}

function parseISODateToUTC(dateStr: string | null | undefined): number | null {
  const d = (dateStr ?? '').toString().slice(0, 10)
  if (!d) return null
  const t = Date.parse(`${d}T00:00:00Z`)
  return Number.isFinite(t) ? t : null
}

function formatFriendlyDate(dateStr: string | null | undefined): string {
  const t = parseISODateToUTC(dateStr)
  if (t == null) return '—'
  const d = new Date(t)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

const inputClass =
  'w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

async function fetchVisitations(): Promise<{ data: VisitationRow[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('home_visitations')
    .select(
      `
        visitation_id,
        resident_id,
        visit_date,
        social_worker,
        visit_type,
        location_visited,
        family_members_present,
        purpose,
        observations,
        family_cooperation_level,
        safety_concerns_noted,
        follow_up_needed,
        follow_up_notes,
        visit_outcome,
        residents ( first_name, last_name )
      `,
    )
    .order('visit_date', { ascending: false })
    .limit(1000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as VisitationRow[], error: null }
}

async function fetchResidentOptions(): Promise<{ data: ResidentOption[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select('resident_id, first_name, last_name')
    .order('resident_id', { ascending: true })
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ResidentOption[], error: null }
}

type VisitationDraft = Pick<
  VisitationRow,
  | 'resident_id'
  | 'visit_date'
  | 'social_worker'
  | 'visit_type'
  | 'location_visited'
  | 'family_members_present'
  | 'purpose'
  | 'observations'
  | 'family_cooperation_level'
  | 'safety_concerns_noted'
  | 'follow_up_needed'
  | 'follow_up_notes'
  | 'visit_outcome'
>

function emptyDraft(): VisitationDraft {
  return {
    resident_id: null,
    visit_date: new Date().toISOString().slice(0, 10),
    social_worker: '',
    visit_type: 'Routine Follow-Up',
    location_visited: '',
    family_members_present: '',
    purpose: '',
    observations: '',
    family_cooperation_level: 'Neutral',
    safety_concerns_noted: false,
    follow_up_needed: false,
    follow_up_notes: '',
    visit_outcome: 'Inconclusive',
  }
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl max-h-[90vh] overflow-y-auto"
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

export function VisitationsPage() {
  useAuth()

  const [search, setSearch] = useState('')
  const [residentFilter, setResidentFilter] = useState<string>('all')
  const [workerFilter, setWorkerFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')
  const [safetyOnly, setSafetyOnly] = useState(false)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)

  const [detailRow, setDetailRow] = useState<VisitationRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<VisitationRow | null>(null)
  const [draft, setDraft] = useState<VisitationDraft>(emptyDraft())
  const [deleting, setDeleting] = useState<VisitationRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const visitQ = useMemo(() => () => fetchVisitations(), [])
  const { data: rawRows, loading, error, refetch } = useSupabaseQuery<VisitationRow[]>(visitQ)

  const residentsQ = useMemo(() => () => fetchResidentOptions(), [])
  const { data: residentOptions } = useSupabaseQuery<ResidentOption[]>(residentsQ)

  const socialWorkers = useMemo(() => {
    const s = new Set<string>()
    for (const r of rawRows ?? []) {
      const w = (r.social_worker ?? '').trim()
      if (w) s.add(w)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawRows])

  const visitTypes = useMemo(() => {
    const s = new Set<string>()
    for (const r of rawRows ?? []) {
      const t = (r.visit_type ?? '').trim()
      if (t) s.add(t)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawRows])

  const outcomes = useMemo(() => {
    const s = new Set<string>()
    for (const r of rawRows ?? []) {
      const t = (r.visit_outcome ?? '').trim()
      if (t) s.add(t)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [rawRows])

  const filtered = useMemo(() => {
    const rows = rawRows ?? []
    const q = search.trim().toLowerCase()
    const fromT = fromDate ? parseISODateToUTC(fromDate) : null
    const toT = toDate ? parseISODateToUTC(toDate) : null
    const residentId =
      residentFilter === 'all' ? null : Number.isFinite(Number(residentFilter)) ? Number(residentFilter) : null

    return rows.filter((r) => {
      if (residentId != null && r.resident_id !== residentId) return false
      if (workerFilter !== 'all' && (r.social_worker ?? '') !== workerFilter) return false
      if (typeFilter !== 'all' && (r.visit_type ?? '') !== typeFilter) return false
      if (outcomeFilter !== 'all' && (r.visit_outcome ?? '') !== outcomeFilter) return false
      if (safetyOnly && !r.safety_concerns_noted) return false

      if (fromT != null || toT != null) {
        const t = parseISODateToUTC(r.visit_date)
        if (t == null) return false
        if (fromT != null && t < fromT) return false
        if (toT != null && t > toT) return false
      }

      if (q) {
        const name = residentLabel(r).toLowerCase()
        const id = String(r.visitation_id)
        const sw = (r.social_worker ?? '').toLowerCase()
        const obs = (r.observations ?? '').toLowerCase()
        const purpose = (r.purpose ?? '').toLowerCase()
        if (!name.includes(q) && !id.includes(q) && !sw.includes(q) && !obs.includes(q) && !purpose.includes(q)) return false
      }

      return true
    })
  }, [
    rawRows,
    search,
    residentFilter,
    workerFilter,
    typeFilter,
    outcomeFilter,
    safetyOnly,
    fromDate,
    toDate,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useMemo(() => {
    if (page > totalPages) setPage(totalPages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  const openCreate = () => {
    setFormError(null)
    setDraft(emptyDraft())
    setCreating(true)
  }

  const openEdit = (row: VisitationRow) => {
    setFormError(null)
    setEditing(row)
    setDraft({
      resident_id: row.resident_id ?? null,
      visit_date: row.visit_date?.slice(0, 10) ?? '',
      social_worker: row.social_worker ?? '',
      visit_type: row.visit_type ?? '',
      location_visited: row.location_visited ?? '',
      family_members_present: row.family_members_present ?? '',
      purpose: row.purpose ?? '',
      observations: row.observations ?? '',
      family_cooperation_level: row.family_cooperation_level ?? '',
      safety_concerns_noted: Boolean(row.safety_concerns_noted),
      follow_up_needed: Boolean(row.follow_up_needed),
      follow_up_notes: row.follow_up_notes ?? '',
      visit_outcome: row.visit_outcome ?? '',
    })
  }

  const saveDraft = async () => {
    if (!supabase) return
    setBusy(true)
    setFormError(null)

    const payload = {
      resident_id: draft.resident_id,
      visit_date: draft.visit_date || null,
      social_worker: draft.social_worker?.trim() || null,
      visit_type: draft.visit_type?.trim() || null,
      location_visited: draft.location_visited?.trim() || null,
      family_members_present: draft.family_members_present?.trim() || null,
      purpose: draft.purpose?.trim() || null,
      observations: draft.observations?.trim() || null,
      family_cooperation_level: draft.family_cooperation_level?.trim() || null,
      safety_concerns_noted: Boolean(draft.safety_concerns_noted),
      follow_up_needed: Boolean(draft.follow_up_needed),
      follow_up_notes: draft.follow_up_notes?.trim() || null,
      visit_outcome: draft.visit_outcome?.trim() || null,
    }

    try {
      if (editing) {
        const { error: upErr } = await supabase.from('home_visitations').update(payload).eq('visitation_id', editing.visitation_id)
        if (upErr) throw upErr
        setEditing(null)
      } else {
        const { error: insErr } = await supabase.from('home_visitations').insert(payload)
        if (insErr) throw insErr
        setCreating(false)
      }
      refetch()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.'
      setFormError(msg)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!supabase || !deleting) return
    setBusy(true)
    setFormError(null)
    try {
      const { error: delErr } = await supabase.from('home_visitations').delete().eq('visitation_id', deleting.visitation_id)
      if (delErr) throw delErr
      setDeleting(null)
      refetch()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete.'
      setFormError(msg)
    } finally {
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load home visitation data.
        </p>
      </div>
    )
  }

  const rangeFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, filtered.length)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Home Visitations</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">
            Field and home visits for family assessment, reintegration planning, and follow-up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
          >
            New visitation
          </button>
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-[#dc2626]/40 bg-[#dc2626]/10 px-4 py-2 text-sm text-[#dc2626] flex justify-between gap-4 items-center">
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-center rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3 text-sm">
        <label className="flex flex-col gap-1 min-w-[12rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Resident, worker, purpose, observations…"
            className={selectClass}
          />
        </label>

        <label className="flex flex-col gap-1 min-w-[12rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Resident</span>
          <select
            className={selectClass}
            value={residentFilter}
            onChange={(e) => {
              setResidentFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All residents</option>
            {(residentOptions ?? []).map((r) => {
              const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || `Resident #${r.resident_id}`
              return (
                <option key={r.resident_id} value={String(r.resident_id)}>
                  {name}
                </option>
              )
            })}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[12rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Social worker</span>
          <select
            className={selectClass}
            value={workerFilter}
            onChange={(e) => {
              setWorkerFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All workers</option>
            {socialWorkers.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[12rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Visit type</span>
          <select
            className={selectClass}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All types</option>
            {visitTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[12rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Outcome</span>
          <select
            className={selectClass}
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All outcomes</option>
            {outcomes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            checked={safetyOnly}
            onChange={(e) => {
              setSafetyOnly(e.target.checked)
              setPage(1)
            }}
            className="rounded border-[var(--wt-border)] mb-2"
          />
          <span className="text-sm text-[var(--wt-text)]">Safety concerns only</span>
        </label>

        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              setPage(1)
            }}
            className={selectClass}
          />
        </label>

        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }}
            className={selectClass}
          />
        </label>

        <label className="flex flex-col gap-1 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows</span>
          <select
            className={selectClass}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {!loading && !error && (
          <p className="text-[var(--wt-text-2)] lg:ml-auto tabular-nums">
            Showing {rangeFrom}–{rangeTo} of {filtered.length}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading visitations…
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Resident</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Worker</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Cooperation</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Safety</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Outcome</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={r.visitation_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatFriendlyDate(r.visit_date)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] font-medium whitespace-nowrap">{residentLabel(r)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.social_worker ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.visit_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.family_cooperation_level ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.safety_concerns_noted ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.visit_outcome ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailRow(r)}
                        className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)] transition-colors"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="text-[var(--wt-accent)] hover:underline text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(r)}
                          className="text-[#dc2626] hover:underline text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">
                      No visitations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {detailRow && (
        <ModalShell
          title={`Visitation #${detailRow.visitation_id}`}
          subtitle={`${formatFriendlyDate(detailRow.visit_date)} • ${residentLabel(detailRow)} • ${detailRow.social_worker ?? '—'}`}
          onClose={() => setDetailRow(null)}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Visit summary</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Type', detailRow.visit_type ?? '—'],
                  ['Outcome', detailRow.visit_outcome ?? '—'],
                  ['Cooperation', detailRow.family_cooperation_level ?? '—'],
                  ['Safety concerns', detailRow.safety_concerns_noted ? 'Yes' : 'No'],
                  ['Follow-up needed', detailRow.follow_up_needed ? 'Yes' : 'No'],
                  ['Location', detailRow.location_visited?.trim() || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</dt>
                    <dd className="text-[var(--wt-text)] mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Purpose</div>
              <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.purpose?.trim() || '—'}</p>
            </div>

            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Observations</div>
              <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.observations?.trim() || '—'}</p>
            </div>

            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Follow-up notes</div>
              <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.follow_up_notes?.trim() || '—'}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)]"
              >
                Close
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {(creating || editing) && (
        <ModalShell
          title={editing ? `Edit visitation #${editing.visitation_id}` : 'New visitation'}
          subtitle="Create or update a home/field visit record."
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Visit date
                <input
                  type="date"
                  value={draft.visit_date ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, visit_date: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Resident
                <select
                  value={draft.resident_id != null ? String(draft.resident_id) : ''}
                  onChange={(e) => setDraft((d) => ({ ...d, resident_id: e.target.value ? Number(e.target.value) : null }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {(residentOptions ?? []).map((r) => {
                    const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || `Resident #${r.resident_id}`
                    return (
                      <option key={r.resident_id} value={String(r.resident_id)}>
                        {name}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Social worker
                <input value={draft.social_worker ?? ''} onChange={(e) => setDraft((d) => ({ ...d, social_worker: e.target.value }))} className={inputClass} />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Visit type
                <input value={draft.visit_type ?? ''} onChange={(e) => setDraft((d) => ({ ...d, visit_type: e.target.value }))} className={inputClass} />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Cooperation level
                <input
                  value={draft.family_cooperation_level ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, family_cooperation_level: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Outcome
                <input value={draft.visit_outcome ?? ''} onChange={(e) => setDraft((d) => ({ ...d, visit_outcome: e.target.value }))} className={inputClass} />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Location visited
                <input value={draft.location_visited ?? ''} onChange={(e) => setDraft((d) => ({ ...d, location_visited: e.target.value }))} className={inputClass} />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Family members present
                <input
                  value={draft.family_members_present ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, family_members_present: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Purpose
                <textarea rows={2} value={draft.purpose ?? ''} onChange={(e) => setDraft((d) => ({ ...d, purpose: e.target.value }))} className={inputClass} />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Observations
                <textarea
                  rows={4}
                  value={draft.observations ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, observations: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-1 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.safety_concerns_noted)}
                  onChange={(e) => setDraft((d) => ({ ...d, safety_concerns_noted: e.target.checked }))}
                  className="rounded border-[var(--wt-border)]"
                />
                Safety concerns noted
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-1 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.follow_up_needed)}
                  onChange={(e) => setDraft((d) => ({ ...d, follow_up_needed: e.target.checked }))}
                  className="rounded border-[var(--wt-border)]"
                />
                Follow-up needed
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Follow-up notes
                <textarea
                  rows={2}
                  value={draft.follow_up_notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, follow_up_notes: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
                className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveDraft()}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {deleting && (
        <ModalShell
          title="Delete visitation?"
          subtitle={`This will permanently delete visitation #${deleting.visitation_id}.`}
          onClose={() => setDeleting(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--wt-text-2)]">This action cannot be undone. Please confirm deletion.</p>
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
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

