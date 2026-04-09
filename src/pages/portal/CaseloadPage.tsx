import { ChevronDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { bandNeutralCls, bandPositiveCls, bandWarningCls } from '../../lib/mlBandStyles'
import { isStaffLike } from '../../lib/roles'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type ResidentMLScore = {
  resident_id: number
  reintegration_band: 'Ready' | 'Approaching' | 'Not Ready' | null
  school_struggle_band: 'High' | 'Medium' | 'Low' | null
  wellbeing_band: 'High' | 'Medium' | 'Low' | null
  incident_risk_band: 'High' | 'Medium' | 'Low' | null
  model_version: string
  scored_at: string
}

async function fetchMLScores(): Promise<{ data: ResidentMLScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase.from('resident_ml_scores').select('*')
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ResidentMLScore[], error: null }
}

type BandType = 'reintegration' | 'risk' | 'wellbeing'

function RiskChip({ band, type }: { band: string | null; type: BandType }) {
  if (!band) return <span className="text-[var(--wt-text-2)] text-xs">—</span>
  const readiness: Record<string, string> = {
    Ready: bandPositiveCls,
    Approaching: bandNeutralCls,
    'Not Ready': bandWarningCls,
  }
  const riskHigh: Record<string, string> = {
    High: bandWarningCls,
    Medium: bandNeutralCls,
    Low: bandPositiveCls,
  }
  const wellbeing: Record<string, string> = {
    High: bandPositiveCls,
    Medium: bandNeutralCls,
    Low: bandWarningCls,
  }
  const map = type === 'reintegration' ? readiness : type === 'wellbeing' ? wellbeing : riskHigh
  const cls = map[band] ?? bandNeutralCls
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {band}
    </span>
  )
}

function CaseloadMLMetricsGuide() {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] transition-colors"
      >
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--wt-text-2)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--wt-text)]">Understanding the insight columns</div>
          <div className="text-xs text-[var(--wt-text-2)] mt-0.5">
            Plain-language guide to the four model-supported columns and the color key (click to show or hide)
          </div>
        </div>
      </button>
      {open ? (
        <div className="border-t border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-4 space-y-5 text-sm text-[var(--wt-text)]">
          <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
            These badges are produced offline from your program data, then stored for the portal. They support supervision and
            case review—they are <strong className="text-[var(--wt-text)]">not diagnoses</strong> and should always be read
            together with your own judgment and current notes.
          </p>
          <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
            Badges appear for <strong className="text-[var(--wt-text)]">Active</strong> and{' '}
            <strong className="text-[var(--wt-text)]">On hold</strong> cases only.{' '}
            <strong className="text-[var(--wt-text)]">Closed</strong> and <strong className="text-[var(--wt-text)]">Transferred</strong>{' '}
            rows show a dash in those columns because the resident is no longer in active in-program care.
          </p>

          <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Color key (all four columns)</div>
            <ul className="text-xs text-[var(--wt-text-2)] space-y-1.5 list-disc pl-4">
              <li>
                <span className="text-[var(--wt-text)]">Green</span> — favorable for that topic (for example, low school
                concern or low incident concern; for wellbeing, a stronger wellbeing signal).
              </li>
              <li>
                <span className="text-[var(--wt-text)]">Gray</span> — in the middle; routine monitoring is usually enough
                unless other concerns appear in the file.
              </li>
              <li>
                <span className="text-[var(--wt-text)]">Red</span> — deserves attention in that area (follow-up, staffing
                discussion, or closer monitoring—not an automatic action by itself).
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1.5">Reintegration</div>
              <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
                <strong className="text-[var(--wt-text)]">Ready</strong>, <strong className="text-[var(--wt-text)]">Approaching</strong>, or{' '}
                <strong className="text-[var(--wt-text)]">Not ready</strong> summarizes how closely this resident&apos;s recorded case
                trajectory resembles patterns that historically aligned with successful reintegration planning. It draws on
                reintegration status and related case fields—not a legal determination of readiness. Use it to prompt
                conversation with the social worker and to prioritize supervision time.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1.5">School risk</div>
              <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
                <strong className="text-[var(--wt-text)]">High</strong>, <strong className="text-[var(--wt-text)]">Medium</strong>, or{' '}
                <strong className="text-[var(--wt-text)]">Low</strong> reflects how much the education records for this resident look
                like profiles that needed extra academic or attendance support (for example, weaker attendance or progress
                signals in the data). It is <strong className="text-[var(--wt-text)]">not a report card</strong>—only a triage hint
                for staff.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1.5">Wellbeing</div>
              <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
                <strong className="text-[var(--wt-text)]">High</strong>, <strong className="text-[var(--wt-text)]">Medium</strong>, or{' '}
                <strong className="text-[var(--wt-text)]">Low</strong> is a summary of predicted overall wellbeing based on health and
                wellbeing-related records. Here, <strong className="text-[var(--wt-text)]">High is the positive band</strong> (stronger
                predicted wellbeing). Bands are assigned relative to the full resident list when scores are last refreshed, so
                they describe position within the cohort, not an absolute clinical score on the screen.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1.5">Incident risk</div>
              <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
                <strong className="text-[var(--wt-text)]">High</strong>, <strong className="text-[var(--wt-text)]">Medium</strong>, or{' '}
                <strong className="text-[var(--wt-text)]">Low</strong> indicates how strongly past incident and safety-related history
                resembles patterns that were associated with more follow-on incidents in the training data.{' '}
                <strong className="text-[var(--wt-text)]">High</strong> means &quot;review with care&quot;;{' '}
                <strong className="text-[var(--wt-text)]">Low</strong> means fewer historical warning signals in the dataset—not a
                guarantee of safety.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-[var(--wt-text-2)] leading-relaxed border-t border-[var(--wt-border)] pt-3">
            Scores are versioned and dated in the resident detail view. When your team re-runs the analytics notebooks and
            exports to the database, every resident row updates together. If a badge is missing, scores may not have been loaded
            yet for that resident.
          </p>
        </div>
      ) : null}
    </div>
  )
}

