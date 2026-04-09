import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type RecordingRow = {
  recording_id: number
  resident_id: number | null
  session_date: string | null
  social_worker: string | null
  session_type: string | null
  session_duration_minutes: number | null
  emotional_state_observed: string | null
  emotional_state_end: string | null
  session_narrative: string | null
  interventions_applied: string | null
  follow_up_actions: string | null
  progress_noted: boolean | null
  concerns_flagged: boolean | null
  referral_made: boolean | null
  notes_restricted: string | null
  residents?: {
    internal_code?: string | null
    case_control_no?: string | null
  } | { internal_code?: string | null; case_control_no?: string | null }[] | null
}

type ResidentOption = {
  resident_id: number
  internal_code: string | null
  case_control_no: string | null
}

function residentCodesLabel(internal_code?: string | null, case_control_no?: string | null): string {
  const code = (internal_code ?? '').trim()
  const cc = (case_control_no ?? '').trim()
  if (code && cc) return `${code} (${cc})`
  if (code) return code
  if (cc) return cc
  return ''
}

function embedResident(
  r: RecordingRow['residents'],
): { internal_code?: string | null; case_control_no?: string | null } | null {
  if (r == null) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}

function residentLabel(row: RecordingRow): string {
  const r = embedResident(row.residents)
  const parts = residentCodesLabel(r?.internal_code, r?.case_control_no)
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

async function fetchRecordings(): Promise<{ data: RecordingRow[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }

  const { data, error } = await supabase
    .from('process_recordings')
    .select(
      `
        recording_id,
        resident_id,
        session_date,
        social_worker,
        session_type,
        session_duration_minutes,
        emotional_state_observed,
        emotional_state_end,
        session_narrative,
        interventions_applied,
        follow_up_actions,
        progress_noted,
        concerns_flagged,
        referral_made,
        notes_restricted,
        residents ( internal_code, case_control_no )
      `,
    )
    .order('session_date', { ascending: false })
    .limit(1000)

  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as RecordingRow[], error: null }
}

async function fetchResidentOptions(): Promise<{ data: ResidentOption[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select('resident_id, internal_code, case_control_no')
    .order('resident_id', { ascending: true })
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ResidentOption[], error: null }
}

type RecordingDraft = Pick<
  RecordingRow,
  | 'resident_id'
  | 'session_date'
  | 'social_worker'
  | 'session_type'
  | 'session_duration_minutes'
  | 'emotional_state_observed'
  | 'emotional_state_end'
  | 'session_narrative'
  | 'interventions_applied'
  | 'follow_up_actions'
  | 'progress_noted'
  | 'concerns_flagged'
  | 'referral_made'
>

