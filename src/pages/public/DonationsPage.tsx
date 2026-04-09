import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { ORG } from '../../content/org'
import { RecordedDonationForm } from '../../components/RecordedDonationForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { BASE_CURRENCY } from '../../lib/fxRates'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type AllocationRow = {
  program_area: string | null
  amount_allocated: number | null
}

const DONUT_COLORS = ['#475569', '#c59a54', '#6b7280', '#c2b89c', '#f59e0b', '#94a3b8'] as const

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
  centerTitle,
  data,
}: {
  title: string
  /** Single label in the donut hole (e.g. "Fund Distribution"). */
  centerTitle: string
  data: { label: string; value: number; color: string }[]
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
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--wt-text)]"
          style={{ fontSize: 14, fontWeight: 750 }}
        >
          {centerTitle.trim() || '—'}
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
          <div className="text-[var(--wt-text-2)] mt-0.5 tabular-nums">{(hover.frac * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  )
}

export function DonationsPage() {
  const [donateOpen, setDonateOpen] = useState(false)

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
      value,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
  }, [allocationRows])

  const allocatedTotal = useMemo(() => resourcesFunded.reduce((sum, d) => sum + d.value, 0), [resourcesFunded])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Donations</h1>
        <button
          type="button"
          onClick={() => setDonateOpen(true)}
          className="shrink-0 rounded-lg bg-[var(--wt-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors w-full sm:w-auto"
        >
          Make a Donation
        </button>
      </div>
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
          The chart shows the percentage share of recorded allocations by program area (internal records in {BASE_CURRENCY}).
          Hover a ring segment to see its share of the total. This view is for transparency only and does not display dollar
          amounts. If no data appears yet, our team may still be updating allocation records.
        </p>
        <div className="mt-8">
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
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
              <AllocationDonutChart
                title="Donation allocation by program area"
                centerTitle="Fund Distribution"
                data={resourcesFunded}
              />
              <div className="w-full max-w-sm rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--wt-text-2)]">
                  Chart key
                </h3>
                <p className="mt-2 text-xs text-[var(--wt-text-2)] leading-relaxed">
                  Each color is a <span className="text-[var(--wt-text)]">program area</span> (for example shelter care,
                  education, or outreach). Percentages are shares of the total allocations shown in this chart—not your
                  personal donation breakdown.
                </p>
                <ul className="mt-4 space-y-2.5" aria-label="Program area legend">
                  {resourcesFunded.map((item) => {
                    const pct = allocatedTotal > 0 ? (item.value / allocatedTotal) * 100 : 0
                    return (
                      <li key={item.label} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm border border-[color-mix(in_srgb,var(--wt-border)_70%,transparent)]"
                          style={{ backgroundColor: item.color }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 font-medium text-[var(--wt-text)]">{item.label}</span>
                        <span className="shrink-0 tabular-nums text-[var(--wt-text-2)]">{pct.toFixed(1)}%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {donateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={() => setDonateOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] shadow-xl overflow-hidden"
            role="dialog"
            aria-labelledby="donation-form-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--wt-border)] bg-[var(--wt-bg)] px-5 py-4">
              <h2 id="donation-form-title" className="font-display text-lg font-bold text-[var(--wt-text)]">
                Make a donation
              </h2>
              <button
                type="button"
                onClick={() => setDonateOpen(false)}
                className="rounded-lg border border-[var(--wt-border)] p-2 text-[var(--wt-text-2)] hover:text-[var(--wt-text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <RecordedDonationForm />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
