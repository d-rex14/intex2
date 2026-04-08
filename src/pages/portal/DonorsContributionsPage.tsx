import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { campaignOptionsForSelect } from '../../lib/fundraisingCampaigns'
import { BASE_CURRENCY, convertCurrency, FX_TO_PHP, SUPPORTED_CURRENCIES, toPHP } from '../../lib/fxRates'
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

type DonationAllocationRow = {
  allocation_id?: number
  donation_id: number | null
  program_area: string | null
  amount_allocated: number | null
  allocation_date?: string | null
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

function formatMoney(currencyCode: string, n: number): string {
  const cur = (currencyCode || BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatAmount(row: DonationWithSupporter, displayCurrency: string): string {
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
  const fromCur = row.currency_code?.trim() || BASE_CURRENCY
  const fx = convertCurrency(n, fromCur, displayCurrency)
  if (fx.converted == null) return `${fromCur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return formatMoney(displayCurrency, fx.converted)
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

async function fetchAllocations(): Promise<{
  data: DonationAllocationRow[] | null
  error: { message: string } | null
}> {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured.' } }
  }

  const { data, error } = await supabase
    .from('donation_allocations')
    .select('donation_id, program_area, amount_allocated, allocation_date')
    .limit(5000)

  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as DonationAllocationRow[], error: null }
}

const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-1 sm:gap-3 py-2 border-b border-[var(--wt-border)]/60 last:border-0">
      <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] shrink-0">{label}</dt>
      <dd className="text-sm text-[var(--wt-text)] break-words min-w-0">{children}</dd>
    </div>
  )
}

const CHART_COLORS = ['#475569', '#c59a54', '#6b7280', '#c2b89c', '#f59e0b', '#94a3b8'] as const
const TYPE_COLORS: Record<string, string> = {
  Monetary: '#f59e0b',
  InKind: '#94a3b8',
  Time: '#60a5fa',
  Skills: '#34d399',
  SocialMedia: '#a78bfa',
} as const

function cutoffForRange(range: 'all' | '1y' | '6m' | '1m' | '2w' | '1w'): number | null {
  if (range === 'all') return null
  const now = Date.now()
  const msDay = 24 * 60 * 60 * 1000
  if (range === '1y') return now - 365 * msDay
  if (range === '6m') return now - 183 * msDay
  if (range === '1m') return now - 30 * msDay
  if (range === '2w') return now - 14 * msDay
  return now - 7 * msDay
}

function parseISODateToUTC(dateStr: string | null | undefined): number | null {
  const d = (dateStr ?? '').toString().slice(0, 10)
  if (!d) return null
  const t = Date.parse(`${d}T00:00:00Z`)
  return Number.isFinite(t) ? t : null
}

function formatShortDateUTC(t: number): string {
  const d = new Date(t)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function LineChart({
  title,
  dates,
  values,
  currency,
}: {
  title: string
  dates: number[]
  values: number[]
  currency: string
}) {
  const width = 520
  const height = 200
  const padL = 44
  const padR = 10
  const padT = 18
  const padB = 30

  if (dates.length === 0 || values.length === 0) {
    return <p className="text-sm text-[var(--wt-text-2)] py-6 text-center">No donation data yet.</p>
  }

  const minX = dates[0]
  const maxX = dates[dates.length - 1]
  const maxY = Math.max(1, ...values)

  const x = (t: number) =>
    padL + ((t - minX) / Math.max(1, maxX - minX)) * (width - padL - padR)
  const y = (v: number) => padT + (1 - v / maxY) * (height - padT - padB)

  const points = dates.map((t, i) => ({
    t,
    v: values[i],
    x: x(t),
    y: y(values[i]),
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const tickVals = [0, 0.33, 0.66, 1].map(f => f * maxY)

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  return (
    <div className="relative w-full">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        className="block"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={e => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * width
          const ratio = (px - padL) / Math.max(1, width - padL - padR)
          const tApprox = minX + ratio * (maxX - minX)
          let bestIdx = 0
          let bestDist = Infinity
          points.forEach((p, i) => {
            const d = Math.abs(p.t - tApprox)
            if (d < bestDist) {
              bestDist = d
              bestIdx = i
            }
          })
          setHoverIdx(bestIdx)
        }}
      >
        {/* y grid */}
        {tickVals.map((tv, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={width - padR}
              y1={y(tv)}
              y2={y(tv)}
              stroke="color-mix(in_srgb,var(--wt-border)_55%,transparent)"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={y(tv) + 4}
              textAnchor="end"
              className="fill-[var(--wt-text-2)]"
              style={{ fontSize: 10 }}
            >
              {formatMoney(currency, tv).replace(`${currency} `, '')}
            </text>
          </g>
        ))}

        {/* line */}
        <path
          d={pathD}
          fill="none"
          stroke="color-mix(in_srgb,var(--wt-accent)_80%,white)"
          strokeWidth="2.25"
        />

        {/* x labels (start / end) */}
        <text
          x={padL}
          y={height - 10}
          textAnchor="start"
          className="fill-[var(--wt-text-2)]"
          style={{ fontSize: 10 }}
        >
          {formatShortDateUTC(minX)}
        </text>
        <text
          x={width - padR}
          y={height - 10}
          textAnchor="end"
          className="fill-[var(--wt-text-2)]"
          style={{ fontSize: 10 }}
        >
          {formatShortDateUTC(maxX)}
        </text>

        {/* hover marker */}
        {hoverIdx != null && points[hoverIdx] && (
          <>
            <line
              x1={points[hoverIdx].x}
              x2={points[hoverIdx].x}
              y1={padT}
              y2={height - padB}
              stroke="color-mix(in_srgb,var(--wt-accent)_60%,transparent)"
              strokeWidth="1"
            />
            <circle
              cx={points[hoverIdx].x}
              cy={points[hoverIdx].y}
              r={3}
              fill="var(--wt-accent)"
            />
          </>
        )}
      </svg>

      {hoverIdx != null && points[hoverIdx] && (
        <div className="mt-2 text-xs text-[var(--wt-text-2)]">
          <span className="text-[var(--wt-text)] font-semibold">
            {formatShortDateUTC(points[hoverIdx].t)}
          </span>
          <span className="ml-3">
            {formatMoney(currency, points[hoverIdx].v)} total
          </span>
        </div>
      )}
    </div>
  )
}

function DonutChart({
  title,
  data,
  valueCurrency,
  centerLabel,
  size = 280,
}: {
  title: string
  data: { label: string; value: number; color: string }[]
  valueCurrency: string
  centerLabel: string
  size?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const stroke = Math.max(18, Math.round(size * 0.08))
  const radius = (size - stroke) / 2
  const c = 2 * Math.PI * radius

  const segments = useMemo(() => {
    if (total <= 0) return []
    let offset = 0
    return data
      .filter(d => d.value > 0)
      .map(d => {
        const frac = d.value / total
        const len = frac * c
        const seg = { ...d, frac, len, offset }
        offset += len
        return seg
      })
  }, [data, total, c])

  const [hover, setHover] = useState<{
    label: string
    value: number
    frac: number
    x: number
    y: number
  } | null>(null)
  const hoveredLabel = hover?.label ?? null

  return (
    <div className="relative">
      <div className="flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={title}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="color-mix(in_srgb,var(--wt-border)_60%,transparent)"
            strokeWidth={stroke}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map(seg => (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${seg.len} ${c - seg.len}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                style={{
                  filter: hoveredLabel === seg.label ? `drop-shadow(0 0 8px ${seg.color})` : undefined,
                  transition: 'filter 120ms ease-out',
                }}
                onMouseMove={e => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                  setHover({
                    label: seg.label,
                    value: seg.value,
                    frac: seg.frac,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  })
                }}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            className="fill-[var(--wt-text)]"
            style={{ fontSize: 16, fontWeight: 750 }}
          >
            {centerLabel || '—'}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            className="fill-[var(--wt-text-2)]"
            style={{ fontSize: 10, letterSpacing: '0.18em' }}
          >
            ALLOCATED
          </text>
        </svg>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-xs text-[var(--wt-text)] shadow-xl"
          style={{
            left: Math.min(hover.x + 12, size - 8),
            top: Math.max(hover.y - 12, 8),
            transform: 'translate(-10%, -100%)',
            maxWidth: 220,
          }}
        >
          <div className="font-semibold">{hover.label}</div>
          <div className="text-[var(--wt-text-2)] mt-0.5">
            {formatMoney(valueCurrency, hover.value)} • {(hover.frac * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}

export function DonorsContributionsPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)

  const [donationTypeFilter, setDonationTypeFilter] = useState<'all' | DonationType>('all')
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY)
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [topDonorsType, setTopDonorsType] = useState<'all' | DonationType>('Monetary')
  const [allocationTime, setAllocationTime] = useState<
    'all' | '1y' | '6m' | '1m' | '2w' | '1w'
  >('all')

  const [donorDetailKey, setDonorDetailKey] = useState<string | null>(null)
  const [detailRow, setDetailRow] = useState<DonationWithSupporter | null>(null)
  const [editing, setEditing] = useState<DonationWithSupporter | null>(null)
  const [deleting, setDeleting] = useState<DonationWithSupporter | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const queryFn = useMemo(() => () => fetchDonations(), [])

  const { data: rawRows, loading, error, refetch } = useSupabaseQuery(queryFn)

  const allocationsQueryFn = useMemo(() => () => fetchAllocations(), [])
  const {
    data: allocationRows,
    loading: allocationsLoading,
    error: allocationsError,
  } = useSupabaseQuery(allocationsQueryFn)

  const resourcesFunded = useMemo(() => {
    const rows = allocationRows ?? []
    const cutoff = cutoffForRange(allocationTime)

    const m = new Map<string, number>()
    for (const r of rows) {
      if (cutoff != null) {
        const t = parseISODateToUTC(r.allocation_date)
        if (t == null || t < cutoff) continue
      }
      const label = (r.program_area ?? '').trim() || 'Uncategorized'
      const amt = Number(r.amount_allocated ?? 0)
      if (!Number.isFinite(amt) || amt <= 0) continue
      m.set(label, (m.get(label) ?? 0) + amt)
    }
    const entries = [...m.entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([label, value], i) => ({
      label,
      // allocations assumed stored in PHP; display in selected currency
      value:
        convertCurrency(value, BASE_CURRENCY, currency).converted ??
        value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [allocationRows, allocationTime, currency])

  const allocatedTotal = useMemo(() => {
    return resourcesFunded.reduce((sum, d) => sum + d.value, 0)
  }, [resourcesFunded])

  const topDonors = useMemo(() => {
    const rows = rawRows ?? []
    const totals = new Map<
      string,
      {
        key: string
        donor: string
        email: string
        supporter_id: number | null
        total: number
        breakdown: Map<string, number>
        hasMissingFX: boolean
      }
    >()

    for (const r of rows) {
      if (topDonorsType !== 'all' && r.donation_type !== topDonorsType) continue
      const val = r.amount ?? r.estimated_value
      if (val == null) continue
      const key = r.supporter_id != null ? `supporter:${r.supporter_id}` : `email:${donorEmail(r)}`
      const donor = donorLabel(r)
      const email = donorEmail(r)
      const supporter_id = r.supporter_id ?? null
      const cur = (r.currency_code ?? BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY
      const fx = convertCurrency(Number(val), cur, currency)

      const prev =
        totals.get(key) ?? {
          key,
          donor,
          email,
          supporter_id,
          total: 0,
          breakdown: new Map<string, number>(),
          hasMissingFX: false,
        }

      if (fx.converted == null) {
        prev.hasMissingFX = true
        totals.set(key, prev)
        continue
      }

      prev.total += fx.converted
      prev.breakdown.set(cur, (prev.breakdown.get(cur) ?? 0) + Number(val))
      if (prev.donor === '—' && donor !== '—') prev.donor = donor
      if (prev.email === '—' && email !== '—') prev.email = email
      if (prev.supporter_id == null && supporter_id != null) prev.supporter_id = supporter_id
      totals.set(key, prev)
    }

    const sorted = [...totals.values()].sort((a, b) => b.total - a.total)
    return sorted.slice(0, 10)
  }, [rawRows, topDonorsType, currency])

  const donationOverview = useMemo(() => {
    const rows = rawRows ?? []
    const totalsByDay = new Map<number, number>()
    let overall = 0

    for (const r of rows) {
      if (r.donation_type !== 'Monetary') continue
      const val = r.amount ?? r.estimated_value
      if (val == null) continue
      const n = Number(val)
      if (!Number.isFinite(n) || n <= 0) continue

      const t = parseISODateToUTC(r.donation_date)
      if (t == null) continue

      const fromCur = (r.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const fx = convertCurrency(n, fromCur, currency)
      if (fx.converted == null) continue

      overall += fx.converted
      const dayKey = t
      totalsByDay.set(dayKey, (totalsByDay.get(dayKey) ?? 0) + fx.converted)
    }

    const dates = [...totalsByDay.keys()].sort((a, b) => a - b)
    const values = dates.map(d => totalsByDay.get(d) ?? 0)

    return { overall, dates, values }
  }, [rawRows, currency])

  const donorDetail = useMemo(() => {
    if (!donorDetailKey) return null
    const row = topDonors.find(d => d.key === donorDetailKey)
    if (!row) return null

    const rows = rawRows ?? []
    const matches = rows.filter(r => {
      const k = r.supporter_id != null ? `supporter:${r.supporter_id}` : `email:${donorEmail(r)}`
      return k === donorDetailKey
    })

    const totalsByType = new Map<string, number>()
    for (const r of matches) {
      const t = (r.donation_type ?? 'Unknown').trim() || 'Unknown'
      const val = r.amount ?? r.estimated_value
      if (val == null) continue
      const fromCur = (r.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const fx = convertCurrency(Number(val), fromCur, currency)
      if (fx.converted == null) continue
      totalsByType.set(t, (totalsByType.get(t) ?? 0) + fx.converted)
    }

    const recent = [...matches].sort((a, b) => (b.donation_date ?? '').localeCompare(a.donation_date ?? '')).slice(0, 10)

    return {
      ...row,
      totalsByType: [...totalsByType.entries()].sort((a, b) => b[1] - a[1]),
      recent,
      count: matches.length,
    }
  }, [donorDetailKey, topDonors, rawRows, currency])

  const filteredRows = useMemo(() => {
    const rows = rawRows ?? []
    const subset =
      donationTypeFilter === 'all' ? rows : rows.filter(r => r.donation_type === donationTypeFilter)
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
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Donations and Allocations</h1>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="shrink-0 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCurrencyMenuOpen(o => !o)}
            className="shrink-0 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
            aria-haspopup="menu"
            aria-expanded={currencyMenuOpen}
          >
            Currency: {currency}
          </button>

          {currencyMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden z-40"
              role="menu"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] border-b border-[var(--wt-border)]">
                Display currency
              </div>
              {SUPPORTED_CURRENCIES.map(cur => (
                <button
                  key={cur}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCurrency(cur)
                    setCurrencyMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_16%,transparent)] ${
                    cur === currency ? 'text-[var(--wt-text)] font-semibold' : 'text-[var(--wt-text-2)]'
                  }`}
                  title={`Uses static FX rates; original donation currency may differ.`}
                >
                  {cur}
                </button>
              ))}
              <div className="px-3 py-2 text-[10px] text-[var(--wt-text-2)] border-t border-[var(--wt-border)]">
                Static rates (edit in <code>src/lib/fxRates.ts</code>).
              </div>
            </div>
          )}
        </div>
      </div>

      {formError && <p className="text-sm text-[#dc2626]">{formError}</p>}

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Donation Overview</h2>
            <p className="text-sm text-[var(--wt-text-2)] mt-1">
              Sum of monetary donations and trend over time in {currency}.
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">
              Sum of monetary donations
            </span>
            <span className="text-xl font-semibold text-[var(--wt-text)] tabular-nums">
              {formatMoney(currency, donationOverview.overall)}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <LineChart
            title="Donations over time"
            dates={donationOverview.dates}
            values={donationOverview.values}
            currency={currency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Top Donors</h2>
            <label className="flex flex-col gap-1 min-w-[12rem] items-end">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Donation type</span>
              <select
                className={selectClass}
                value={topDonorsType}
                onChange={e => setTopDonorsType(e.target.value as 'all' | DonationType)}
              >
                <option value="all">All types</option>
                {DONATION_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium">Donor</th>
                  <th className="px-4 py-3 font-medium text-right">Total ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {topDonors.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-sm text-[var(--wt-text-2)] text-center">
                      No matching donations found yet.
                    </td>
                  </tr>
                ) : (
                  topDonors.map((d, idx) => {
                    const breakdown = [...d.breakdown.entries()]
                      .map(([cur, amt]) => `${cur} ${amt.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
                      .join(' + ')
                    const tooltip = [
                      breakdown ? `Breakdown: ${breakdown}` : null,
                      d.hasMissingFX ? `Some currencies excluded (missing FX rate).` : null,
                      `FX rates in use: ${Object.keys(FX_TO_PHP).sort().join(', ')}`,
                    ]
                      .filter(Boolean)
                      .join('\n')

                    return (
                      <tr
                        key={`${d.donor}-${idx}`}
                        className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] cursor-pointer"
                        onClick={() => setDonorDetailKey(d.key)}
                        title="Click to view donor details"
                      >
                        <td className="px-4 py-3 text-[var(--wt-text)]">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[var(--wt-border)] bg-[var(--wt-surface)] text-[10px] text-[var(--wt-text-2)]">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{d.donor}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span
                            className="text-[var(--wt-text)] font-semibold"
                            title={tooltip || undefined}
                          >
                            {formatMoney(currency, d.total)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Resources Funded</h2>
            <label className="flex flex-col gap-1 min-w-[12rem] items-end">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Time range</span>
              <select
                className={selectClass}
                value={allocationTime}
                onChange={e => setAllocationTime(e.target.value as typeof allocationTime)}
              >
                <option value="all">All-time</option>
                <option value="1y">Last Year</option>
                <option value="6m">Last 6 Months</option>
                <option value="1m">Last Month</option>
                <option value="2w">Last 2 Weeks</option>
                <option value="1w">Last Week</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="flex justify-center">
              {allocationsLoading ? (
                <div className="flex items-center gap-3 text-sm text-[var(--wt-text-2)] py-10">
                  <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : allocationsError ? (
                <p className="text-sm text-[#dc2626]">{allocationsError}</p>
              ) : resourcesFunded.length === 0 ? (
                <p className="text-sm text-[var(--wt-text-2)]">No allocation data found yet.</p>
              ) : (
                <DonutChart
                  title="Resources Funded"
                  data={resourcesFunded}
                  valueCurrency={currency}
                  centerLabel={allocatedTotal > 0 ? formatMoney(currency, allocatedTotal) : '—'}
                  size={320}
                />
              )}
            </div>
          </div>
        </div>
      </div>

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
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Date order</span>
          <select className={selectClass} value={sortByDate} onChange={e => setSortByDate(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
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

      <div className="pt-2">
        <h2 className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">All Donations</h2>
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Donor</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount / value</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  {staff && <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map(row => (
                  <tr
                    key={row.donation_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)]">{donorLabel(row)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{row.donation_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {row.donation_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatAmount(row, currency)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)] transition-colors"
                      >
                        Details
                      </button>
                    </td>
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

      {detailRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailRow(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto shadow-xl"
            role="dialog"
            aria-labelledby="donation-detail-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4 border-b border-[var(--wt-border)]">
              <h2 id="donation-detail-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
                Donation report
              </h2>
              <p className="text-xs text-[var(--wt-text-2)]">Full record for this contribution.</p>
            </div>
            <dl className="px-6 py-2">
              <DetailField label="Donation ID">{detailRow.donation_id}</DetailField>
              <DetailField label="Supporter ID">{detailRow.supporter_id ?? '—'}</DetailField>
              <DetailField label="Donor">{donorLabel(detailRow)}</DetailField>
              <DetailField label="Email">{donorEmail(detailRow)}</DetailField>
              <DetailField label="Type">{detailRow.donation_type ?? '—'}</DetailField>
              <DetailField label="Date">{detailRow.donation_date ?? '—'}</DetailField>
              <DetailField label="Campaign">{detailRow.campaign_name?.trim() || '—'}</DetailField>
              <DetailField label="Channel">{detailRow.channel_source ?? '—'}</DetailField>
              <DetailField label="Currency">{detailRow.currency_code?.trim() || '—'}</DetailField>
              <DetailField label={`Amount (shown in ${currency})`}>{formatAmount(detailRow, currency)}</DetailField>
              <DetailField label="Estimated value">
                {detailRow.estimated_value != null ? String(detailRow.estimated_value) : '—'}
              </DetailField>
              <DetailField label="Impact unit">{detailRow.impact_unit?.trim() || '—'}</DetailField>
              <DetailField label="Recurring">{detailRow.is_recurring ? 'Yes' : 'No'}</DetailField>
              <DetailField label="Notes">
                {detailRow.notes?.trim() ? (
                  <span className="whitespace-pre-wrap">{detailRow.notes}</span>
                ) : (
                  '—'
                )}
              </DetailField>
            </dl>
            <div className="p-6 pt-2 flex justify-end border-t border-[var(--wt-border)]">
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {donorDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDonorDetailKey(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] max-h-[90vh] overflow-y-auto shadow-xl"
            role="dialog"
            aria-labelledby="donor-detail-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--wt-border)] flex items-start justify-between gap-4">
              <div>
                <h2 id="donor-detail-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
                  {donorDetail.donor}
                </h2>
                <p className="text-sm text-[var(--wt-text-2)] mt-1">
                  {donorDetail.email !== '—' ? donorDetail.email : 'Email not available'} • {donorDetail.count} donations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDonorDetailKey(null)}
                className="rounded-lg border border-[var(--wt-border)] px-3 py-2 text-sm text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)]"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
                <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Totals by type ({currency})</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {donorDetail.totalsByType.length === 0 ? (
                    <p className="text-sm text-[var(--wt-text-2)]">No totals available.</p>
                  ) : (
                    donorDetail.totalsByType.map(([t, v]) => (
                      <div key={t} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[t] ?? '#94a3b8' }} />
                          <span className="text-sm text-[var(--wt-text)] truncate" title={t}>
                            {t}
                          </span>
                        </div>
                        <span className="text-sm text-[var(--wt-text)] font-semibold tabular-nums">{formatMoney(currency, v)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--wt-border)] flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Recent donations</div>
                  <div className="text-xs text-[var(--wt-text-2)]">Click a row for full details</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Amount / value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorDetail.recent.map(r => (
                        <tr
                          key={r.donation_id}
                          className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] cursor-pointer"
                          onClick={() => setDetailRow(r)}
                        >
                          <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{r.donation_date ?? '—'}</td>
                          <td className="px-4 py-3 text-[var(--wt-text)]">{r.donation_type ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-[var(--wt-text)] tabular-nums">{formatAmount(r, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