type Resident = {
  resident_id: number
  case_control_no: string | null
  internal_code: string | null
  safehouse_id: number | null
  case_status: string | null
  sex: string | null
  date_of_birth: string | null
  case_category: string | null
  sub_cat_trafficked: boolean | null
  sub_cat_physical_abuse: boolean | null
  sub_cat_sexual_abuse: boolean | null
  sub_cat_child_labor: boolean | null
  sub_cat_orphaned: boolean | null
  sub_cat_at_risk: boolean | null
  is_pwd: boolean | null
  pwd_type: string | null
  has_special_needs: boolean | null
  special_needs_diagnosis: string | null
  family_is_4ps: boolean | null
  family_solo_parent: boolean | null
  family_indigenous: boolean | null
  family_informal_settler: boolean | null
  date_of_admission: string | null
  referral_source: string | null
  referring_agency_person: string | null
  assigned_social_worker: string | null
  reintegration_type: string | null
  reintegration_status: string | null
  current_risk_level: string | null
}

type Safehouse = {
  safehouse_id: number
  name: string | null
}

type ResidentDraft = {
  safehouse_id: string
  case_status: string
  sex: string
  case_category: string
  date_of_admission: string
  assigned_social_worker: string
  referral_source: string
  referring_agency_person: string
  reintegration_type: string
  reintegration_status: string
  current_risk_level: string
  sub_cat_trafficked: boolean
  sub_cat_physical_abuse: boolean
  sub_cat_sexual_abuse: boolean
  sub_cat_child_labor: boolean
  sub_cat_orphaned: boolean
  sub_cat_at_risk: boolean
  is_pwd: boolean
  pwd_type: string
  has_special_needs: boolean
  special_needs_diagnosis: string
  family_is_4ps: boolean
  family_solo_parent: boolean
  family_indigenous: boolean
  family_informal_settler: boolean
}

const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const CASE_STATUS_OPTIONS = ['Active', 'On Hold', 'Closed', 'Transferred'] as const

