import { useMemo } from 'react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type Resident = {
  resident_id: number
  case_status: string | null
  safehouse_id: number | null
  reintegration_status: string | null
}

type SupporterEmbed = {
  display_name: string | null
  organization_name: string | null
  first_name: string | null
  last_name: string | null
} | null

type DonationRow = {
  donation_id: number
  donation_type: string | null
  donation_date: string | null
  currency_code: string | null
  amount: number | null
  estimated_value: number | null
  supporters: SupporterEmbed | SupporterEmbed[] | null
}

type InterventionPlan = {
  plan_id: number
  resident_id: number | null
  plan_category: string | null
  status: string | null
  case_conference_date: string | null
}

type ProcessRecording = {
  recording_id: number
  resident_id: number | null
  session_date: string | null
  progress_noted: boolean | null
  concerns_flagged: boolean | null
}

function supporterName(s: SupporterEmbed | SupporterEmbed[] | null): string {
  const one = Array.isArray(s) ? (s[0] ?? null) : s
  if (!one) return 'Unknown donor'
  if (one.display_name?.trim()) return one.display_name.trim()
  if (one.organization_name?.trim()) return one.organization_name.trim()
  const full = [one.first_name, one.last_name].filter(Boolean).join(' ').trim()
  return full || 'Unknown donor'
}

function parseISO(d: string | null | undefined): number | null {
  const s = (d ?? '').slice(0, 10)
  if (!s) return null
  const t = Date.parse(`${s}T00:00:00Z`)
  return Number.isFinite(t) ? t : null
}

function fmtDate(d: string | null | undefined): string {
  const t = parseISO(d)
  if (t == null) return '—'
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
}

function kpiCard(label: string, value: string, sub?: string) {
  return (
    <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
      <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{label}</div>
      <div className="mt-2 text-2xl font-bold text-[var(--wt-text)] tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-[var(--wt-text-2)]">{sub}</div> : null}
    </div>
  )
}

async function fetchResidents(): Promise<{ data: Resident[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('residents')
    .select('resident_id, case_status, safehouse_id, reintegration_status')
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as Resident[], error: null }
}

async function fetchRecentDonations(): Promise<{ data: DonationRow[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('donations')
    .select(`
      donation_id,
      donation_type,
      donation_date,
      currency_code,
      amount,
      estimated_value,
      supporters ( display_name, organization_name, first_name, last_name )
    `)
    .order('donation_date', { ascending: false })
    .limit(8)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as DonationRow[], error: null }
}

async function fetchInterventionPlans(): Promise<{ data: InterventionPlan[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('intervention_plans')
    .select('plan_id, resident_id, plan_category, status, case_conference_date')
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as InterventionPlan[], error: null }
}

async function fetchProcessRecordings(): Promise<{ data: ProcessRecording[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('process_recordings')
    .select('recording_id, resident_id, session_date, progress_noted, concerns_flagged')
    .order('session_date', { ascending: false })
    .limit(1500)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ProcessRecording[], error: null }
}

