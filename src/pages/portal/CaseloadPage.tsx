import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

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
  resident_id: string
  case_control_no: string
  internal_code: string
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
    resident_id: r ? String(r.resident_id) : '',
    case_control_no: r?.case_control_no ?? '',
    internal_code: r?.internal_code ?? '',
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
  onClose,
}: {
  resident: Resident
  safehouseName: string
  onClose: () => void
}) {
  const tags = subCategoryTags(resident)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-3xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto shadow-xl"
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
  useAuth()
  const [statusFilter, setStatusFilter] = useState('all')
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

  const safehouseNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const s of safehouses ?? []) m.set(s.safehouse_id, s.name?.trim() || `Safehouse #${s.safehouse_id}`)
    return m
  }, [safehouses])

  const statuses = useMemo(() => [...new Set((residents ?? []).map(r => r.case_status).filter(Boolean))].sort(), [residents])
  const categories = useMemo(() => [...new Set((residents ?? []).map(r => r.case_category).filter(Boolean))].sort(), [residents])

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

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
    const residentId = Number(draft.resident_id)
    if (!Number.isFinite(residentId) || residentId <= 0) {
      setFormError('Resident ID is required and must be a positive number.')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = {
      resident_id: residentId,
      case_control_no: draft.case_control_no.trim() || null,
      internal_code: draft.internal_code.trim() || null,
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
      pwd_type: draft.pwd_type.trim() || null,
      has_special_needs: draft.has_special_needs,
      special_needs_diagnosis: draft.special_needs_diagnosis.trim() || null,
      family_is_4ps: draft.family_is_4ps,
      family_solo_parent: draft.family_solo_parent,
      family_indigenous: draft.family_indigenous,
      family_informal_settler: draft.family_informal_settler,
    }
    let dbError: string | null = null
    if (editingId == null) {
      const { error } = await supabase.from('residents').insert(payload)
      dbError = error?.message ?? null
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
              <option key={s.safehouse_id} value={String(s.safehouse_id)}>{s.name ?? `Safehouse #${s.safehouse_id}`}</option>
            ))}
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Sub-categories</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">PWD / Special needs</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Family profile</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Admission</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Social worker</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Reintegration</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map(r => {
                  const tags = subCategoryTags(r)
                  const fam = [
                    r.family_is_4ps ? '4Ps' : null,
                    r.family_solo_parent ? 'Solo parent' : null,
                    r.family_indigenous ? 'Indigenous' : null,
                    r.family_informal_settler ? 'Informal settler' : null,
                  ].filter(Boolean).join(', ')
                  return (
                    <tr key={r.resident_id} className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]">
                      <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                        <div className="font-medium">#{r.resident_id}</div>
                        <div className="text-xs text-[var(--wt-text-2)]">{r.internal_code ?? r.case_control_no ?? 'No code'}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{safehouseNameById.get(r.safehouse_id ?? -1) ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.case_status ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.case_category ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{tags.length ? tags.join(', ') : '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">
                        {r.is_pwd ? `PWD${r.pwd_type ? ` (${r.pwd_type})` : ''}` : 'No PWD'}
                        <br />
                        {r.has_special_needs ? `Special needs${r.special_needs_diagnosis ? ` (${r.special_needs_diagnosis})` : ''}` : 'No special needs'}
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{fam || '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{formatDate(r.date_of_admission)}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.assigned_social_worker ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)]">{r.reintegration_status ?? '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setSelectedId(r.resident_id)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[var(--wt-text)]">Details</button>
                          <button type="button" onClick={() => openEdit(r)} className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[var(--wt-accent)]">Edit</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {pagedRows.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-sm text-[var(--wt-text-2)]">No residents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
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
          onClose={() => setSelectedId(null)}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeForm} role="presentation">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--wt-border)]">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">{editingId == null ? 'Create Resident' : `Edit Resident #${editingId}`}</h2>
              <p className="text-sm text-[var(--wt-text-2)] mt-1">Update demographics, case categories, disability, family profile, and reintegration tracking.</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Resident ID
                <input value={draft.resident_id} disabled={editingId != null} onChange={e => setDraft(d => ({ ...d, resident_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Case control no
                <input value={draft.case_control_no} onChange={e => setDraft(d => ({ ...d, case_control_no: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Internal code
                <input value={draft.internal_code} onChange={e => setDraft(d => ({ ...d, internal_code: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Safehouse
                <select value={draft.safehouse_id} onChange={e => setDraft(d => ({ ...d, safehouse_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]">
                  <option value="">—</option>
                  {(safehouses ?? []).map(s => <option key={s.safehouse_id} value={String(s.safehouse_id)}>{s.name ?? `Safehouse #${s.safehouse_id}`}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Case status
                <input value={draft.case_status} onChange={e => setDraft(d => ({ ...d, case_status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Case category
                <input value={draft.case_category} onChange={e => setDraft(d => ({ ...d, case_category: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Sex
                <input value={draft.sex} onChange={e => setDraft(d => ({ ...d, sex: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Admission date
                <input type="date" value={draft.date_of_admission} onChange={e => setDraft(d => ({ ...d, date_of_admission: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Assigned social worker
                <input value={draft.assigned_social_worker} onChange={e => setDraft(d => ({ ...d, assigned_social_worker: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Referral source
                <input value={draft.referral_source} onChange={e => setDraft(d => ({ ...d, referral_source: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Referring person
                <input value={draft.referring_agency_person} onChange={e => setDraft(d => ({ ...d, referring_agency_person: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Reintegration type
                <input value={draft.reintegration_type} onChange={e => setDraft(d => ({ ...d, reintegration_type: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Reintegration status
                <input value={draft.reintegration_status} onChange={e => setDraft(d => ({ ...d, reintegration_status: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">Current risk level
                <input value={draft.current_risk_level} onChange={e => setDraft(d => ({ ...d, current_risk_level: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">PWD type
                <input value={draft.pwd_type} onChange={e => setDraft(d => ({ ...d, pwd_type: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest sm:col-span-2">Special needs diagnosis
                <input value={draft.special_needs_diagnosis} onChange={e => setDraft(d => ({ ...d, special_needs_diagnosis: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]" />
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
      )}
    </div>
  )
}
