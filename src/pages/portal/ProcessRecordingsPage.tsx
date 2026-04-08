import { useEffect, useMemo, useState } from 'react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type Resident = {
  resident_id: number
  internal_code: string | null
  case_control_no: string | null
  case_status: string | null
}

type ProcessRecording = {
  recording_id: number
  resident_id: number | null
  session_date: string | null
  social_worker: string | null
  session_type: string | null
  emotional_state_observed: string | null
  session_narrative: string | null
  interventions_applied: string | null
  follow_up_actions: string | null
}

type RecordingDraft = {
  resident_id: string
  session_date: string
  social_worker: string
  session_type: 'Individual' | 'Group'
  emotional_state_observed: string
  session_narrative: string
  interventions_applied: string
  follow_up_actions: string
}

const EMOTION_OPTIONS = ['Anxious', 'Distressed', 'Sad', 'Angry', 'Neutral', 'Hopeful', 'Happy'] as const

function residentLabel(r: Resident): string {
  const code = r.internal_code?.trim() || r.case_control_no?.trim() || `Resident #${r.resident_id}`
  const status = r.case_status?.trim() || 'Unknown'
  return `${code} (${status})`
}

function toDateOnly(s: string | null | undefined): string {
  return (s ?? '').slice(0, 10)
}

async function fetchResidents(): Promise<{ data: Resident[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select('resident_id, internal_code, case_control_no, case_status')
    .order('resident_id')
    .limit(2500)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as Resident[], error: null }
}

