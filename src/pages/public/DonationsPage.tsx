import { useCallback, useMemo, useState } from 'react'
import { ORG } from '../../content/org'
import { RecordedDonationForm } from '../../components/RecordedDonationForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { BASE_CURRENCY, convertCurrency, SUPPORTED_CURRENCIES } from '../../lib/fxRates'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type AllocationRow = {
  program_area: string | null
  amount_allocated: number | null
}

const DONUT_COLORS = ['#475569', '#c59a54', '#6b7280', '#c2b89c', '#f59e0b', '#94a3b8'] as const

function formatMoney(currencyCode: string, n: number): string {
  const cur = (currencyCode || BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function fetchAllocations(): Promise<{
  data: AllocationRow[] | null
  error: { message: string } | null
}> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('donation_allocations')
    .select('program_area, amount_allocated')
    .limit(5000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as AllocationRow[], error: null }
}

function AllocationDonutChart({
  title,
  centerLabel,
  centerSubtext,
  data,
  currency,
}: {
  title: string
  centerLabel: string
  centerSubtext: string
  data: { label: string; value: number; color: string }[]
  currency: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const size = 280
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
          {centerSubtext}
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

export function DonationsPage() {
  const [currency, setCurrency] = useState<string>(BASE_CURRENCY)

  const allocationsQueryFn = useCallback(() => fetchAllocations(), [])
  const { data: allocationRows, loading: allocationsLoading, error: allocationsError } =
    useSupabaseQuery<AllocationRow[]>(allocationsQueryFn)

  const resourcesFunded = useMemo(() => {
    const rows = allocationRows ?? []
    const m = new Map<string, number>()
    for (const r of rows) {
      const label = (r.program_area ?? '').trim() || 'Uncategorized'
      const amt = Number(r.amount_allocated ?? 0)
      if (!Number.isFinite(amt) || amt <= 0) continue
      m.set(label, (m.get(label) ?? 0) + amt)
    }
    const entries = [...m.entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([label, value], i) => ({
      label,
      value:
        convertCurrency(value, BASE_CURRENCY, currency).converted ??
        value,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
  }, [allocationRows, currency])

  const allocatedTotal = useMemo(() => {
    return resourcesFunded.reduce((sum, d) => sum + d.value, 0)
  }, [resourcesFunded])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Donations</h1>
      <div className="mt-8 max-w-3xl space-y-6 text-[var(--wt-text)] leading-relaxed">
        <p>
          Watchtower Sanctuary is a 501(c)(3) (EIN {ORG.ein}) organization that focuses on safety and healing for
          children-survivors of sexual abuse and sex trafficking.
        </p>
        <p>
          Your donation will change the course of a child&apos;s life. The holistic healing provided to the children of
          Watchtower Sanctuary is only possible with your financial help.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--wt-text-2)]">
          <li>$15 a month will provide essential vitamins for a child</li>
          <li>$50 a month will feed a child</li>
          <li>$100 a month will cover medical, dental, and educational needs for a child</li>
          <li>$300 a month will employ a professional caregiver to care for many children</li>
          <li>$1,500 a month will pay for the mortgage that provides refuge for all of the children</li>
        </ul>
        <p>
          The total monthly expenses of Watchtower Sanctuary are nearly $11,000, and every penny is spent in providing refuge,
          rehabilitation, and reintegration services for children-survivors of sexual exploitation. Thank you for making this
          world a brighter place by helping to support the children of Watchtower Sanctuary!
        </p>
      </div>

      <section className="mt-14 rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-[var(--wt-text)]">Where your support goes</h2>
        <p className="mt-3 text-sm text-[var(--wt-text-2)] leading-relaxed max-w-3xl">
          We publish how donations are allocated across program areas so supporters can see how funds support shelter
          operations, care, education, and reintegration. The chart below shows recorded allocations from our internal
          database. Amounts are shown in your selected display currency using static exchange rates; the underlying
          records are maintained in {BASE_CURRENCY}. If no allocation data is available yet, check back after our team
          updates the records.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Display currency</span>
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
        </div>
        <div className="mt-8 flex justify-center">
          {!isSupabaseConfigured ? (
            <p className="text-sm text-[var(--wt-text-2)]">Connect Supabase to load allocation data.</p>
          ) : allocationsLoading ? (
            <div className="flex items-center gap-3 py-10 text-sm text-[var(--wt-text-2)]">
              <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
              Loading allocation breakdown…
            </div>
          ) : allocationsError ? (
            <p className="text-sm text-[#dc2626] max-w-md text-center">{allocationsError}</p>
          ) : resourcesFunded.length === 0 ? (
            <p className="text-sm text-[var(--wt-text-2)] text-center max-w-md">
              No allocation records are available to display yet. When staff enter allocation data, this chart will
              reflect how funds are distributed across program areas.
            </p>
          ) : (
            <AllocationDonutChart
              title="Donation allocation by program area"
              centerLabel={allocatedTotal > 0 ? formatMoney(currency, allocatedTotal) : '—'}
              centerSubtext="ALLOCATED (TOTAL)"
              data={resourcesFunded}
              currency={currency}
            />
          )}
        </div>
      </section>

      <div className="mt-12 max-w-xl mx-auto">
        <RecordedDonationForm />
      </div>
    </div>
  )
}