/** Table sort: Active caseload first, then other open statuses, then closed pipeline. */
const CASE_STATUS_SORT_RANK: Record<string, number> = {
  Active: 0,
  'On Hold': 1,
  Closed: 2,
  Transferred: 3,
}

function caseStatusSortRank(status: string | null | undefined): number {
  if (status != null && Object.prototype.hasOwnProperty.call(CASE_STATUS_SORT_RANK, status)) {
    return CASE_STATUS_SORT_RANK[status]
  }
  return 50
}

/** ML insight badges apply to in-program cases only (not closed or transferred-out). */
function showMlForStatus(status: string | null | undefined): boolean {
  return status === 'Active' || status === 'On Hold'
}
const CASE_CATEGORY_OPTIONS = ['Neglected', 'Surrendered', 'Trafficked', 'Physical Abuse', 'Sexual Abuse', 'At Risk'] as const
const SEX_OPTIONS = ['F', 'M'] as const
const REFERRAL_SOURCE_OPTIONS = ['NGO', 'Government Agency', 'Court Order', 'Self-Referral', 'Partner Referral', 'School', 'Community', 'Other'] as const
const REINTEGRATION_TYPE_OPTIONS = ['Family Reunification', 'Foster Care', 'Independent Living', 'None'] as const
const REINTEGRATION_STATUS_OPTIONS = ['In Progress', 'Completed', 'On Hold'] as const
const RISK_LEVEL_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const
const PWD_TYPE_OPTIONS = ['Physical', 'Intellectual', 'Hearing', 'Visual', 'Speech', 'Psychosocial', 'Other'] as const
const SPECIAL_NEEDS_OPTIONS = ['Speech Impairment', 'Learning Disability', 'Autism', 'ADHD', 'Developmental Delay', 'Behavioral Support', 'Other'] as const

function formatDate(d: string | null | undefined): string {
  const s = (d ?? '').slice(0, 10)
  if (!s) return '—'
  return s
}

function yesNo(v: boolean | null | undefined): string {
  return v ? 'Yes' : 'No'
}

function subCategoryTags(r: Resident): string[] {
  const tags: string[] = []
  if (r.sub_cat_trafficked) tags.push('Trafficked')
  if (r.sub_cat_physical_abuse) tags.push('Physical abuse')
  if (r.sub_cat_sexual_abuse) tags.push('Sexual abuse')
  if (r.sub_cat_child_labor) tags.push('Child labor')
  if (r.sub_cat_orphaned) tags.push('Orphaned')
  if (r.sub_cat_at_risk) tags.push('At risk')
  return tags
}

function toDraft(r?: Resident): ResidentDraft {
  return {
    safehouse_id: r?.safehouse_id != null ? String(r.safehouse_id) : '',
    case_status: r?.case_status ?? '',
    sex: r?.sex ?? '',
    case_category: r?.case_category ?? '',
    date_of_admission: (r?.date_of_admission ?? '').slice(0, 10),
    assigned_social_worker: r?.assigned_social_worker ?? '',
    referral_source: r?.referral_source ?? '',
    referring_agency_person: r?.referring_agency_person ?? '',
    reintegration_type: r?.reintegration_type ?? '',
    reintegration_status: r?.reintegration_status ?? '',
    current_risk_level: r?.current_risk_level ?? '',
    sub_cat_trafficked: Boolean(r?.sub_cat_trafficked),
    sub_cat_physical_abuse: Boolean(r?.sub_cat_physical_abuse),
    sub_cat_sexual_abuse: Boolean(r?.sub_cat_sexual_abuse),
    sub_cat_child_labor: Boolean(r?.sub_cat_child_labor),
    sub_cat_orphaned: Boolean(r?.sub_cat_orphaned),
    sub_cat_at_risk: Boolean(r?.sub_cat_at_risk),
    is_pwd: Boolean(r?.is_pwd),
    pwd_type: r?.pwd_type ?? '',
    has_special_needs: Boolean(r?.has_special_needs),
    special_needs_diagnosis: r?.special_needs_diagnosis ?? '',
    family_is_4ps: Boolean(r?.family_is_4ps),
    family_solo_parent: Boolean(r?.family_solo_parent),
    family_indigenous: Boolean(r?.family_indigenous),
    family_informal_settler: Boolean(r?.family_informal_settler),
  }
}

