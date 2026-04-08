import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Resident = {
  resident_id: number
  first_name: string | null
  last_name: string | null
  case_category: string | null
  case_status: string | null
  safehouse_id: number | null
  admission_date: string | null
  assigned_social_worker: string | null
  reintegration_status: string | null
}

type ResidentMLScore = {
  resident_id: number
  reintegration_band: 'Ready' | 'Approaching' | 'Not Ready' | null
  reintegration_score: number | null
  school_struggle_band: 'High' | 'Medium' | 'Low' | null
  school_struggle_score: number | null
  wellbeing_band: 'High' | 'Medium' | 'Low' | null
  wellbeing_score: number | null
  incident_risk_band: 'High' | 'Medium' | 'Low' | null
  incident_risk_score: number | null
  model_version: string
  scored_at: string
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
async function fetchResidents(): Promise<{ data: Resident[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select(
      'resident_id, first_name, last_name, case_category, case_status, safehouse_id, admission_date, assigned_social_worker, reintegration_status',
    )
    .order('admission_date', { ascending: false })
    .limit(500)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as Resident[], error: null }
}

async function fetchMLScores(): Promise<{ data: ResidentMLScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('resident_ml_scores')
    .select('*')
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ResidentMLScore[], error: null }
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

type BandType = 'reintegration' | 'risk' | 'wellbeing'

function RiskChip({ band, type }: { band: string | null; type: BandType }) {
  if (!band) return <span className="text-[var(--wt-text-2)] text-xs">—</span>

  const readinessColors: Record<string, string> = {
    Ready: 'bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-accent)] border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]',
    Approaching: 'bg-[color-mix(in_srgb,var(--wt-text-2)_14%,transparent)] text-[var(--wt-text-2)] border-[color-mix(in_srgb,var(--wt-text-2)_25%,transparent)]',
    'Not Ready': 'bg-[color-mix(in_srgb,#dc2626_14%,transparent)] text-[#dc2626] border-[color-mix(in_srgb,#dc2626_30%,transparent)]',
  }
  const riskColors: Record<string, string> = {
    High: 'bg-[color-mix(in_srgb,#dc2626_14%,transparent)] text-[#dc2626] border-[color-mix(in_srgb,#dc2626_30%,transparent)]',
    Medium: 'bg-[color-mix(in_srgb,var(--wt-text-2)_14%,transparent)] text-[var(--wt-text-2)] border-[color-mix(in_srgb,var(--wt-text-2)_25%,transparent)]',
    Low: 'bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-accent)] border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]',
  }
  const wellbeingColors: Record<string, string> = {
    High: 'bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-accent)] border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]',
    Medium: 'bg-[color-mix(in_srgb,var(--wt-text-2)_14%,transparent)] text-[var(--wt-text-2)] border-[color-mix(in_srgb,var(--wt-text-2)_25%,transparent)]',
    Low: 'bg-[color-mix(in_srgb,#dc2626_14%,transparent)] text-[#dc2626] border-[color-mix(in_srgb,#dc2626_30%,transparent)]',
  }

  const colorMap = type === 'reintegration' ? readinessColors : type === 'wellbeing' ? wellbeingColors : riskColors
  const cls = colorMap[band] ?? 'bg-[var(--wt-border)] text-[var(--wt-text-2)] border-[var(--wt-border)]'

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {band}
    </span>
  )
}

