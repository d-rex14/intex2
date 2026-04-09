import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { campaignOptionsForSelect } from '../../lib/fundraisingCampaigns'
import { bandNeutralCls, bandPositiveCls, bandWarningCls } from '../../lib/mlBandStyles'
import { BASE_CURRENCY, convertCurrency, FX_TO_PHP, SUPPORTED_CURRENCIES, toPHP } from '../../lib/fxRates'
import { isStaffLike } from '../../lib/roles'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type UpgradeScore = {
  supporter_id: number
  score: number
  band: 'High' | 'Medium' | 'Low'
  recommended_action: string | null
  model_version: string
  scored_at: string
}

type ChurnScore = {
  supporter_id: number
  churn_prob: number | null
  churn_risk_band: 'High' | 'Medium' | 'Low'
  model_version: string
  scored_at: string
}

async function fetchUpgradeScores(): Promise<{ data: UpgradeScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('donor_upgrade_scores')
    .select('supporter_id, score, band, recommended_action, model_version, scored_at')
    .order('score', { ascending: false })
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as UpgradeScore[], error: null }
}

type ChurnScoreRow = {
  supporter_id: number
  churn_prob?: number | null
  churn_risk_score?: number | null
  churn_risk_band?: string | null
  risk_tier?: string | null
  model_version?: string | null
  scored_at?: string | null
}

function normalizeChurnScore(r: ChurnScoreRow): ChurnScore {
  const prob = r.churn_prob ?? r.churn_risk_score ?? null
  const rawBand = r.churn_risk_band ?? r.risk_tier ?? 'Low'
  const churn_risk_band = (rawBand === 'High' || rawBand === 'Medium' || rawBand === 'Low'
    ? rawBand
    : 'Low') satisfies ChurnScore['churn_risk_band']
  return {
    supporter_id: r.supporter_id,
    churn_prob: prob,
    churn_risk_band,
    model_version: r.model_version ?? 'v1',
    scored_at: r.scored_at ?? '',
  }
}

async function fetchChurnScores(): Promise<{ data: ChurnScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase.from('donor_churn_scores').select('*')
  if (error) return { data: null, error: { message: error.message } }
  const rows = (data ?? []) as ChurnScoreRow[]
  return { data: rows.map(normalizeChurnScore), error: null }
}

function BandPill({ band, type }: { band: string; type: 'upgrade' | 'churn' }) {
  const colors: Record<string, string> =
    type === 'upgrade'
      ? { High: bandPositiveCls, Medium: bandNeutralCls, Low: bandNeutralCls }
      : { High: bandWarningCls, Medium: bandNeutralCls, Low: bandPositiveCls }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[band] ?? bandNeutralCls}`}>
      {band}
    </span>
  )
}

type SupporterEmbed = {
  supporter_id?: number | null
  display_name: string | null
  organization_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone?: string | null
  region?: string | null
  country?: string | null
  auth_user_id?: string | null
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
        supporter_id,
        display_name,
        organization_name,
        first_name,
        last_name,
        email,
        phone,
        region,
        country,
        auth_user_id
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

async function invokeAdmin(action: string, payload: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (!session) return { ok: false, error: sessionError?.message ?? 'You must be signed in.' }
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!baseUrl || !anonKey) return { ok: false, error: 'Supabase URL or anon key is not configured.' }
  try {
    const token = session.access_token
    const res = await fetch(`${baseUrl}/functions/v1/admin-site-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'X-Supabase-Access-Token': token,
      },
      body: JSON.stringify({ action, ...payload }),
    })
    const text = await res.text()
    const data = text ? (JSON.parse(text) as { error?: string }) : {}
    if (!res.ok) return { ok: false, error: data.error ?? `Request failed (${res.status})` }
    if (data.error) return { ok: false, error: data.error }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
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

type TimeRange = 'all' | '1y' | '6m' | '3m' | '1m' | '2w' | '1w'