function randomCaseControlNo(): string {
  return `C${Math.floor(1000 + Math.random() * 9000)}`
}

async function invokeAdminResidentCreate(
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (!session) {
    return { ok: false, error: sessionError?.message ?? 'You must be signed in to create residents.' }
  }
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!baseUrl || !anonKey) return { ok: false, error: 'Supabase URL or anon key is not configured.' }
  try {
    const token = session.access_token
    const response = await fetch(`${baseUrl}/functions/v1/admin-site-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'X-Supabase-Access-Token': token,
      },
      body: JSON.stringify({ action: 'create_resident', payload }),
    })
    const text = await response.text()
    const data = text ? (JSON.parse(text) as { error?: string }) : {}
    if (!response.ok) return { ok: false, error: data.error ?? `Request failed (${response.status})` }
    if (data.error) return { ok: false, error: data.error }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function fetchResidents(): Promise<{ data: Resident[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select(`
      resident_id,
      case_control_no,
      internal_code,
      safehouse_id,
      case_status,
      sex,
      date_of_birth,
      case_category,
      sub_cat_trafficked,
      sub_cat_physical_abuse,
      sub_cat_sexual_abuse,
      sub_cat_child_labor,
      sub_cat_orphaned,
      sub_cat_at_risk,
      is_pwd,
      pwd_type,
      has_special_needs,
      special_needs_diagnosis,
      family_is_4ps,
      family_solo_parent,
      family_indigenous,
      family_informal_settler,
      date_of_admission,
      referral_source,
      referring_agency_person,
      assigned_social_worker,
      reintegration_type,
      reintegration_status,
      current_risk_level
    `)
    .order('date_of_admission', { ascending: false })
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as Resident[], error: null }
}

async function fetchSafehouses(): Promise<{ data: Safehouse[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase.from('safehouses').select('safehouse_id, name').order('safehouse_id')
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as Safehouse[], error: null }
}

function ResidentDetailModal({
  resident,
  safehouseName,
  mlScore,
  onClose,
}: {
  resident: Resident
  safehouseName: string
  mlScore?: ResidentMLScore
  onClose: () => void
}) {
  const tags = subCategoryTags(resident)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-3xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-xl"
        role="dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--wt-border)] flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">
              Resident #{resident.resident_id} · {resident.internal_code ?? resident.case_control_no ?? 'No code'}
            </h2>
            <p className="text-sm text-[var(--wt-text-2)] mt-1">
              {resident.case_category ?? 'Uncategorized'} · {resident.case_status ?? 'Unknown status'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--wt-border)] px-3 py-2 text-sm text-[var(--wt-text)]">
            Close
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Case profile</div>
            <p><strong>Case control #:</strong> {resident.case_control_no ?? '—'}</p>
            <p><strong>Internal code:</strong> {resident.internal_code ?? '—'}</p>
            <p><strong>Safehouse:</strong> {safehouseName}</p>
            <p><strong>Category:</strong> {resident.case_category ?? '—'}</p>
            <p><strong>Status:</strong> {resident.case_status ?? '—'}</p>
            <p><strong>Risk level:</strong> {resident.current_risk_level ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Admission & referral</div>
            <p><strong>Date of admission:</strong> {formatDate(resident.date_of_admission)}</p>
            <p><strong>Referral source:</strong> {resident.referral_source ?? '—'}</p>
            <p><strong>Referring person:</strong> {resident.referring_agency_person ?? '—'}</p>
            <p><strong>Assigned social worker:</strong> {resident.assigned_social_worker ?? '—'}</p>
            <p><strong>Reintegration type:</strong> {resident.reintegration_type ?? '—'}</p>
            <p><strong>Reintegration status:</strong> {resident.reintegration_status ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Sub-categories</div>
            {tags.length === 0 ? <p>—</p> : <p>{tags.join(', ')}</p>}
          </div>
          {mlScore && showMlForStatus(resident.case_status) ? (
            <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4 md:col-span-2">
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Model Insights</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Reintegration</div>
                  <RiskChip band={mlScore.reintegration_band} type="reintegration" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">School risk</div>
                  <RiskChip band={mlScore.school_struggle_band} type="risk" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Wellbeing</div>
                  <RiskChip band={mlScore.wellbeing_band} type="wellbeing" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Incident risk</div>
                  <RiskChip band={mlScore.incident_risk_band} type="risk" />
                </div>
              </div>
              <p className="mt-3 text-[10px] text-[var(--wt-text-2)]">Model v{mlScore.model_version} · {mlScore.scored_at.slice(0, 10)} · Decision support only</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-2">Disability & family profile</div>
            <p><strong>PWD:</strong> {yesNo(resident.is_pwd)} {resident.pwd_type ? `(${resident.pwd_type})` : ''}</p>
            <p><strong>Special needs:</strong> {yesNo(resident.has_special_needs)} {resident.special_needs_diagnosis ? `(${resident.special_needs_diagnosis})` : ''}</p>
            <p><strong>4Ps beneficiary:</strong> {yesNo(resident.family_is_4ps)}</p>
            <p><strong>Solo parent family:</strong> {yesNo(resident.family_solo_parent)}</p>
            <p><strong>Indigenous family:</strong> {yesNo(resident.family_indigenous)}</p>
            <p><strong>Informal settler family:</strong> {yesNo(resident.family_informal_settler)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CaseloadPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)
  const [statusFilter, setStatusFilter] = useState('Active')
  const [safehouseFilter, setSafehouseFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ResidentDraft>(toDraft())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const residentsQFn = useMemo(() => () => fetchResidents(), [])
  const { data: residents, loading, error, refetch } = useSupabaseQuery(residentsQFn)

  const safehouseQFn = useMemo(() => () => fetchSafehouses(), [])
  const { data: safehouses } = useSupabaseQuery(safehouseQFn)

  const mlQFn = useMemo(() => () => fetchMLScores(), [])
  const { data: mlScores } = useSupabaseQuery(mlQFn)
  const mlByResident = useMemo(() => {
    const m = new Map<number, ResidentMLScore>()
    for (const s of mlScores ?? []) m.set(s.resident_id, s)
    return m
  }, [mlScores])

  const safehouseNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const s of safehouses ?? []) m.set(s.safehouse_id, s.name?.trim() || `Safehouse #${s.safehouse_id}`)
    return m
  }, [safehouses])

  const statuses = useMemo(
    () =>
      [...new Set((residents ?? []).map(r => r.case_status).filter((s): s is string => Boolean(s)))].sort(),
    [residents],
  )
  const categories = useMemo(
    () =>
      [...new Set((residents ?? []).map(r => r.case_category).filter((c): c is string => Boolean(c)))].sort(),
    [residents],
  )
  const socialWorkers = useMemo(() => {
    const fromData = [...new Set((residents ?? []).map(r => r.assigned_social_worker?.trim()).filter(Boolean) as string[])].sort()
    return fromData.length > 0 ? fromData : Array.from({ length: 20 }, (_, i) => `SW-${String(i + 1).padStart(2, '0')}`)
  }, [residents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (residents ?? []).filter(r => {
      if (statusFilter !== 'all' && r.case_status !== statusFilter) return false
      if (safehouseFilter !== 'all' && String(r.safehouse_id ?? '') !== safehouseFilter) return false
      if (categoryFilter !== 'all' && r.case_category !== categoryFilter) return false
      if (!q) return true
      const fields = [
        String(r.resident_id),
        r.case_control_no ?? '',
        r.internal_code ?? '',
        r.assigned_social_worker ?? '',
        r.referral_source ?? '',
        r.referring_agency_person ?? '',
        r.case_category ?? '',
        r.case_status ?? '',
        safehouseNameById.get(r.safehouse_id ?? -1) ?? '',
      ].join(' ').toLowerCase()
      return fields.includes(q)
    })
  }, [residents, statusFilter, safehouseFilter, categoryFilter, search, safehouseNameById])

  const filteredSorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const ra = caseStatusSortRank(a.case_status)
      const rb = caseStatusSortRank(b.case_status)
      if (ra !== rb) return ra - rb
      return a.resident_id - b.resident_id
    })
    return arr
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSorted.slice(start, start + pageSize)
  }, [filteredSorted, page, pageSize])

  const selectedResident = useMemo(() => (residents ?? []).find(r => r.resident_id === selectedId), [residents, selectedId])

  const openCreate = () => {
    setFormError(null)
    setEditingId(null)
    setDraft(toDraft())
    setFormOpen(true)
  }

  const openEdit = (r: Resident) => {
    setFormError(null)
    setEditingId(r.resident_id)
    setDraft(toDraft(r))
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setDraft(toDraft())
    setFormError(null)
  }

  const saveResident = async () => {
    if (!supabase) return
    setSaving(true)
    setFormError(null)

    const generateUniqueCaseControlNo = async (): Promise<string | null> => {
      for (let i = 0; i < 40; i += 1) {
        const candidate = randomCaseControlNo()
        const { count, error: checkError } = await supabase
          .from('residents')
          .select('resident_id', { count: 'exact', head: true })
          .eq('case_control_no', candidate)
        if (checkError) {
          setFormError(checkError.message)
          return null
        }
        if ((count ?? 0) === 0) return candidate
      }
      setFormError('Unable to generate a unique case control number. Please try again.')
      return null
    }

    const payload = {
      safehouse_id: draft.safehouse_id ? Number(draft.safehouse_id) : null,
      case_status: draft.case_status.trim() || null,
      sex: draft.sex.trim() || null,
      case_category: draft.case_category.trim() || null,
      date_of_admission: draft.date_of_admission || null,
      assigned_social_worker: draft.assigned_social_worker.trim() || null,
      referral_source: draft.referral_source.trim() || null,
      referring_agency_person: draft.referring_agency_person.trim() || null,
      reintegration_type: draft.reintegration_type.trim() || null,
      reintegration_status: draft.reintegration_status.trim() || null,
      current_risk_level: draft.current_risk_level.trim() || null,
      sub_cat_trafficked: draft.sub_cat_trafficked,
      sub_cat_physical_abuse: draft.sub_cat_physical_abuse,
      sub_cat_sexual_abuse: draft.sub_cat_sexual_abuse,
      sub_cat_child_labor: draft.sub_cat_child_labor,
      sub_cat_orphaned: draft.sub_cat_orphaned,
      sub_cat_at_risk: draft.sub_cat_at_risk,
      is_pwd: draft.is_pwd,
      pwd_type: draft.is_pwd ? (draft.pwd_type.trim() || null) : null,
      has_special_needs: draft.has_special_needs,
      special_needs_diagnosis: draft.has_special_needs ? (draft.special_needs_diagnosis.trim() || null) : null,
      family_is_4ps: draft.family_is_4ps,
      family_solo_parent: draft.family_solo_parent,
      family_indigenous: draft.family_indigenous,
      family_informal_settler: draft.family_informal_settler,
    }
    let dbError: string | null = null
    if (editingId == null) {
      const caseControlNo = await generateUniqueCaseControlNo()
      if (!caseControlNo) {
        setSaving(false)
        return
      }
      const createRes = await invokeAdminResidentCreate({
        ...payload,
        case_control_no: caseControlNo,
      })
      if (createRes.ok) {
        dbError = null
      } else {
        // Fallback for environments where the edge function is not deployed/allowed.
        const { data: inserted, error } = await supabase
          .from('residents')
          .insert({
            ...payload,
            case_control_no: caseControlNo,
            initial_risk_level: payload.current_risk_level,
          })
          .select('resident_id')
          .single()
        if (!error && inserted?.resident_id != null) {
          const code = `LS-${String(inserted.resident_id).padStart(4, '0')}`
          const { error: codeError } = await supabase
            .from('residents')
            .update({ internal_code: code })
            .eq('resident_id', inserted.resident_id)
          dbError = codeError?.message ?? null
        } else {
          dbError = createRes.error || error?.message || null
        }
      }
    } else {
      const { error } = await supabase.from('residents').update(payload).eq('resident_id', editingId)
      dbError = error?.message ?? null
    }
    if (dbError) setFormError(dbError)
    else {
      closeForm()
      refetch()
    }
    setSaving(false)
  }

  const removeResident = async (residentId: number) => {
    if (!supabase) return
    const ok = window.confirm(`Remove resident #${residentId}? This cannot be undone.`)
    if (!ok) return
    setFormError(null)
    const { error: delErr } = await supabase.from('residents').delete().eq('resident_id', residentId)
    if (delErr) setFormError(delErr.message)
    else refetch()
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load caseload data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Caseload Inventory</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">
            Resident records aligned to social welfare structure with case profile, family context, and reintegration tracking.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white">
          + New Resident
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-center rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3 text-sm">
        <label className="flex flex-col gap-1 min-w-[14rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Search key fields</span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="ID, case code, social worker, referral..."
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
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Safehouse</span>
          <select className={selectClass} value={safehouseFilter} onChange={e => { setSafehouseFilter(e.target.value); setPage(1) }}>
            <option value="all">All safehouses</option>
            {(safehouses ?? []).map(s => (
              <option key={s.safehouse_id} value={String(s.safehouse_id)}>{s.name ?? `Safehouse #${s.safehouse_id}`}</option>)
            )}
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
      </div>

      {staff ? <CaseloadMLMetricsGuide /> : null}

      {formError && (
        <p className="text-sm text-[#dc2626]">{formError}</p>
      )}

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading residents…
          </div>
        ) : error ? (
          <div className="p-6"><p className="text-sm text-[#dc2626]">{error}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Resident</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Safehouse</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Social worker</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap">Reintegration</th>}
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap">School risk</th>}
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap">Wellbeing</th>}
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap">Incident risk</th>}
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map(r => {
                  const ml = mlByResident.get(r.resident_id)
                  const showMl = showMlForStatus(r.case_status)
                  const mlCell = (band: string | null | undefined, type: BandType) =>
                    showMl ? <RiskChip band={band ?? null} type={type} /> : <span className="text-[var(--wt-text-2)] text-xs">—</span>
                  return (
                    <tr key={r.resident_id} className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]">
                      <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                        <div className="font-medium">#{r.resident_id}</div>
                        <div className="text-xs text-[var(--wt-text-2)]">{r.internal_code ?? r.case_control_no ?? 'No code'}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{safehouseNameById.get(r.safehouse_id ?? -1) ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.assigned_social_worker ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.case_status ?? '—'}</td>
                      {staff && <td className="px-4 py-3">{mlCell(ml?.reintegration_band, 'reintegration')}</td>}
                      {staff && <td className="px-4 py-3">{mlCell(ml?.school_struggle_band, 'risk')}</td>}
                      {staff && <td className="px-4 py-3">{mlCell(ml?.wellbeing_band, 'wellbeing')}</td>}
                      {staff && <td className="px-4 py-3">{mlCell(ml?.incident_risk_band, 'risk')}</td>}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setSelectedId(r.resident_id)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[var(--wt-text)]">Details</button>
                          <button type="button" onClick={() => openEdit(r)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[var(--wt-accent)]">Edit</button>
                          <button type="button" onClick={() => void removeResident(r.resident_id)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[#dc2626]">Remove</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {pagedRows.length === 0 && (
                  <tr><td colSpan={staff ? 9 : 5} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">No residents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && filteredSorted.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--wt-text)]">
          <p className="text-[var(--wt-text-2)] tabular-nums">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(1)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40">First</button>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs disabled:opacity-40">Last</button>
          </div>
        </div>
      )}

      {selectedResident && (
        <ResidentDetailModal
          resident={selectedResident}
          safehouseName={safehouseNameById.get(selectedResident.safehouse_id ?? -1) ?? '—'}
          mlScore={staff ? mlByResident.get(selectedResident.resident_id) : undefined}
          onClose={() => setSelectedId(null)}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeForm} role="presentation">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6 border-b border-[var(--wt-border)] flex items-start justify-between gap-4">
              <div>
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">{editingId == null ? 'Create Resident' : `Edit Resident #${editingId}`}</h2>
              <p className="text-sm text-[var(--wt-text-2)] mt-1">Update demographics, case categories, disability, family profile, and reintegration tracking.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-[var(--wt-border)] p-2 text-[var(--wt-text-2)] hover:text-[var(--wt-text)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Safehouse
                <select value={draft.safehouse_id} onChange={e => setDraft(d => ({ ...d, safehouse_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {(safehouses ?? []).map(s => <option key={s.safehouse_id} value={String(s.safehouse_id)}>{s.name ?? `Safehouse #${s.safehouse_id}`}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Case status
                <select value={draft.case_status} onChange={e => setDraft(d => ({ ...d, case_status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {CASE_STATUS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Case category
                <select value={draft.case_category} onChange={e => setDraft(d => ({ ...d, case_category: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {CASE_CATEGORY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Sex
                <select value={draft.sex} onChange={e => setDraft(d => ({ ...d, sex: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {SEX_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Admission date
                <input type="date" value={draft.date_of_admission} onChange={e => setDraft(d => ({ ...d, date_of_admission: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Assigned social worker
                <select value={draft.assigned_social_worker} onChange={e => setDraft(d => ({ ...d, assigned_social_worker: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {socialWorkers.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Referral source
                <select value={draft.referral_source} onChange={e => setDraft(d => ({ ...d, referral_source: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {REFERRAL_SOURCE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Referring person
                <input value={draft.referring_agency_person} onChange={e => setDraft(d => ({ ...d, referring_agency_person: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Reintegration type
                <select value={draft.reintegration_type} onChange={e => setDraft(d => ({ ...d, reintegration_type: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {REINTEGRATION_TYPE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Reintegration status
                <select value={draft.reintegration_status} onChange={e => setDraft(d => ({ ...d, reintegration_status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {REINTEGRATION_STATUS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Current risk level
                <select value={draft.current_risk_level} onChange={e => setDraft(d => ({ ...d, current_risk_level: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {RISK_LEVEL_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              {([
                ['sub_cat_trafficked', 'Trafficked'],
                ['sub_cat_physical_abuse', 'Physical abuse'],
                ['sub_cat_sexual_abuse', 'Sexual abuse'],
                ['sub_cat_child_labor', 'Child labor'],
                ['sub_cat_orphaned', 'Orphaned'],
                ['sub_cat_at_risk', 'At risk'],
                ['is_pwd', 'PWD'],
                ['has_special_needs', 'Has special needs'],
                ['family_is_4ps', 'Family is 4Ps'],
                ['family_solo_parent', 'Family solo parent'],
                ['family_indigenous', 'Family indigenous'],
                ['family_informal_settler', 'Family informal settler'],
              ] as [keyof ResidentDraft, string][]).map(([key, label]) => (
                <label key={String(key)} className="flex items-center gap-2 text-sm text-[var(--wt-text)]">
                  <input type="checkbox" checked={Boolean(draft[key])} onChange={e => setDraft(d => ({ ...d, [key]: e.target.checked }))} className="rounded border-[var(--wt-border)]" />
                  {label}
                </label>
              ))}
              {draft.is_pwd && (
                <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">PWD type
                  <select value={draft.pwd_type} onChange={e => setDraft(d => ({ ...d, pwd_type: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                    <option value="">—</option>
                    {PWD_TYPE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              )}
              {draft.has_special_needs && (
                <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">Special needs diagnosis
                  <select value={draft.special_needs_diagnosis} onChange={e => setDraft(d => ({ ...d, special_needs_diagnosis: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                    <option value="">—</option>
                    {SPECIAL_NEEDS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              )}
            </div>
            {formError && <p className="px-6 pb-2 text-sm text-[#dc2626]">{formError}</p>}
            <div className="p-6 pt-2 flex justify-end gap-2 border-t border-[var(--wt-border)]">
              <button type="button" onClick={closeForm} className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)]">Cancel</button>
              <button type="button" disabled={saving} onClick={() => void saveResident()} className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save resident'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