function ResidentDetailModal({
  resident,
  score,
  onClose,
}: {
  resident: Resident
  score: ResidentMLScore | undefined
  onClose: () => void
}) {
  const name = [resident.first_name, resident.last_name].filter(Boolean).join(' ') || `Resident #${resident.resident_id}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto shadow-xl"
        role="dialog"
        aria-labelledby="resident-detail-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--wt-border)] flex items-start justify-between gap-4">
          <div>
            <h2 id="resident-detail-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
              {name}
            </h2>
            <p className="text-sm text-[var(--wt-text-2)] mt-1">
              {resident.case_category ?? 'Unknown category'} · {resident.case_status ?? 'Unknown status'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--wt-border)] px-3 py-2 text-sm text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)]"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Case details */}
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Case Details</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ['Admission date', resident.admission_date ?? '—'],
                ['Safehouse', resident.safehouse_id != null ? `#${resident.safehouse_id}` : '—'],
                ['Social worker', resident.assigned_social_worker ?? '—'],
                ['Reintegration', resident.reintegration_status ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</dt>
                  <dd className="text-[var(--wt-text)] mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ML Model Insights */}
          {score ? (
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Model Insights</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Reintegration readiness</div>
                  <RiskChip band={score.reintegration_band} type="reintegration" />
                  {score.reintegration_score != null && (
                    <span className="ml-2 text-xs text-[var(--wt-text-2)] tabular-nums">
                      {(score.reintegration_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">School struggle risk</div>
                  <RiskChip band={score.school_struggle_band} type="risk" />
                  {score.school_struggle_score != null && (
                    <span className="ml-2 text-xs text-[var(--wt-text-2)] tabular-nums">
                      {(score.school_struggle_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Wellbeing</div>
                  <RiskChip band={score.wellbeing_band} type="wellbeing" />
                  {score.wellbeing_score != null && (
                    <span className="ml-2 text-xs text-[var(--wt-text-2)] tabular-nums">
                      {(score.wellbeing_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Incident risk (next mo.)</div>
                  <RiskChip band={score.incident_risk_band} type="risk" />
                  {score.incident_risk_score != null && (
                    <span className="ml-2 text-xs text-[var(--wt-text-2)] tabular-nums">
                      {(score.incident_risk_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[10px] text-[var(--wt-text-2)]">
                Model v{score.model_version} · scored {score.scored_at.slice(0, 10)} · Decision support only
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Model Insights</div>
              <p className="text-sm text-[var(--wt-text-2)]">
                No model scores available for this resident yet. Run the case management pipelines and export to{' '}
                <code className="text-xs">resident_ml_scores</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export function CaseloadPage() {
  useAuth() // triggers auth context; role-gating handled by RequirePortalAccess

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const residentsQFn = useMemo(() => () => fetchResidents(), [])
  const { data: residents, loading, error } = useSupabaseQuery(residentsQFn)

  const mlQFn = useMemo(() => () => fetchMLScores(), [])
  const { data: mlScores } = useSupabaseQuery(mlQFn)

  const mlByResident = useMemo(() => {
    const m = new Map<number, ResidentMLScore>()
    for (const s of mlScores ?? []) m.set(s.resident_id, s)
    return m
  }, [mlScores])

  const statuses = useMemo(() => {
    const s = new Set<string>()
    for (const r of residents ?? []) if (r.case_status) s.add(r.case_status)
    return [...s].sort()
  }, [residents])

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const r of residents ?? []) if (r.case_category) s.add(r.case_category)
    return [...s].sort()
  }, [residents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (residents ?? []).filter(r => {
      if (statusFilter !== 'all' && r.case_status !== statusFilter) return false
      if (categoryFilter !== 'all' && r.case_category !== categoryFilter) return false
      if (q) {
        const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase()
        const id = String(r.resident_id)
        if (!name.includes(q) && !id.includes(q)) return false
      }
      return true
    })
  }, [residents, statusFilter, categoryFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const selectedResident = useMemo(() => residents?.find(r => r.resident_id === selectedId), [residents, selectedId])

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load caseload data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Caseload Inventory</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-1">
          Resident records with case management details and ML risk/readiness indicators.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-center rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3 text-sm">
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Search</span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Name or ID…"
            className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Case status</span>
          <select className={selectClass} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="all">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Case category</span>
          <select className={selectClass} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows per page</span>
          <select className={selectClass} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {!loading && !error && (
          <p className="text-[var(--wt-text-2)] lg:ml-auto tabular-nums text-xs">
            {filtered.length} resident{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading residents…
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Admitted</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Reintegration</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">School risk</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Wellbeing</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Incident risk</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map(r => {
                  const score = mlByResident.get(r.resident_id)
                  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || `#${r.resident_id}`
                  return (
                    <tr
                      key={r.resident_id}
                      className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                    >
                      <td className="px-4 py-3 text-[var(--wt-text)] font-medium whitespace-nowrap">{name}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{r.case_category ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.case_status ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{r.admission_date ?? '—'}</td>
                      <td className="px-4 py-3">
                        <RiskChip band={score?.reintegration_band ?? null} type="reintegration" />
                      </td>
                      <td className="px-4 py-3">
                        <RiskChip band={score?.school_struggle_band ?? null} type="risk" />
                      </td>
                      <td className="px-4 py-3">
                        <RiskChip band={score?.wellbeing_band ?? null} type="wellbeing" />
                      </td>
                      <td className="px-4 py-3">
                        <RiskChip band={score?.incident_risk_band ?? null} type="risk" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.resident_id)}
                          className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)] transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {pagedRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">
                      No residents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--wt-text)]">
          <p className="text-[var(--wt-text-2)] tabular-nums">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            {[
              { label: 'First', handler: () => setPage(1), disabled: page <= 1 },
              { label: 'Previous', handler: () => setPage(p => Math.max(1, p - 1)), disabled: page <= 1 },
              { label: 'Next', handler: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
              { label: 'Last', handler: () => setPage(totalPages), disabled: page >= totalPages },
            ].map(({ label, handler, disabled }) => (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={handler}
                className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedResident && (
        <ResidentDetailModal
          resident={selectedResident}
          score={mlByResident.get(selectedResident.resident_id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
