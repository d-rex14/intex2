import { useEffect, useMemo, useState } from 'react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { invalidatePortalDashboard } from '../../lib/portalDataEvents'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import {
  ModalShell,
  fetchResidentOptions,
  formatFriendlyDate,
  inputClass,
  parseISODateToUTC,
  residentCodesLabel,
  residentLabelFromRow,
  selectClass,
  type ResidentOption,
} from './visitationsShared'

type CaseConferenceRow = {
  case_conference_id: number
  resident_id: number
  conference_date: string
  conference_type: string | null
  facilitator: string | null
  status: string
  notes: string | null
  residents?: {
    internal_code?: string | null
    case_control_no?: string | null
  } | { internal_code?: string | null; case_control_no?: string | null }[] | null
}

type ConferenceDraft = {
  resident_id: number | null
  conference_date: string
  conference_type: string
  facilitator: string
  status: string
  notes: string
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

const CONFERENCE_TYPE_OPTIONS = ['Initial', 'Review', 'Discharge planning', 'Other'] as const

const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled'] as const

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft(): ConferenceDraft {
  return {
    resident_id: null,
    conference_date: todayISO(),
    conference_type: 'Review',
    facilitator: '',
    status: 'Scheduled',
    notes: '',
  }
}

function defaultFacilitatorCodes(): string[] {
  return Array.from({ length: 25 }, (_, i) => `SW-${String(i + 1).padStart(2, '0')}`)
}

function mergeSortedStrings(base: readonly string[], fromData: Iterable<string>): string[] {
  const s = new Set<string>(base)
  for (const x of fromData) {
    const t = x.trim()
    if (t) s.add(t)
  }
  return [...s].sort((a, b) => a.localeCompare(b))
}

async function fetchCaseConferences(): Promise<{ data: CaseConferenceRow[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('case_conferences')
    .select(
      `
        case_conference_id,
        resident_id,
        conference_date,
        conference_type,
        facilitator,
        status,
        notes,
        residents ( internal_code, case_control_no )
      `,
    )
    .order('conference_date', { ascending: false })
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as CaseConferenceRow[], error: null }
}

function matchesWhenFilter(row: CaseConferenceRow, when: 'upcoming' | 'past' | 'all'): boolean {
  if (when === 'all') return true
  const d = (row.conference_date ?? '').toString().slice(0, 10)
  const today = todayISO()
  const st = (row.status ?? '').trim()

  if (when === 'upcoming') {
    if (st === 'Cancelled' || st === 'Completed') return false
    return d >= today && st === 'Scheduled'
  }
  if (when === 'past') {
    if (st === 'Cancelled' || st === 'Completed') return true
    if (d < today) return true
    return false
  }
  return true
}

export function CaseConferencesSection() {
  const [search, setSearch] = useState('')
  const [residentFilter, setResidentFilter] = useState<string>('all')
  const [whenFilter, setWhenFilter] = useState<'upcoming' | 'past' | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)

  const [detailRow, setDetailRow] = useState<CaseConferenceRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<CaseConferenceRow | null>(null)
  const [draft, setDraft] = useState<ConferenceDraft>(emptyDraft())
  const [deleting, setDeleting] = useState<CaseConferenceRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const confQ = useMemo(() => () => fetchCaseConferences(), [])
  const { data: rawRows, loading, error, refetch } = useSupabaseQuery<CaseConferenceRow[]>(confQ)

  const residentsQ = useMemo(() => () => fetchResidentOptions(), [])
  const { data: residentOptions } = useSupabaseQuery<ResidentOption[]>(residentsQ)

  const facilitators = useMemo(() => {
    const fromRows: string[] = []
    for (const r of rawRows ?? []) {
      const w = (r.facilitator ?? '').trim()
      if (w) fromRows.push(w)
    }
    return mergeSortedStrings(defaultFacilitatorCodes(), fromRows)
  }, [rawRows])

  const conferenceTypes = useMemo(() => {
    const fromRows: string[] = []
    for (const r of rawRows ?? []) {
      const t = (r.conference_type ?? '').trim()
      if (t) fromRows.push(t)
    }
    return mergeSortedStrings(CONFERENCE_TYPE_OPTIONS, fromRows)
  }, [rawRows])

  const filtered = useMemo(() => {
    const rows = rawRows ?? []
    const q = search.trim().toLowerCase()
    const fromT = fromDate ? parseISODateToUTC(fromDate) : null
    const toT = toDate ? parseISODateToUTC(toDate) : null
    const residentId =
      residentFilter === 'all' ? null : Number.isFinite(Number(residentFilter)) ? Number(residentFilter) : null

    const base = rows.filter((r) => {
      if (!matchesWhenFilter(r, whenFilter)) return false
      if (residentId != null && r.resident_id !== residentId) return false
      if (statusFilter !== 'all' && (r.status ?? '') !== statusFilter) return false

      if (fromT != null || toT != null) {
        const t = parseISODateToUTC(r.conference_date)
        if (t == null) return false
        if (fromT != null && t < fromT) return false
        if (toT != null && t > toT) return false
      }

      if (q) {
        const name = residentLabelFromRow(r).toLowerCase()
        const id = String(r.case_conference_id)
        const fac = (r.facilitator ?? '').toLowerCase()
        const ty = (r.conference_type ?? '').toLowerCase()
        const notes = (r.notes ?? '').toLowerCase()
        if (!name.includes(q) && !id.includes(q) && !fac.includes(q) && !ty.includes(q) && !notes.includes(q)) return false
      }

      return true
    })

    const ascending = whenFilter === 'upcoming'
    return [...base].sort((a, b) => {
      const da = parseISODateToUTC(a.conference_date) ?? 0
      const db = parseISODateToUTC(b.conference_date) ?? 0
      if (da !== db) return ascending ? da - db : db - da
      return a.case_conference_id - b.case_conference_id
    })
  }, [rawRows, search, residentFilter, whenFilter, statusFilter, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const openCreate = () => {
    setFormError(null)
    setDraft(emptyDraft())
    setCreating(true)
  }

  const openEdit = (row: CaseConferenceRow) => {
    setFormError(null)
    setEditing(row)
    setDraft({
      resident_id: row.resident_id ?? null,
      conference_date: row.conference_date?.slice(0, 10) ?? '',
      conference_type: row.conference_type ?? '',
      facilitator: row.facilitator ?? '',
      status: row.status ?? 'Scheduled',
      notes: row.notes ?? '',
    })
  }

  const saveDraft = async () => {
    if (!supabase) return
    if (draft.resident_id == null) {
      setFormError('Select a resident.')
      return
    }
    setBusy(true)
    setFormError(null)

    const payload = {
      resident_id: draft.resident_id,
      conference_date: draft.conference_date || null,
      conference_type: draft.conference_type?.trim() || null,
      facilitator: draft.facilitator?.trim() || null,
      status: draft.status?.trim() || 'Scheduled',
      notes: draft.notes?.trim() || null,
    }

    try {
      if (editing) {
        const { error: upErr } = await supabase.from('case_conferences').update(payload).eq('case_conference_id', editing.case_conference_id)
        if (upErr) throw upErr
        setEditing(null)
      } else {
        const { error: insErr } = await supabase.from('case_conferences').insert(payload)
        if (insErr) throw insErr
        setCreating(false)
      }
      refetch()
      invalidatePortalDashboard()
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
      const { error: delErr } = await supabase.from('case_conferences').delete().eq('case_conference_id', deleting.case_conference_id)
      if (delErr) throw delErr
      setDeleting(null)
      refetch()
      invalidatePortalDashboard()
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
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load case conferences.
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
          <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Case conferences</h2>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">
            Interdisciplinary meetings for care planning, reviews, and discharge preparation.
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
            New conference
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
            placeholder="Resident, facilitator, type, notes…"
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
              const name = residentCodesLabel(r.internal_code, r.case_control_no) || `Resident #${r.resident_id}`
              return (
                <option key={r.resident_id} value={String(r.resident_id)}>
                  {name}
                </option>
              )
            })}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">When</span>
          <select
            className={selectClass}
            value={whenFilter}
            onChange={(e) => {
              setWhenFilter(e.target.value as 'upcoming' | 'past' | 'all')
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Status</span>
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
            Loading conferences…
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Facilitator</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={r.case_conference_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatFriendlyDate(r.conference_date)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] font-medium whitespace-nowrap">{residentLabelFromRow(r)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.conference_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.facilitator ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.status ?? '—'}</td>
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
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">
                      No conferences found.
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
          title={`Conference #${detailRow.case_conference_id}`}
          subtitle={`${formatFriendlyDate(detailRow.conference_date)} • ${residentLabelFromRow(detailRow)} • ${detailRow.status ?? '—'}`}
          onClose={() => setDetailRow(null)}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Summary</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Type', detailRow.conference_type ?? '—'],
                  ['Facilitator', detailRow.facilitator ?? '—'],
                  ['Status', detailRow.status ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</dt>
                    <dd className="text-[var(--wt-text)] mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Notes</div>
              <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.notes?.trim() || '—'}</p>
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
          title={editing ? `Edit conference #${editing.case_conference_id}` : 'New case conference'}
          subtitle="Schedule or document an interdisciplinary case conference."
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Conference date
                <input
                  type="date"
                  value={draft.conference_date ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, conference_date: e.target.value }))}
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
                    const name = residentCodesLabel(r.internal_code, r.case_control_no) || `Resident #${r.resident_id}`
                    return (
                      <option key={r.resident_id} value={String(r.resident_id)}>
                        {name}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Conference type
                <select
                  value={draft.conference_type ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, conference_type: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {conferenceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Facilitator
                <select
                  value={draft.facilitator ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, facilitator: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {facilitators.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest md:col-span-2">
                Status
                <select
                  value={draft.status ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Notes
                <textarea
                  rows={4}
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
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
          title="Delete conference?"
          subtitle={`This will permanently delete conference #${deleting.case_conference_id}.`}
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