async function fetchRecordings(): Promise<{ data: ProcessRecording[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('process_recordings')
    .select(`
      recording_id,
      resident_id,
      session_date,
      social_worker,
      session_type,
      emotional_state_observed,
      session_narrative,
      interventions_applied,
      follow_up_actions
    `)
    .order('session_date', { ascending: false })
    .limit(6000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ProcessRecording[], error: null }
}

export function ProcessRecordingsPage() {
  const residentsQFn = useMemo(() => () => fetchResidents(), [])
  const recordingsQFn = useMemo(() => () => fetchRecordings(), [])
  const { data: residents, loading: residentsLoading, error: residentsError } = useSupabaseQuery(residentsQFn)
  const { data: recordings, loading: recordingsLoading, error: recordingsError, refetch } = useSupabaseQuery(recordingsQFn)

  const [residentFilter, setResidentFilter] = useState<string>('all')
  const [dateOrder, setDateOrder] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<RecordingDraft>({
    resident_id: '',
    session_date: '',
    social_worker: '',
    session_type: 'Individual',
    emotional_state_observed: '',
    session_narrative: '',
    interventions_applied: '',
    follow_up_actions: '',
  })

  const residentsById = useMemo(() => {
    const m = new Map<number, Resident>()
    for (const r of residents ?? []) m.set(r.resident_id, r)
    return m
  }, [residents])

  const socialWorkers = useMemo(() => {
    const fromRecordings = [...new Set((recordings ?? []).map(r => r.social_worker?.trim()).filter(Boolean) as string[])].sort()
    if (fromRecordings.length > 0) return fromRecordings
    return Array.from({ length: 20 }, (_, i) => `SW-${String(i + 1).padStart(2, '0')}`)
  }, [recordings])

  const filteredHistory = useMemo(() => {
    const rows = (recordings ?? []).filter(r => {
      if (residentFilter === 'all') return true
      return String(r.resident_id ?? '') === residentFilter
    })
    rows.sort((a, b) => {
      const ad = toDateOnly(a.session_date)
      const bd = toDateOnly(b.session_date)
      const cmp = ad.localeCompare(bd)
      return dateOrder === 'newest' ? -cmp : cmp
    })
    return rows
  }, [recordings, residentFilter, dateOrder])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize))
  const pagedHistory = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredHistory.slice(start, start + pageSize)
  }, [filteredHistory, page, pageSize])
  const rangeFrom = filteredHistory.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, filteredHistory.length)

  const selectedRecording = useMemo(
    () => filteredHistory.find(r => r.recording_id === selectedRecordingId) ?? null,
    [filteredHistory, selectedRecordingId],
  )
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetToFirstPage = () => setPage(1)

  const createRecording = async () => {
    if (!supabase) return
    const residentId = Number(draft.resident_id)
    if (!Number.isFinite(residentId) || residentId <= 0) {
      setFormError('Please select a resident.')
      return
    }
    if (!draft.session_date) {
      setFormError('Session date is required.')
      return
    }
    if (!draft.social_worker.trim()) {
      setFormError('Social worker is required.')
      return
    }
    if (!draft.session_narrative.trim()) {
      setFormError('Session narrative is required.')
      return
    }

    setSaving(true)
    setFormError(null)

    const maxId = (recordings ?? []).reduce((mx, r) => Math.max(mx, Number(r.recording_id || 0)), 0)
    const nextId = maxId + 1

    const { error } = await supabase.from('process_recordings').insert({
      recording_id: nextId,
      resident_id: residentId,
      session_date: draft.session_date,
      social_worker: draft.social_worker.trim(),
      session_type: draft.session_type,
      emotional_state_observed: draft.emotional_state_observed.trim() || null,
      session_narrative: draft.session_narrative.trim(),
      interventions_applied: draft.interventions_applied.trim() || null,
      follow_up_actions: draft.follow_up_actions.trim() || null,
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setDraft({
      resident_id: draft.resident_id,
      session_date: '',
      social_worker: draft.social_worker,
      session_type: 'Individual',
      emotional_state_observed: '',
      session_narrative: '',
      interventions_applied: '',
      follow_up_actions: '',
    })
    setSaving(false)
    refetch()
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

  const loading = residentsLoading || recordingsLoading
  const error = residentsError || recordingsError

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Process Recordings</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-1">
          Record dated counseling sessions and review the full chronological history for each resident.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
        <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">New Session Entry</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
            Resident
            <select
              value={draft.resident_id}
              onChange={e => setDraft(d => ({ ...d, resident_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            >
              <option value="">Select resident…</option>
              {(residents ?? []).map(r => (
                <option key={r.resident_id} value={String(r.resident_id)}>
                  {residentLabel(r)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
            Session date
            <input
              type="date"
              value={draft.session_date}
              onChange={e => setDraft(d => ({ ...d, session_date: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            />
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
            Social worker
            <select
              value={draft.social_worker}
              onChange={e => setDraft(d => ({ ...d, social_worker: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            >
              <option value="">Select social worker…</option>
              {socialWorkers.map(sw => (
                <option key={sw} value={sw}>
                  {sw}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
            Session type
            <select
              value={draft.session_type}
              onChange={e => setDraft(d => ({ ...d, session_type: e.target.value as 'Individual' | 'Group' }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            >
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
            </select>
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">
            Emotional state observed
            <select
              value={draft.emotional_state_observed}
              onChange={e => setDraft(d => ({ ...d, emotional_state_observed: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            >
              <option value="">—</option>
              {EMOTION_OPTIONS.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">
            Narrative summary
            <textarea
              rows={3}
              value={draft.session_narrative}
              onChange={e => setDraft(d => ({ ...d, session_narrative: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            />
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">
            Interventions applied
            <textarea
              rows={2}
              value={draft.interventions_applied}
              onChange={e => setDraft(d => ({ ...d, interventions_applied: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            />
          </label>

          <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">
            Follow-up actions
            <textarea
              rows={2}
              value={draft.follow_up_actions}
              onChange={e => setDraft(d => ({ ...d, follow_up_actions: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
            />
          </label>
        </div>

        {formError && <p className="mt-3 text-sm text-[#dc2626]">{formError}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void createRecording()}
            className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Recording'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Recording History</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex flex-col gap-1 min-w-[14rem]">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Resident</span>
              <select
                value={residentFilter}
                onChange={e => {
                  setResidentFilter(e.target.value)
                  resetToFirstPage()
                }}
                className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
              >
                <option value="all">All residents</option>
                {(residents ?? []).map(r => (
                  <option key={r.resident_id} value={String(r.resident_id)}>
                    {residentLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[10rem]">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Date order</span>
              <select
                value={dateOrder}
                onChange={e => {
                  setDateOrder(e.target.value as 'newest' | 'oldest')
                  resetToFirstPage()
                }}
                className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[8rem]">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows per page</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  resetToFirstPage()
                }}
                className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)]"
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-[var(--wt-text-2)] py-12 justify-center">
              <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
              Loading recordings…
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-[#dc2626]">{error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Resident</th>
                  <th className="px-4 py-3 font-medium">Social Worker</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Emotional State</th>
                  <th className="px-4 py-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {pagedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--wt-text-2)]">
                      No process recordings found for this selection.
                    </td>
                  </tr>
                ) : (
                  pagedHistory.map(r => (
                    <tr key={r.recording_id} className="border-b border-[var(--wt-border)] last:border-0">
                      <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{toDateOnly(r.session_date) || '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">
                        {r.resident_id != null ? residentLabel(residentsById.get(r.resident_id) ?? { resident_id: r.resident_id, internal_code: null, case_control_no: null, case_status: null }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.social_worker ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{r.session_type ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{r.emotional_state_observed ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordingId(r.recording_id)}
                          className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-1.5 text-xs text-[var(--wt-text)]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && !error && filteredHistory.length > 0 && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <p className="text-[var(--wt-text-2)]">
              Showing {rangeFrom}-{rangeTo} of {filteredHistory.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40"
              >
                First
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[var(--wt-text-2)] tabular-nums text-xs px-1">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedRecordingId(null)} role="presentation">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--wt-border)] flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--wt-text)]">
                  Process Recording #{selectedRecording.recording_id}
                </h3>
                <p className="text-sm text-[var(--wt-text-2)] mt-1">
                  {toDateOnly(selectedRecording.session_date) || '—'} · {selectedRecording.session_type ?? '—'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedRecordingId(null)} className="rounded-lg border border-[var(--wt-border)] px-3 py-2 text-sm text-[var(--wt-text)]">
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p><strong>Resident:</strong> {selectedRecording.resident_id != null ? residentLabel(residentsById.get(selectedRecording.resident_id) ?? { resident_id: selectedRecording.resident_id, internal_code: null, case_control_no: null, case_status: null }) : '—'}</p>
              <p><strong>Social worker:</strong> {selectedRecording.social_worker ?? '—'}</p>
              <p><strong>Emotional state observed:</strong> {selectedRecording.emotional_state_observed ?? '—'}</p>
              <div>
                <p className="font-semibold text-[var(--wt-text)]">Narrative summary</p>
                <p className="text-[var(--wt-text-2)] whitespace-pre-wrap mt-1">{selectedRecording.session_narrative ?? '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--wt-text)]">Interventions applied</p>
                <p className="text-[var(--wt-text-2)] whitespace-pre-wrap mt-1">{selectedRecording.interventions_applied ?? '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--wt-text)]">Follow-up actions</p>
                <p className="text-[var(--wt-text-2)] whitespace-pre-wrap mt-1">{selectedRecording.follow_up_actions ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