function cutoffForRange(range: TimeRange): number | null {
  if (range === 'all') return null
  const now = Date.now()
  const msDay = 24 * 60 * 60 * 1000
  if (range === '1y') return now - 365 * msDay
  if (range === '6m') return now - 183 * msDay
  if (range === '3m') return now - 91 * msDay
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

function formatMonthUTC(t: number): string {
  const d = new Date(t)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

function startOfMonthUTC(t: number): number {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0)
}

function BarChart({
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
  const y = (v: number) => padT + (1 - v / maxY) * (height - padT - padB)

  const points = dates.map((t, i) => ({
    t,
    v: values[i],
    y: y(values[i]),
  }))

  const barAreaWidth = width - padL - padR
  const spacing = barAreaWidth / Math.max(points.length, 1)
  const barWidth = Math.min(34, Math.max(8, spacing * 0.72))

  // Assign x based on index so bars are evenly spaced visually.
  const pointsWithX = points.map((p, i) => ({
    ...p,
    x: padL + (i + 0.5) * spacing,
  }))

  const actualMax = Math.max(0, ...values)
  const maxLabel = actualMax > 0 ? actualMax : 0

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
          const rawIdx = Math.floor((px - padL) / Math.max(1, spacing))
          setHoverIdx(Math.max(0, Math.min(pointsWithX.length - 1, rawIdx)))
        }}
      >
        {/* y grid/label: only render the maximum to avoid clutter */}
        <g>
          <line
            x1={padL}
            x2={width - padR}
            y1={y(maxLabel)}
            y2={y(maxLabel)}
            stroke="color-mix(in_srgb,var(--wt-border)_55%,transparent)"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={y(maxLabel) + 4}
            textAnchor="end"
            className="fill-[var(--wt-text-2)]"
            style={{ fontSize: 10 }}
          >
            {formatMoney(currency, maxLabel).replace(`${currency} `, '')}
          </text>
        </g>

        {/* bars */}
        {pointsWithX.map((p, i) => {
          const xLeft = p.x - barWidth / 2
          const yTop = p.y
          const h = height - padB - yTop
          const isHover = hoverIdx === i
          return (
            <rect
              key={p.t}
              x={xLeft}
              y={yTop}
              width={barWidth}
              height={h}
              rx={2}
              fill="#f59e0b"
              opacity={isHover ? 1 : 0.82}
            >
              <title>{`${formatMonthUTC(p.t)}: ${formatMoney(currency, p.v)}`}</title>
            </rect>
          )
        })}

        {/* x labels (start / end) */}
        <text
          x={padL}
          y={height - 10}
          textAnchor="start"
          className="fill-[var(--wt-text-2)]"
          style={{ fontSize: 10 }}
        >
          {formatMonthUTC(minX)}
        </text>
        <text
          x={width - padR}
          y={height - 10}
          textAnchor="end"
          className="fill-[var(--wt-text-2)]"
          style={{ fontSize: 10 }}
        >
          {formatMonthUTC(maxX)}
        </text>

        {/* hover marker */}
        {hoverIdx != null && pointsWithX[hoverIdx] && (
          <>
            <line
              x1={pointsWithX[hoverIdx].x}
              x2={pointsWithX[hoverIdx].x}
              y1={padT}
              y2={height - padB}
              stroke="color-mix(in_srgb,var(--wt-accent)_60%,transparent)"
              strokeWidth="1"
            />
            <circle
              cx={pointsWithX[hoverIdx].x}
              cy={pointsWithX[hoverIdx].y}
              r={3}
              fill="var(--wt-accent)"
            />
          </>
        )}
      </svg>

      {hoverIdx != null && pointsWithX[hoverIdx] && (
        <div className="mt-2 text-xs text-[var(--wt-text-2)]">
          <span className="text-[var(--wt-text)] font-semibold">
            {formatMonthUTC(pointsWithX[hoverIdx].t)}
          </span>
          <span className="ml-3">
            {formatMoney(currency, pointsWithX[hoverIdx].v)} total
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
  const location = useLocation()
  const navigate = useNavigate()
  const staff = isStaffLike(effectiveRoleIds)

  const [donationTypeFilter, setDonationTypeFilter] = useState<'all' | DonationType>('all')
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest')
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState(1)
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY)
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [topDonorsType, setTopDonorsType] = useState<'all' | DonationType>('Monetary')
  const [allocationTime, setAllocationTime] = useState<TimeRange>('all')
  // Default to the smallest range we show on this card.
  const [overviewTime, setOverviewTime] = useState<TimeRange>('6m')
  const [overviewDonationType, setOverviewDonationType] = useState<'all' | DonationType>('Monetary')

  const [donorDetailKey, setDonorDetailKey] = useState<string | null>(null)
  const [detailRow, setDetailRow] = useState<DonationWithSupporter | null>(null)
  const [editing, setEditing] = useState<DonationWithSupporter | null>(null)
  const [deleting, setDeleting] = useState<DonationWithSupporter | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [requestingSupporterId, setRequestingSupporterId] = useState<number | null>(null)
  const [thankingDonationId, setThankingDonationId] = useState<number | null>(null)
  const [donorSearch, setDonorSearch] = useState('')
  const [donorPage, setDonorPage] = useState(1)
  const [donorPageSize, setDonorPageSize] = useState<number>(10)

  const queryFn = useMemo(() => () => fetchDonations(), [])
  const { data: rawRows, loading, error, refetch } = useSupabaseQuery(queryFn)

  const allocationsQueryFn = useMemo(() => () => fetchAllocations(), [])
  const {
    data: allocationRows,
    loading: allocationsLoading,
    error: allocationsError,
  } = useSupabaseQuery(allocationsQueryFn)

  const upgradeScoresQueryFn = useMemo(() => () => fetchUpgradeScores(), [])
  const { data: upgradeScores, loading: upgradeLoading } = useSupabaseQuery(upgradeScoresQueryFn)

  const churnScoresQueryFn = useMemo(() => () => fetchChurnScores(), [])
  const { data: churnScores } = useSupabaseQuery(churnScoresQueryFn)

  const upgradeBySupporter = useMemo(() => {
    const m = new Map<number, UpgradeScore>()
    for (const s of upgradeScores ?? []) m.set(s.supporter_id, s)
    return m
  }, [upgradeScores])

  const churnBySupporter = useMemo(() => {
    const m = new Map<number, ChurnScore>()
    for (const s of churnScores ?? []) m.set(s.supporter_id, s)
    return m
  }, [churnScores])

  // Top upgrade candidates — join score with latest donor label from rawRows.
  const upgradeCandidates = useMemo(() => {
    const scores = upgradeScores ?? []
    if (scores.length === 0) return []
    const latestBySupporter = new Map<number, DonationWithSupporter>()
    for (const r of rawRows ?? []) {
      if (r.supporter_id == null) continue
      const prev = latestBySupporter.get(r.supporter_id)
      if (!prev || (r.donation_date ?? '') > (prev.donation_date ?? '')) {
        latestBySupporter.set(r.supporter_id, r)
      }
    }
    const sorted = [...scores].sort((a, b) => {
      const ds = (b.score ?? 0) - (a.score ?? 0)
      if (ds !== 0) return ds
      return a.supporter_id - b.supporter_id
    })
    return sorted.slice(0, 10).map(s => ({
      ...s,
      donor: (() => {
        const row = latestBySupporter.get(s.supporter_id)
        return row ? donorLabel(row) : `Supporter #${s.supporter_id}`
      })(),
      lastGift: latestBySupporter.get(s.supporter_id)?.donation_date ?? null,
    }))
  }, [upgradeScores, rawRows])

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
    const totalsByMonth = new Map<number, number>()
    let overall = 0

    for (const r of rows) {
      if (overviewDonationType !== 'all' && r.donation_type !== overviewDonationType) continue
      const val = r.amount ?? r.estimated_value
      if (val == null) continue
      const n = Number(val)
      if (!Number.isFinite(n) || n <= 0) continue

      const t = parseISODateToUTC(r.donation_date)
      if (t == null) continue

      const cutoff = cutoffForRange(overviewTime)
      if (cutoff != null && t < cutoff) continue

      const fromCur = (r.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const fx = convertCurrency(n, fromCur, currency)
      if (fx.converted == null) continue

      overall += fx.converted
      const monthKey = startOfMonthUTC(t)
      totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + fx.converted)
    }

    const dates = [...totalsByMonth.keys()].sort((a, b) => a - b)
    const values = dates.map(d => totalsByMonth.get(d) ?? 0)

    return { overall, dates, values }
  }, [rawRows, currency, overviewTime, overviewDonationType])

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

  const donorContacts = useMemo(() => {
    const rows = rawRows ?? []
    const byKey = new Map<string, {
      key: string
      donor: string
      email: string
      phone: string
      region: string
      country: string
      supporter_id: number | null
      donationCount: number
      total: number
      isSiteDonor: boolean
      lastDonation: string | null
    }>()
    for (const r of rows) {
      const s = r.supporters
      const email = s?.email?.trim() || donorEmail(r)
      const key = r.supporter_id != null ? `supporter:${r.supporter_id}` : `email:${email.toLowerCase()}`
      const fromCur = (r.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const val = Number(r.amount ?? r.estimated_value ?? 0)
      const fx = Number.isFinite(val) ? convertCurrency(val, fromCur, currency).converted ?? 0 : 0
      const prev = byKey.get(key) ?? {
        key,
        donor: donorLabel(r),
        email,
        phone: s?.phone?.trim() || '—',
        region: s?.region?.trim() || '—',
        country: s?.country?.trim() || '—',
        supporter_id: r.supporter_id ?? s?.supporter_id ?? null,
        donationCount: 0,
        total: 0,
        isSiteDonor: Boolean(s?.auth_user_id || email !== '—'),
        lastDonation: r.donation_date ?? null,
      }
      prev.donationCount += 1
      prev.total += fx
      if ((r.donation_date ?? '') > (prev.lastDonation ?? '')) prev.lastDonation = r.donation_date ?? null
      if (prev.phone === '—' && s?.phone?.trim()) prev.phone = s.phone.trim()
      if (prev.region === '—' && s?.region?.trim()) prev.region = s.region.trim()
      if (prev.country === '—' && s?.country?.trim()) prev.country = s.country.trim()
      byKey.set(key, prev)
    }
    return [...byKey.values()].sort((a, b) => b.total - a.total)
  }, [rawRows, currency])

  const filteredDonorContacts = useMemo(() => {
    const q = donorSearch.trim().toLowerCase()
    if (!q) return donorContacts
    return donorContacts.filter((d) =>
      [d.donor, d.email, d.phone, d.region, d.country].join(' ').toLowerCase().includes(q),
    )
  }, [donorContacts, donorSearch])

  const donorTotalPages = Math.max(1, Math.ceil(filteredDonorContacts.length / donorPageSize))

  useEffect(() => {
    if (donorPage > donorTotalPages) setDonorPage(donorTotalPages)
  }, [donorPage, donorTotalPages])

  const pagedDonorContacts = useMemo(() => {
    const start = (donorPage - 1) * donorPageSize
    return filteredDonorContacts.slice(start, start + donorPageSize)
  }, [filteredDonorContacts, donorPage, donorPageSize])

  const requestDonation = async (donor: {
    supporter_id: number | null
    donor: string
  }) => {
    if (!donor.supporter_id) return
    setRequestingSupporterId(donor.supporter_id)
    setFormError(null)
    const res = await invokeAdmin('request_donation', {
      supporter_id: donor.supporter_id,
      message: `Hi ${donor.donor}, Lighthouse invited you to make a new donation.`,
    })
    if (!res.ok) setFormError(res.error)
    setRequestingSupporterId(null)
  }

  const sendThanks = async (row: DonationWithSupporter) => {
    setThankingDonationId(row.donation_id)
    setFormError(null)
    const res = await invokeAdmin('give_thanks', {
      donation_id: row.donation_id,
    })
    if (!res.ok) setFormError(res.error)
    setThankingDonationId(null)
  }

  useEffect(() => {
    const openDonationIdRaw = (location.state as { openDonationId?: unknown } | null)?.openDonationId
    if (typeof openDonationIdRaw !== 'number' || !Number.isInteger(openDonationIdRaw)) return
    if (!rawRows || rawRows.length === 0) return
    const row = rawRows.find((r) => r.donation_id === openDonationIdRaw)
    if (row) setDetailRow(row)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate, rawRows])

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
          <div className="flex items-center gap-4">
            <label className="flex flex-col gap-1 min-w-[10rem] items-end">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Time range</span>
              <select
                className={selectClass}
                value={overviewTime}
                onChange={e => setOverviewTime(e.target.value as TimeRange)}
              >
                <option value="all">All-time</option>
                <option value="1y">Last Year</option>
                <option value="6m">Last 6 Months</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[10rem] items-end">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Donation type</span>
              <select
                className={selectClass}
                value={overviewDonationType}
                onChange={e => setOverviewDonationType(e.target.value as 'all' | DonationType)}
              >
                <option value="all">All types</option>
                {DONATION_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-baseline gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">
                Sum of selected donations
              </span>
              <span className="text-xl font-semibold text-[var(--wt-text)] tabular-nums">
                {formatMoney(currency, donationOverview.overall)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <BarChart
            title="Donations over time"
            dates={donationOverview.dates}
            values={donationOverview.values}
            currency={currency}
          />
        </div>
      </div>

      {staff && (
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Upgrade Opportunity Queue</h2>
              <p className="text-sm text-[var(--wt-text-2)] mt-1">
                Donors most likely to convert to recurring giving, ranked by model score.{' '}
                <span className="text-[10px] uppercase tracking-widest">Decision support only</span>
              </p>
            </div>
            {(upgradeScores ?? []).length > 0 && (
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">
                Model v{upgradeScores![0].model_version} · {upgradeScores![0].scored_at.slice(0, 10)}
              </span>
            )}
          </div>

          {upgradeLoading ? (
            <div className="flex items-center gap-3 py-8 justify-center text-sm text-[var(--wt-text-2)]">
              <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
              Loading upgrade scores…
            </div>
          ) : upgradeCandidates.length === 0 ? (
            <p className="text-sm text-[var(--wt-text-2)] py-4 text-center">
              Upgrade scores not yet available. Run the{' '}
              <code className="text-xs">04_donor_upgrade_predictor</code> notebook and export to{' '}
              <code className="text-xs">donor_upgrade_scores</code>.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                    <th className="px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">Donor</th>
                    <th className="px-4 py-3 font-medium text-right">Score</th>
                    <th className="px-4 py-3 font-medium">Last Gift</th>
                    <th className="px-4 py-3 font-medium min-w-[12rem]">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upgradeCandidates.map((c, idx) => (
                    <tr
                      key={c.supporter_id}
                      className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                    >
                      <td className="px-4 py-3 text-[var(--wt-text-2)] tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)] font-medium">{c.donor}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-[var(--wt-accent)] font-semibold">{(c.score * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)] whitespace-nowrap">{c.lastGift ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)] text-xs">{c.recommended_action ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                  {staff && <th className="px-4 py-3 font-medium">Lapse Risk</th>}
                </tr>
              </thead>
              <tbody>
                {topDonors.length === 0 ? (
                  <tr>
                    <td colSpan={staff ? 3 : 2} className="px-4 py-6 text-sm text-[var(--wt-text-2)] text-center">
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
                    const churn = d.supporter_id != null ? churnBySupporter.get(d.supporter_id) : undefined

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
                        {staff && (
                          <td className="px-4 py-3">
                            {churn ? (
                              <BandPill band={churn.churn_risk_band} type="churn" />
                            ) : (
                              <span className="text-[var(--wt-text-2)] text-xs">—</span>
                            )}
                          </td>
                        )}
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

      <div className="pt-2">
        <h2 className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">Donor Contact List</h2>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3">
        <label className="flex flex-col gap-1 min-w-[14rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Search donors</span>
          <input
            type="text"
            value={donorSearch}
            onChange={(e) => {
              setDonorSearch(e.target.value)
              setDonorPage(1)
            }}
            placeholder="Name, email, phone, region, country..."
            className={selectClass}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows per page</span>
          <select
            className={selectClass}
            value={donorPageSize}
            onChange={(e) => {
              setDonorPageSize(Number(e.target.value))
              setDonorPage(1)
            }}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium text-right">Donations</th>
                <th className="px-4 py-3 font-medium text-right">Total ({currency})</th>
                {staff && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pagedDonorContacts.map((d) => (
                <tr
                  key={d.key}
                  className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] cursor-pointer"
                  onClick={() => setDonorDetailKey(d.key)}
                  title="Click to view donor details"
                >
                  <td className="px-4 py-3 text-[var(--wt-text)] font-medium">{d.donor}</td>
                  <td className="px-4 py-3 text-[var(--wt-text)]">{d.email}</td>
                  <td className="px-4 py-3 text-[var(--wt-text)]">{d.phone}</td>
                  <td className="px-4 py-3 text-[var(--wt-text)]">{d.region}</td>
                  <td className="px-4 py-3 text-[var(--wt-text)]">{d.country}</td>
                  <td className="px-4 py-3 text-right text-[var(--wt-text)] tabular-nums">{d.donationCount}</td>
                  <td className="px-4 py-3 text-right text-[var(--wt-text)] tabular-nums">{formatMoney(currency, d.total)}</td>
                  {staff && (
                    <td className="px-4 py-3 text-right">
                      {d.isSiteDonor && d.supporter_id ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void requestDonation(d)
                          }}
                          disabled={requestingSupporterId === d.supporter_id}
                          className="rounded-lg border border-[var(--wt-border)] px-2 py-1 text-xs text-[var(--wt-accent)] disabled:opacity-50"
                        >
                          {requestingSupporterId === d.supporter_id ? 'Sending...' : 'Request Donation'}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--wt-text-2)]">No site account</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {pagedDonorContacts.length === 0 && (
                <tr>
                  <td colSpan={staff ? 8 : 7} className="px-4 py-6 text-center text-[var(--wt-text-2)]">
                    No donor contacts available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {filteredDonorContacts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--wt-text)]">
          <p className="text-[var(--wt-text-2)] tabular-nums">
            Donor page {donorPage} of {donorTotalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={donorPage <= 1}
              onClick={() => setDonorPage(1)}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
            >
              First
            </button>
            <button
              type="button"
              disabled={donorPage <= 1}
              onClick={() => setDonorPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={donorPage >= donorTotalPages}
              onClick={() => setDonorPage((p) => Math.min(donorTotalPages, p + 1))}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
            <button
              type="button"
              disabled={donorPage >= donorTotalPages}
              onClick={() => setDonorPage(donorTotalPages)}
              className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-1.5 text-xs font-medium disabled:opacity-40 disabled:pointer-events-none"
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
            className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden"
            role="dialog"
            aria-labelledby="donation-detail-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6 space-y-4 border-b border-[var(--wt-border)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="donation-detail-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
                    Donation report
                  </h2>
                  <p className="text-xs text-[var(--wt-text-2)]">Full record for this contribution.</p>
                </div>
                <button type="button" onClick={() => setDetailRow(null)} className="rounded-lg border border-[var(--wt-border)] p-2 text-[var(--wt-text-2)] hover:text-[var(--wt-text)]">
                  <X size={14} />
                </button>
              </div>
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
            <div className="p-6 pt-2 flex items-center justify-end gap-2 border-t border-[var(--wt-border)]">
              {staff && (
                <button
                  type="button"
                  onClick={() => void sendThanks(detailRow)}
                  disabled={thankingDonationId === detailRow.donation_id}
                  className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm font-semibold text-[var(--wt-accent)] disabled:opacity-60"
                >
                  {thankingDonationId === detailRow.donation_id ? 'Sending...' : 'Give Thanks'}
                </button>
              )}
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
        </div>
      )}

      {donorDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDonorDetailKey(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden"
            role="dialog"
            aria-labelledby="donor-detail-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {staff && donorDetail.supporter_id != null && upgradeBySupporter.get(donorDetail.supporter_id) && (() => {
                const us = upgradeBySupporter.get(donorDetail.supporter_id)!
                const cs = churnBySupporter.get(donorDetail.supporter_id)
                return (
                  <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-3">Upgrade Insight</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Upgrade Score</div>
                        <div className="text-xl font-semibold text-[var(--wt-accent)] tabular-nums">{(us.score * 100).toFixed(1)}%</div>
                        <BandPill band={us.band} type="upgrade" />
                      </div>
                      {cs && (
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Lapse Risk</div>
                          <div className="text-xl font-semibold tabular-nums text-[var(--wt-text)]">
                            {cs.churn_prob != null ? `${(cs.churn_prob * 100).toFixed(1)}%` : '—'}
                          </div>
                          <BandPill band={cs.churn_risk_band} type="churn" />
                        </div>
                      )}
                      <div className={cs ? '' : 'sm:col-span-2'}>
                        <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Recommended Action</div>
                        <p className="text-sm text-[var(--wt-text)]">{us.recommended_action ?? '—'}</p>
                        <p className="text-[10px] text-[var(--wt-text-2)] mt-2">Model v{us.model_version} · {us.scored_at.slice(0, 10)} · Decision support only</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

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
        </div>
      )}

      {editing && staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-6 space-y-4 max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