export function DashboardPage() {
  const residentsQ = useMemo(() => () => fetchResidents(), [])
  const donationsQ = useMemo(() => () => fetchRecentDonations(), [])
  const plansQ = useMemo(() => () => fetchInterventionPlans(), [])
  const recordingsQ = useMemo(() => () => fetchProcessRecordings(), [])

  const { data: residents, loading: residentsLoading, error: residentsError } = useSupabaseQuery(residentsQ)
  const { data: donations, loading: donationsLoading, error: donationsError } = useSupabaseQuery(donationsQ)
  const { data: plans, loading: plansLoading, error: plansError } = useSupabaseQuery(plansQ)
  const { data: recordings, loading: recordingsLoading, error: recordingsError } = useSupabaseQuery(recordingsQ)

  const activeResidents = useMemo(
    () => (residents ?? []).filter(r => (r.case_status ?? '').toLowerCase() === 'active'),
    [residents],
  )

  const activeBySafehouse = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of activeResidents) {
      const key = r.safehouse_id == null ? 'Unassigned' : `Safehouse #${r.safehouse_id}`
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [activeResidents])

  const upcomingConferences = useMemo(() => {
    const now = Date.now()
    return (plans ?? [])
      .filter(p => {
        const t = parseISO(p.case_conference_date)
        return t != null && t >= now
      })
      .sort((a, b) => (parseISO(a.case_conference_date) ?? 0) - (parseISO(b.case_conference_date) ?? 0))
      .slice(0, 8)
  }, [plans])

  const progressSummary = useMemo(() => {
    const rows = recordings ?? []
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recent = rows.filter(r => {
      const t = parseISO(r.session_date)
      return t != null && t >= cutoff
    })
    const progressNoted = recent.filter(r => Boolean(r.progress_noted)).length
    const concernsFlagged = recent.filter(r => Boolean(r.concerns_flagged)).length
    return { sessions: recent.length, progressNoted, concernsFlagged }
  }, [recordings])

  const anyLoading = residentsLoading || donationsLoading || plansLoading || recordingsLoading
  const firstError = residentsError || donationsError || plansError || recordingsError

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load dashboard metrics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Dashboard</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-1">Daily command center for resident care, giving activity, and case planning.</p>
      </div>

      {anyLoading ? (
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <div className="flex items-center gap-3 text-sm text-[var(--wt-text-2)]">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading dashboard metrics…
          </div>
        </div>
      ) : firstError ? (
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <p className="text-sm text-[#dc2626]">{firstError}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {kpiCard('Active residents', String(activeResidents.length), 'Current active caseload')}
            {kpiCard('Upcoming conferences', String(upcomingConferences.length), 'Scheduled from intervention plans')}
            {kpiCard('Sessions (30d)', String(progressSummary.sessions), 'Process recordings in last 30 days')}
            {kpiCard('Progress noted (30d)', String(progressSummary.progressNoted), `${progressSummary.concernsFlagged} concerns flagged`)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Active Residents by Safehouse</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                      <th className="px-4 py-3 font-medium">Safehouse</th>
                      <th className="px-4 py-3 font-medium text-right">Active residents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBySafehouse.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-[var(--wt-text-2)]">No active residents found.</td></tr>
                    ) : (
                      activeBySafehouse.map(([name, count]) => (
                        <tr key={name} className="border-b border-[var(--wt-border)] last:border-0">
                          <td className="px-4 py-3 text-[var(--wt-text)]">{name}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--wt-text)] font-semibold">{count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Upcoming Case Conferences</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Resident</th>
                      <th className="px-4 py-3 font-medium">Plan category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingConferences.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-[var(--wt-text-2)]">No upcoming conferences.</td></tr>
                    ) : (
                      upcomingConferences.map(p => (
                        <tr key={p.plan_id} className="border-b border-[var(--wt-border)] last:border-0">
                          <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{fmtDate(p.case_conference_date)}</td>
                          <td className="px-4 py-3 text-[var(--wt-text)]">{p.resident_id != null ? `Resident #${p.resident_id}` : '—'}</td>
                          <td className="px-4 py-3 text-[var(--wt-text-2)]">{p.plan_category ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Recent Donations</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Donor</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Amount / Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(donations ?? []).length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--wt-text-2)]">No donations found.</td></tr>
                  ) : (
                    (donations ?? []).map(d => {
                      const val = d.amount ?? d.estimated_value
                      const cur = (d.currency_code ?? '').trim().toUpperCase()
                      return (
                        <tr key={d.donation_id} className="border-b border-[var(--wt-border)] last:border-0">
                          <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{fmtDate(d.donation_date)}</td>
                          <td className="px-4 py-3 text-[var(--wt-text)]">{supporterName(d.supporters)}</td>
                          <td className="px-4 py-3 text-[var(--wt-text-2)]">{d.donation_type ?? '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--wt-text)]">
                            {val == null
                              ? '—'
                              : cur
                              ? `${cur} ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

