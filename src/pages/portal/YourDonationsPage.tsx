import { useCallback, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ORG } from '../../content/org'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import {
  buildDonationInvoiceHtml,
  buildYtdReportCsv,
  buildYtdReportHtml,
  downloadTextFile,
  type InvoiceDonationInput,
  type YtdRowInput,
} from '../../lib/donorGivingDocuments'
import { BASE_CURRENCY, convertCurrency, SUPPORTED_CURRENCIES } from '../../lib/fxRates'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type MyDonation = {
  donation_id: number
  donation_type: string | null
  donation_date: string | null
  currency_code: string | null
  amount: number | null
  estimated_value: number | null
  impact_unit: string | null
  is_recurring: boolean | null
  campaign_name: string | null
  channel_source: string | null
  notes: string | null
}

type AllocationRow = {
  program_area: string | null
  amount_allocated: number | null
}

const DONUT_COLORS = ['#475569', '#c59a54', '#6b7280', '#c2b89c', '#f59e0b', '#94a3b8'] as const

function formatMoney(currencyCode: string, n: number): string {
  const cur = (currencyCode || BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parseISODateToUTC(dateStr: string | null | undefined): number | null {
  const d = (dateStr ?? '').toString().slice(0, 10)
  if (!d) return null
  const t = Date.parse(`${d}T00:00:00Z`)
  return Number.isFinite(t) ? t : null
}

function formatFriendlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const t = parseISODateToUTC(dateStr)
  if (t == null) return '—'
  const d = new Date(t)
  const now = new Date()
  const oneYearAgo = new Date(now.getTime())
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  const optsRecent: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' }
  const optsOld: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' }

  const withinYear = t >= oneYearAgo.getTime()
  return d.toLocaleDateString(undefined, withinYear ? optsRecent : optsOld)
}

function bestEffortDisplayName(email: string | null | undefined): string {
  const e = (email ?? '').trim()
  if (!e) return 'there'
  const local = e.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  return cleaned ? cleaned.replace(/\b\w/g, c => c.toUpperCase()) : 'there'
}

function donationCalendarYear(dateStr: string | null | undefined): number | null {
  const y = (dateStr ?? '').toString().slice(0, 4)
  const n = Number(y)
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null
}

function isDonationInYear(dateStr: string | null | undefined, year: number): boolean {
  return donationCalendarYear(dateStr) === year
}

function formatAmount(row: MyDonation, displayCurrency: string): string {
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
  const fromCur = (row.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
  const fx = convertCurrency(n, fromCur, displayCurrency)
  if (fx.converted == null) {
    return `${fromCur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return formatMoney(displayCurrency, fx.converted)
}

function DonutChart({
  title,
  centerLabel,
  data,
  currency,
}: {
  title: string
  centerLabel: string
  data: { label: string; value: number; color: string }[]
  currency: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const size = 260
  const stroke = 20
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
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
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
          y={size / 2 - 4}
          textAnchor="middle"
          className="fill-[var(--wt-text)]"
          style={{ fontSize: 18, fontWeight: 750 }}
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
          YOUR_TOTAL
        </text>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-xs text-[var(--wt-text)] shadow-xl"
          style={{
            left: Math.min(hover.x + 12, size - 8),
            top: Math.max(hover.y - 12, 8),
            transform: 'translate(-10%, -100%)',
            maxWidth: 240,
          }}
        >
          <div className="font-semibold">{hover.label}</div>
          <div className="text-[var(--wt-text-2)] mt-0.5">
            {formatMoney(currency, hover.value)} • {(hover.frac * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  )
}

function myDonationToInvoiceInput(row: MyDonation): InvoiceDonationInput {
  return {
    donationId: row.donation_id,
    donationDate: row.donation_date,
    donationType: row.donation_type,
    currencyCode: row.currency_code,
    amount: row.amount,
    estimatedValue: row.estimated_value,
    impactUnit: row.impact_unit,
    channelSource: row.channel_source,
    campaignName: row.campaign_name,
    isRecurring: row.is_recurring,
    notes: row.notes,
  }
}

export function YourDonationsPage() {
  const { user } = useAuth()
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY)
  const [selectedDonation, setSelectedDonation] = useState<MyDonation | null>(null)

  const queryFn = useCallback(async (): Promise<{
    data: MyDonation[] | null
    error: { message: string } | null
  }> => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
    if (!user) return { data: [], error: null }

    // Step 1: find the supporter row(s) linked to this account
    const { data: supporters, error: supErr } = await supabase
      .from('supporters')
      .select('supporter_id')
      .or(`auth_user_id.eq.${user.id},email.eq.${(user.email ?? '').toLowerCase()}`)

    if (supErr) return { data: null, error: { message: supErr.message } }
    if (!supporters || supporters.length === 0) return { data: [], error: null }

    const ids = supporters.map((s: { supporter_id: number }) => s.supporter_id)

    // Step 2: fetch their donations
    const { data, error } = await supabase
      .from('donations')
      .select(
        `donation_id, donation_type, donation_date, currency_code,
         amount, estimated_value, impact_unit, is_recurring,
         campaign_name, channel_source, notes`,
      )
      .in('supporter_id', ids)
      .order('donation_date', { ascending: false })

    if (error) return { data: null, error: { message: error.message } }
    return { data: (data ?? []) as MyDonation[], error: null }
  }, [user])

  const { data, loading, error, refetch } = useSupabaseQuery<MyDonation[]>(queryFn)

  const allocationsQueryFn = useCallback(async (): Promise<{
    data: AllocationRow[] | null
    error: { message: string } | null
  }> => {
    if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }

    const { data, error } = await supabase
      .from('donation_allocations')
      .select('program_area, amount_allocated')
      .limit(5000)

    if (error) return { data: null, error: { message: error.message } }
    return { data: (data ?? []) as AllocationRow[], error: null }
  }, [])

  const { data: allocationRows, loading: allocationsLoading, error: allocationsError } =
    useSupabaseQuery<AllocationRow[]>(allocationsQueryFn)

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Configure Supabase environment variables to load your donations.
        </p>
      </div>
    )
  }

  const displayName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    bestEffortDisplayName(user?.email)

  const donations = data ?? []

  const lastDonation = donations[0] ?? null
  const donationCount = donations.length

  const lifetimeTotal = useMemo(() => {
    let sum = 0
    let excluded = 0
    for (const d of donations) {
      if (d.donation_type !== 'Monetary') continue
      const val = d.amount ?? d.estimated_value
      if (val == null) continue
      const fromCur = (d.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const fx = convertCurrency(Number(val), fromCur, currency)
      if (fx.converted == null) {
        excluded++
        continue
      }
      sum += fx.converted
    }
    return { sum, excluded }
  }, [donations, currency])

  const allocationRatios = useMemo(() => {
    const rows = allocationRows ?? []
    const totals = new Map<string, number>()
    for (const r of rows) {
      const label = (r.program_area ?? '').trim() || 'Uncategorized'
      const amt = Number(r.amount_allocated ?? 0)
      if (!Number.isFinite(amt) || amt <= 0) continue
      totals.set(label, (totals.get(label) ?? 0) + amt)
    }
    const total = [...totals.values()].reduce((a, b) => a + b, 0)
    if (total <= 0) return []
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([label, amt], i) => ({
      label,
      ratio: amt / total,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
  }, [allocationRows])

  const allocationSegments = useMemo(() => {
    if (lifetimeTotal.sum <= 0) return []
    return allocationRatios.map(r => ({
      label: r.label,
      value: lifetimeTotal.sum * r.ratio,
      color: r.color,
    }))
  }, [allocationRatios, lifetimeTotal.sum])

  const reportYear = new Date().getFullYear()

  const ytdDonations = useMemo(
    () => donations.filter(d => isDonationInYear(d.donation_date, reportYear)),
    [donations, reportYear],
  )

  const ytdMonetary = useMemo(() => {
    let sum = 0
    let excluded = 0
    for (const d of ytdDonations) {
      if (d.donation_type !== 'Monetary') continue
      const val = d.amount ?? d.estimated_value
      if (val == null) continue
      const fromCur = (d.currency_code ?? BASE_CURRENCY).trim() || BASE_CURRENCY
      const fx = convertCurrency(Number(val), fromCur, currency)
      if (fx.converted == null) {
        excluded++
        continue
      }
      sum += fx.converted
    }
    return { sum, excluded, count: ytdDonations.length }
  }, [ytdDonations, currency])

  const ytdReportRows: YtdRowInput[] = useMemo(
    () =>
      [...ytdDonations].sort((a, b) => {
        const ta = parseISODateToUTC(a.donation_date) ?? 0
        const tb = parseISODateToUTC(b.donation_date) ?? 0
        return tb - ta
      }).map(row => ({
        donationId: row.donation_id,
        donationDate: row.donation_date,
        donationType: row.donation_type,
        currencyCode: row.currency_code,
        amountLabel: formatAmount(row, currency),
        channelSource: row.channel_source,
      })),
    [ytdDonations, currency],
  )

  const downloadGiftReceipt = (row: MyDonation) => {
    const html = buildDonationInvoiceHtml({
      donation: myDonationToInvoiceInput(row),
      donorDisplayName: displayName,
      donorEmail: (user?.email ?? '').trim() || '—',
      amountLabel: formatAmount(row, currency),
      generatedAtIso: new Date().toLocaleString(),
    })
    downloadTextFile(`watchtower-gift-receipt-${row.donation_id}.html`, html)
  }

  const downloadYtdHtml = () => {
    const summaryLines = [
      `Gifts recorded in ${reportYear}: ${ytdMonetary.count}`,
      `Monetary total (approx. ${currency}, where converted): ${formatMoney(currency, ytdMonetary.sum)}`,
    ]
    if (ytdMonetary.excluded > 0) {
      summaryLines.push(
        `${ytdMonetary.excluded} monetary gift(s) omitted from the total due to missing exchange rates — see table for original currencies.`,
      )
    }
    const html = buildYtdReportHtml({
      year: reportYear,
      donorDisplayName: displayName,
      donorEmail: (user?.email ?? '').trim() || '—',
      rows: ytdReportRows,
      summaryLines,
      generatedAtIso: new Date().toLocaleString(),
    })
    downloadTextFile(`watchtower-giving-ytd-${reportYear}.html`, html)
  }

  const downloadYtdCsv = () => {
    const csv = buildYtdReportCsv({
      year: reportYear,
      donorDisplayName: displayName,
      donorEmail: (user?.email ?? '').trim() || '—',
      rows: ytdReportRows,
    })
    downloadTextFile(`watchtower-giving-ytd-${reportYear}.csv`, csv, 'text/csv;charset=utf-8')
  }

  const lastDonationDate = lastDonation?.donation_date ?? null
  const lastDonationAmount = lastDonation ? formatAmount(lastDonation, currency) : '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/donations"
              className="rounded-lg bg-[color-mix(in_srgb,var(--wt-accent)_22%,transparent)] border border-[color-mix(in_srgb,var(--wt-accent)_40%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent)_30%,transparent)] transition-colors"
            >
              Donate Again!
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--wt-text)] tracking-tight">
              Welcome back, {displayName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Currency</span>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => refetch()}
              className="self-end rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border border-[var(--wt-border)] bg-[var(--wt-bg)] flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold text-[var(--wt-text)]">{formatFriendlyDate(lastDonationDate)}</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mt-1">Last donation</div>
              <div className="text-xs text-[var(--wt-text-2)] mt-1">{lastDonationAmount}</div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border border-[var(--wt-border)] bg-[var(--wt-bg)] flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold text-[var(--wt-text)]">
                {formatMoney(currency, lifetimeTotal.sum)}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mt-1">Lifetime total</div>
              {lifetimeTotal.excluded > 0 && (
                <div className="text-[10px] text-[var(--wt-text-2)] mt-1" title="Some donations excluded due to missing FX rate.">
                  Some excluded
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border border-[var(--wt-border)] bg-[var(--wt-bg)] flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold text-[var(--wt-text)] tabular-nums">{donationCount}</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mt-1">Donations</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Year-to-date giving ({reportYear})</h2>
            <p className="text-sm text-[var(--wt-text-2)] mt-1 max-w-2xl leading-relaxed">
              Summary of gifts recorded in your account for the calendar year. Download a report for your tax preparer or
              records. This is not tax advice; keep official bank or processor statements as needed. Organization: Lighthouse
              Sanctuary, EIN {ORG.ein}.
            </p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-3">
                <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Gifts this year</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--wt-text)]">{ytdMonetary.count}</dd>
              </div>
              <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-3 sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">
                  Monetary total (≈ {currency})
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--wt-text)]">
                  {formatMoney(currency, ytdMonetary.sum)}
                </dd>
                {ytdMonetary.excluded > 0 && (
                  <p className="text-xs text-[var(--wt-text-2)] mt-1">
                    Some amounts excluded from this total (missing FX); full detail is in the downloads.
                  </p>
                )}
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadYtdHtml()}
              disabled={ytdDonations.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-2.5 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Download YTD report (HTML)
            </button>
            <button
              type="button"
              onClick={() => downloadYtdCsv()}
              disabled={ytdDonations.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-4 py-2.5 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_14%,transparent)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
              Download YTD (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Donation Allocation</h2>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">See how your donations are used</p>

          <div className="mt-5 flex items-center justify-center">
            {allocationsLoading ? (
              <div className="flex items-center gap-3 text-sm text-[var(--wt-text-2)] py-10">
                <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : allocationsError ? (
              <p className="text-sm text-[#dc2626]">{allocationsError}</p>
            ) : allocationSegments.length === 0 ? (
              <p className="text-sm text-[var(--wt-text-2)]">No allocation data available yet.</p>
            ) : (
              <DonutChart
                title="Donation Allocation"
                centerLabel={lifetimeTotal.sum > 0 ? formatMoney(currency, lifetimeTotal.sum) : '—'}
                data={allocationSegments}
                currency={currency}
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--wt-border)]">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Donation History</h2>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading your donations…
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-[#dc2626]">{error}</p>
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-[var(--wt-text-2)]">No donations found for your account.</p>
            <p className="text-xs text-[var(--wt-text-2)]">
              Donations submitted with your email address will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Method</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map(row => (
                  <tr
                    key={row.donation_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {formatFriendlyDate(row.donation_date)}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatAmount(row, currency)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)]">{row.channel_source ?? '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDonation(row)}
                        className="text-[var(--wt-accent)] text-xs font-semibold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {selectedDonation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={() => setSelectedDonation(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            role="dialog"
            aria-labelledby="donation-detail-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--wt-border)]">
              <div>
                <h2 id="donation-detail-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
                  Gift #{selectedDonation.donation_id}
                </h2>
                <p className="text-xs text-[var(--wt-text-2)] mt-1">
                  Acknowledgment you can save or print for charitable giving records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="rounded-lg border border-[var(--wt-border)] p-2 text-[var(--wt-text-2)] hover:text-[var(--wt-text)] shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <dl className="grid grid-cols-1 gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--wt-text-2)]">Date</dt>
                  <dd className="text-[var(--wt-text)] font-medium">{formatFriendlyDate(selectedDonation.donation_date)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--wt-text-2)]">Amount</dt>
                  <dd className="text-[var(--wt-text)] font-medium">{formatAmount(selectedDonation, currency)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--wt-text-2)]">Type</dt>
                  <dd className="text-[var(--wt-text)]">{selectedDonation.donation_type ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--wt-text-2)]">Channel</dt>
                  <dd className="text-[var(--wt-text)]">{selectedDonation.channel_source ?? '—'}</dd>
                </div>
                {selectedDonation.campaign_name?.trim() && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--wt-text-2)]">Campaign</dt>
                    <dd className="text-[var(--wt-text)]">{selectedDonation.campaign_name}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--wt-text-2)]">Recurring</dt>
                  <dd className="text-[var(--wt-text)]">{selectedDonation.is_recurring ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
              {selectedDonation.notes?.trim() && (
                <div className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] p-3">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Notes</div>
                  <p className="text-[var(--wt-text)] mt-1 whitespace-pre-wrap text-sm">{selectedDonation.notes}</p>
                </div>
              )}
              <p className="text-xs text-[var(--wt-text-2)] leading-relaxed">
                Download opens an HTML receipt. Use your browser&apos;s <strong className="text-[var(--wt-text)]">Print → Save as PDF</strong>{' '}
                if you need a PDF. EIN {ORG.ein}.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => downloadGiftReceipt(selectedDonation)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--wt-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  <Download className="h-4 w-4 shrink-0" aria-hidden />
                  Download gift receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="rounded-lg border border-[var(--wt-border)] px-4 py-2.5 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