function emptyDraft(): RecordingDraft {
  return {
    resident_id: null,
    session_date: new Date().toISOString().slice(0, 10),
    social_worker: '',
    session_type: 'Individual',
    session_duration_minutes: null,
    emotional_state_observed: null,
    emotional_state_end: null,
    session_narrative: '',
    interventions_applied: '',
    follow_up_actions: '',
    progress_noted: false,
    concerns_flagged: false,
    referral_made: false,
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

export function ProcessRecordingsPage() {
  useAuth() // ensures auth context is initialized; role-gating handled by RequirePortalAccess

  const [search, setSearch] = useState('')
  const [residentFilter, setResidentFilter] = useState<string>('all')
  const [workerFilter, setWorkerFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)

  const [detailRow, setDetailRow] = useState<RecordingRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<RecordingRow | null>(null)
  const [draft, setDraft] = useState<RecordingDraft>(emptyDraft())
  const [deleting, setDeleting] = useState<RecordingRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const recordingsQ = useMemo(() => () => fetchRecordings(), [])
  const { data: rawRows, loading, error, refetch } = useSupabaseQuery<RecordingRow[]>(recordingsQ)

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
      if (typeFilter !== 'all' && (r.session_type ?? '') !== typeFilter) return false

      if (fromT != null || toT != null) {
        const t = parseISODateToUTC(r.session_date)
        if (t == null) return false
        if (fromT != null && t < fromT) return false
        if (toT != null && t > toT) return false
      }

      if (q) {
        const name = residentLabel(r).toLowerCase()
        const id = String(r.recording_id)
        const sw = (r.social_worker ?? '').toLowerCase()
        const narr = (r.session_narrative ?? '').toLowerCase()
        if (!name.includes(q) && !id.includes(q) && !sw.includes(q) && !narr.includes(q)) return false
      }
      return true
    })
  }, [rawRows, search, residentFilter, workerFilter, typeFilter, fromDate, toDate])

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

  const openEdit = (row: RecordingRow) => {
    setFormError(null)
    setEditing(row)
    setDraft({
      resident_id: row.resident_id ?? null,
      session_date: row.session_date?.slice(0, 10) ?? '',
      social_worker: row.social_worker ?? '',
      session_type: row.session_type ?? '',
      session_duration_minutes: row.session_duration_minutes ?? null,
      emotional_state_observed: row.emotional_state_observed ?? null,
      emotional_state_end: row.emotional_state_end ?? null,
      session_narrative: row.session_narrative ?? '',
      interventions_applied: row.interventions_applied ?? '',
      follow_up_actions: row.follow_up_actions ?? '',
      progress_noted: Boolean(row.progress_noted),
      concerns_flagged: Boolean(row.concerns_flagged),
      referral_made: Boolean(row.referral_made),
    })
  }

  const saveDraft = async () => {
    if (!supabase) return
    setBusy(true)
    setFormError(null)

    const payload = {
      resident_id: draft.resident_id,
      session_date: draft.session_date || null,
      social_worker: draft.social_worker?.trim() || null,
      session_type: draft.session_type?.trim() || null,
      session_duration_minutes: draft.session_duration_minutes,
      emotional_state_observed: draft.emotional_state_observed?.trim() || null,
      emotional_state_end: draft.emotional_state_end?.trim() || null,
      session_narrative: draft.session_narrative?.trim() || null,
      interventions_applied: draft.interventions_applied?.trim() || null,
      follow_up_actions: draft.follow_up_actions?.trim() || null,
      progress_noted: Boolean(draft.progress_noted),
      concerns_flagged: Boolean(draft.concerns_flagged),
      referral_made: Boolean(draft.referral_made),
    }

    try {
      if (editing) {
        const { error: upErr } = await supabase.from('process_recordings').update(payload).eq('recording_id', editing.recording_id)
        if (upErr) throw upErr
        setEditing(null)
      } else {
        const { error: insErr } = await supabase.from('process_recordings').insert(payload)
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
      const { error: delErr } = await supabase.from('process_recordings').delete().eq('recording_id', deleting.recording_id)
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
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load process recordings.
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
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Process Recordings</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">
            Dated counseling session notes, searchable and filterable by resident and social worker.
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
            New recording
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
            placeholder="Resident, worker, narrative, ID…"
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

        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Session type</span>
          <select
            className={selectClass}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All types</option>
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
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
            Loading recordings…
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Start</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">End</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Progress</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Concern</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={r.recording_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatFriendlyDate(r.session_date)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] font-medium whitespace-nowrap">{residentLabel(r)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.social_worker ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.session_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.emotional_state_observed ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.emotional_state_end ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.progress_noted ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.concerns_flagged ? 'Yes' : 'No'}</td>
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
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">
                      No recordings found.
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
          title={`Recording #${detailRow.recording_id}`}
          subtitle={`${formatFriendlyDate(detailRow.session_date)} • ${residentLabel(detailRow)} • ${detailRow.social_worker ?? '—'}`}
          onClose={() => setDetailRow(null)}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Session overview</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Type', detailRow.session_type ?? '—'],
                  ['Duration (min)', detailRow.session_duration_minutes != null ? String(detailRow.session_duration_minutes) : '—'],
                  ['Start emotion', detailRow.emotional_state_observed ?? '—'],
                  ['End emotion', detailRow.emotional_state_end ?? '—'],
                  ['Progress noted', detailRow.progress_noted ? 'Yes' : 'No'],
                  ['Concerns flagged', detailRow.concerns_flagged ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</dt>
                    <dd className="text-[var(--wt-text)] mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Narrative</div>
              <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.session_narrative?.trim() || '—'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
                <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Interventions</div>
                <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.interventions_applied?.trim() || '—'}</p>
              </div>
              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
                <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Follow-up actions</div>
                <p className="text-sm text-[var(--wt-text)] whitespace-pre-wrap">{detailRow.follow_up_actions?.trim() || '—'}</p>
              </div>
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
          title={editing ? `Edit recording #${editing.recording_id}` : 'New process recording'}
          subtitle="Create or update a counseling session note."
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Session date
                <input
                  type="date"
                  value={draft.session_date ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, session_date: e.target.value }))}
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
                Social worker
                <input
                  value={draft.social_worker ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, social_worker: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Session type
                <select
                  value={draft.session_type ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, session_type: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  <option value="Individual">Individual</option>
                  <option value="Group">Group</option>
                </select>
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Duration (minutes)
                <input
                  type="number"
                  min={0}
                  value={draft.session_duration_minutes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, session_duration_minutes: e.target.value === '' ? null : Number(e.target.value) }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Start emotion
                <input
                  value={draft.emotional_state_observed ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, emotional_state_observed: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                End emotion
                <input
                  value={draft.emotional_state_end ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, emotional_state_end: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-1 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.progress_noted)}
                  onChange={(e) => setDraft((d) => ({ ...d, progress_noted: e.target.checked }))}
                  className="rounded border-[var(--wt-border)]"
                />
                Progress noted
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-1 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.concerns_flagged)}
                  onChange={(e) => setDraft((d) => ({ ...d, concerns_flagged: e.target.checked }))}
                  className="rounded border-[var(--wt-border)]"
                />
                Concerns flagged
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] col-span-1 md:col-span-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.referral_made)}
                  onChange={(e) => setDraft((d) => ({ ...d, referral_made: e.target.checked }))}
                  className="rounded border-[var(--wt-border)]"
                />
                Referral made
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Narrative
                <textarea
                  rows={4}
                  value={draft.session_narrative ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, session_narrative: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Interventions applied
                <textarea
                  rows={3}
                  value={draft.interventions_applied ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, interventions_applied: e.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-1 md:col-span-2">
                Follow-up actions
                <textarea
                  rows={3}
                  value={draft.follow_up_actions ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, follow_up_actions: e.target.value }))}
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
          title="Delete process recording?"
          subtitle={`This will permanently delete recording #${deleting.recording_id}.`}
          onClose={() => setDeleting(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--wt-text-2)]">
              This action cannot be undone. Please confirm you want to delete this record.
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

