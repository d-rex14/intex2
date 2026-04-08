import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  FileText,
  HeartHandshake,
  Home,
  Shield,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isStaffLike, ROLE_IDS } from '../../lib/roles'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type SafehouseRow = {
  safehouse_id: number
  name: string | null
  status: string | null
  current_occupancy: number | null
  capacity_girls: number | null
}

type DashboardData = {
  activeResidentsCount: number | null
  recentDonationsCount30d: number | null
  recentDonationValue30d: number | null
  processRecordingsCount7d: number | null
  openIncidentsCount: number | null
  openPlansCount: number | null
  safehouses: SafehouseRow[]
  socialPostsCount30d: number | null
  socialAvgEngagementRate30d: number | null
}

function daysAgoISO(days: number): string {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - days)
  return now.toISOString().slice(0, 10)
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-[var(--wt-text)] tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-xs text-[var(--wt-text-2)]">{hint}</div>}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] flex items-center justify-center text-[var(--wt-accent)]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--wt-text-2)] mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

async function fetchDashboardData(): Promise<{ data: DashboardData | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }

  const d30 = daysAgoISO(30)
  const d7 = daysAgoISO(7)

  try {
    const [activeResidents, donations30d, process7d, incidentsOpen, plansOpen, safehouses, social30d] =
      await Promise.all([
        supabase.from('residents').select('resident_id', { count: 'exact', head: true }).eq('case_status', 'Active'),
        supabase
          .from('donations')
          .select('donation_type, amount, estimated_value, donation_date')
          .gte('donation_date', d30)
          .limit(2000),
        supabase
          .from('process_recordings')
          .select('recording_id', { count: 'exact', head: true })
          .gte('session_date', d7),
        supabase.from('incident_reports').select('incident_id', { count: 'exact', head: true }).eq('resolved', false),
        supabase
          .from('intervention_plans')
          .select('plan_id', { count: 'exact', head: true })
          .in('status', ['Open', 'In Progress']),
        supabase
          .from('safehouses')
          .select('safehouse_id, name, status, current_occupancy, capacity_girls')
          .order('safehouse_id')
          .limit(50),
        supabase
          .from('social_media_posts')
          .select('engagement_rate, created_at')
          .gte('created_at', `${d30}T00:00:00Z`)
          .limit(5000),
      ])

    if (activeResidents.error) throw activeResidents.error
    if (donations30d.error) throw donations30d.error
    if (process7d.error) throw process7d.error
    if (incidentsOpen.error) throw incidentsOpen.error
    if (plansOpen.error) throw plansOpen.error
    if (safehouses.error) throw safehouses.error
    if (social30d.error) throw social30d.error

    const donationRows = (donations30d.data ?? []) as {
      donation_type: string | null
      amount: number | null
      estimated_value: number | null
      donation_date: string | null
    }[]

    const monetary = donationRows.filter((r) => (r.donation_type ?? '').trim() === 'Monetary')
    const recentDonationsCount30d = monetary.length
    const recentDonationValue30d = monetary.reduce((sum, r) => {
      const v = r.amount ?? r.estimated_value
      const n = Number(v ?? 0)
      return Number.isFinite(n) ? sum + n : sum
    }, 0)

    const socialRows = (social30d.data ?? []) as { engagement_rate: number | null }[]
    const socialPostsCount30d = socialRows.length
    const socialAvgEngagementRate30d =
      socialRows.length === 0
        ? null
        : socialRows.reduce((sum, r) => sum + Number(r.engagement_rate ?? 0), 0) / socialRows.length

    const payload: DashboardData = {
      activeResidentsCount: activeResidents.count ?? null,
      recentDonationsCount30d,
      recentDonationValue30d,
      processRecordingsCount7d: process7d.count ?? null,
      openIncidentsCount: incidentsOpen.count ?? null,
      openPlansCount: plansOpen.count ?? null,
      safehouses: ((safehouses.data ?? []) as SafehouseRow[]) ?? [],
      socialPostsCount30d,
      socialAvgEngagementRate30d,
    }

    return { data: payload, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load dashboard.'
    return { data: null, error: { message: msg } }
  }
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function formatMoneyPHP(n: number | null | undefined): string {
  if (n == null) return '—'
  return `PHP ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function DashboardPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)
  const isSocialRep =
    effectiveRoleIds.includes(ROLE_IDS.SOCIAL_MEDIA_REP) || effectiveRoleIds.includes(ROLE_IDS.ADMIN) || staff
  const isDonor = effectiveRoleIds.includes(ROLE_IDS.DONOR)

  const queryFn = useMemo(() => () => fetchDashboardData(), [])
  const { data, loading, error, refetch } = useSupabaseQuery<DashboardData>(queryFn)

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-2">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>{' '}
          to load live portal data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Dashboard</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">Your operational overview and next actions.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="shrink-0 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#dc2626]/40 bg-[#dc2626]/10 px-4 py-2 text-sm text-[#dc2626] flex justify-between gap-4 items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={<HeartHandshake size={18} />}
          label="Monetary donations (last 30 days)"
          value={loading ? '…' : formatNumber(data?.recentDonationsCount30d ?? null)}
          hint="Count of monetary gifts recorded."
        />
        <StatCard
          icon={<Shield size={18} />}
          label="Monetary value (last 30 days)"
          value={loading ? '…' : formatMoneyPHP(data?.recentDonationValue30d ?? null)}
          hint="Assumes amounts stored in PHP."
        />
        <StatCard
          icon={<Users size={18} />}
          label="Active residents"
          value={loading ? '…' : formatNumber(staff ? data?.activeResidentsCount : null)}
          hint={staff ? 'Current active caseload across all safehouses.' : 'Staff-only metric.'}
        />
        <StatCard
          icon={<FileText size={18} />}
          label="Process recordings (last 7 days)"
          value={loading ? '…' : formatNumber(staff ? data?.processRecordingsCount7d : null)}
          hint={staff ? 'Recent counseling documentation activity.' : 'Staff-only metric.'}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Open incidents"
          value={loading ? '…' : formatNumber(staff ? data?.openIncidentsCount : null)}
          hint={staff ? 'Unresolved incident reports.' : 'Staff-only metric.'}
        />
        <StatCard
          icon={<CalendarClock size={18} />}
          label="Open plans"
          value={loading ? '…' : formatNumber(staff ? data?.openPlansCount : null)}
          hint={staff ? 'Intervention plans in progress.' : 'Staff-only metric.'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="Quick actions" subtitle="Jump to your most-used tools.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/portal/your-donations"
              className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] flex items-center justify-center text-[var(--wt-accent)]">
                  <HeartHandshake size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--wt-text)]">Your donations</div>
                  <div className="text-xs text-[var(--wt-text-2)]">View your giving history and allocation.</div>
                </div>
              </div>
            </Link>

            <Link
              to="/portal/donors"
              className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] flex items-center justify-center text-[var(--wt-accent)]">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--wt-text)]">Donations and allocations</div>
                  <div className="text-xs text-[var(--wt-text-2)]">
                    {isDonor ? 'Explore giving and impact summaries.' : 'Manage donation records.'}
                  </div>
                </div>
              </div>
            </Link>

            {staff && (
              <Link
                to="/portal/caseload"
                className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] flex items-center justify-center text-[var(--wt-accent)]">
                    <Shield size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--wt-text)]">Caseload inventory</div>
                    <div className="text-xs text-[var(--wt-text-2)]">Review resident status and risk indicators.</div>
                  </div>
                </div>
              </Link>
            )}

            {isSocialRep && (
              <Link
                to="/portal/reports"
                className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] flex items-center justify-center text-[var(--wt-accent)]">
                    <BarChart3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--wt-text)]">Reports & analytics</div>
                    <div className="text-xs text-[var(--wt-text-2)]">Model outputs and trend summaries.</div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--wt-text-2)]">
            <Home size={14} />
            <span>
              Need public-facing impact? Go to{' '}
              <Link to="/donations" className="text-[var(--wt-text)] hover:underline">
                donations
              </Link>
              .
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Safehouse occupancy" subtitle="Current occupancy vs capacity (girls).">
          {loading ? (
            <div className="flex items-center gap-3 py-8 justify-center text-sm text-[var(--wt-text-2)]">
              <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          ) : !staff ? (
            <p className="text-sm text-[var(--wt-text-2)]">Staff-only metric.</p>
          ) : (data?.safehouses ?? []).length === 0 ? (
            <p className="text-sm text-[var(--wt-text-2)]">No safehouses returned.</p>
          ) : (
            <div className="space-y-3">
              {(data?.safehouses ?? []).map((s) => {
                const occ = Number(s.current_occupancy ?? 0)
                const cap = Number(s.capacity_girls ?? 0)
                const pct = cap > 0 ? Math.min(1, occ / cap) : 0
                return (
                  <div key={s.safehouse_id} className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--wt-text)] truncate" title={s.name ?? undefined}>
                          {s.name ?? `Safehouse #${s.safehouse_id}`}
                        </div>
                        <div className="text-xs text-[var(--wt-text-2)] mt-0.5">{s.status ?? '—'}</div>
                      </div>
                      <div className="text-sm text-[var(--wt-text)] tabular-nums">
                        {formatNumber(occ)} / {formatNumber(cap)}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[var(--wt-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--wt-accent)]"
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {isSocialRep && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={<BarChart3 size={18} />}
            label="Social posts (last 30 days)"
            value={loading ? '…' : formatNumber(data?.socialPostsCount30d ?? null)}
            hint="Based on social_media_posts.created_at."
          />
          <StatCard
            icon={<BarChart3 size={18} />}
            label="Avg engagement rate (last 30 days)"
            value={loading ? '…' : formatPct(data?.socialAvgEngagementRate30d ?? null)}
            hint="Mean of social_media_posts.engagement_rate."
          />
        </div>
      )}
    </div>
  )
}

