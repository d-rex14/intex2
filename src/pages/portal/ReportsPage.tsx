import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { bandNeutralCls, bandPositiveBarCls, bandPositiveCls, bandWarningCls } from '../../lib/mlBandStyles'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { isStaffLike, ROLE_IDS } from '../../lib/roles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SafehouseScore = {
  safehouse_id: number
  safehouse_name: string | null
  value_add_coef: number | null
  avg_outcome_change: number | null
  resident_count: number | null
  model_version: string
  scored_at: string
}

type SocialPost = {
  platform: string | null
  post_type: string | null
  engagement_rate: number | null
  donation_referrals: number | null
}

type StrategyRow = {
  platform: string
  contentType: string
  avgEngagement: number
  avgReferrals: number
}

type UpgradeBandSummary = { band: string; count: number; avg_score: number }

type StallRiskBandSummary = { band: string; count: number }

type SocialMLScore = {
  platform: string | null
  content_type: string | null
  predicted_engagement_rate: number | null
  predicted_donation_referrals: number | null
  recommendation: string | null
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------
async function fetchSafehouseScores(): Promise<{ data: SafehouseScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('safehouse_ml_scores')
    .select('*')
    .order('value_add_coef', { ascending: false })
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SafehouseScore[], error: null }
}

async function fetchSocialStrategyData(): Promise<{ data: SocialPost[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('social_media_posts')
    .select('platform, post_type, engagement_rate, donation_referrals')
    .limit(2000)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SocialPost[], error: null }
}

async function fetchUpgradeBands(): Promise<{ data: UpgradeBandSummary[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('donor_upgrade_scores')
    .select('band, score')
  if (error) return { data: null, error: { message: error.message } }
  const rows = (data ?? []) as { band: string; score: number }[]
  const grouped = new Map<string, { total: number; count: number }>()
  for (const r of rows) {
    const prev = grouped.get(r.band) ?? { total: 0, count: 0 }
    grouped.set(r.band, { total: prev.total + r.score, count: prev.count + 1 })
  }
  const summary: UpgradeBandSummary[] = ['High', 'Medium', 'Low']
    .filter(b => grouped.has(b))
    .map(b => {
      const g = grouped.get(b)!
      return { band: b, count: g.count, avg_score: g.total / g.count }
    })
  return { data: summary, error: null }
}

async function fetchStallRiskBands(): Promise<{ data: StallRiskBandSummary[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('resident_ml_scores')
    .select('stall_risk_band')
    .not('stall_risk_band', 'is', null)
  if (error) return { data: null, error: { message: error.message } }
  const rows = (data ?? []) as { stall_risk_band: string }[]
  const counts = new Map<string, number>()
  for (const r of rows) {
    counts.set(r.stall_risk_band, (counts.get(r.stall_risk_band) ?? 0) + 1)
  }
  const summary: StallRiskBandSummary[] = ['High', 'Medium', 'Low']
    .filter(b => counts.has(b))
    .map(b => ({ band: b, count: counts.get(b)! }))
  return { data: summary, error: null }
}

async function fetchSocialMLScores(): Promise<{ data: SocialMLScore[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('social_media_ml_scores')
    .select('platform, content_type, predicted_engagement_rate, predicted_donation_referrals, recommendation')
    .order('predicted_engagement_rate', { ascending: false })
    .limit(10)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SocialMLScore[], error: null }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function Spinner() {
  return (
    <div className="flex items-center gap-3 py-8 justify-center text-sm text-[var(--wt-text-2)]">
      <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
      Loading…
    </div>
  )
}

function NoData({ message }: { message: string }) {
  return <p className="text-sm text-[var(--wt-text-2)] py-4 text-center">{message}</p>
}

function BandPill({ band, type }: { band: string; type: 'upgrade' | 'churn' | 'neutral' }) {
  const colors: Record<string, string> =
    type === 'churn'
      ? { High: bandWarningCls, Medium: bandNeutralCls, Low: bandPositiveCls }
      : { High: bandPositiveCls, Medium: bandNeutralCls, Low: bandNeutralCls }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[band] ?? bandNeutralCls}`}
    >
      {band}
    </span>
  )
}

// Horizontal bar chart for upgrade band distribution
function BandBarChart({ data }: { data: UpgradeBandSummary[] }) {
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div className="space-y-3 mt-2">
      {data.map(d => (
        <div key={d.band} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3">
          <BandPill band={d.band} type="upgrade" />
            <div className="h-3 rounded-full bg-[var(--wt-border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${bandPositiveBarCls}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-[var(--wt-text-2)] text-right">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function formatSafehouseName(name: string | null, id: number) {
  const raw = name ?? `Safehouse ${id}`
  return raw.replace(/^(Watchtower|Lighthouse)\s+/i, '')
}

function SafehouseBar({ data }: { data: SafehouseScore[] }) {
  const vals = data.map(d => d.value_add_coef ?? 0)
  const absMax = Math.max(0.01, ...vals.map(Math.abs))
  return (
    <div className="mt-2 space-y-1.5">
      {/* Axis labels */}
      <div className="grid grid-cols-[9rem_1fr_3.5rem] items-end gap-3 mb-2">
        <span />
        <div className="relative flex justify-between text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">
          <span>← Below avg</span>
          <span>0</span>
          <span>Above avg →</span>
        </div>
        <span />
      </div>
      {data.map(d => {
        const v = d.value_add_coef ?? 0
        const pct = (Math.abs(v) / absMax) * 50
        const positive = v >= 0
        const label = formatSafehouseName(d.safehouse_name, d.safehouse_id)
        const fullName = d.safehouse_name ?? `Safehouse ${d.safehouse_id}`
        return (
          <div key={d.safehouse_id} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-3">
            <span
              className="text-sm text-[var(--wt-text)] truncate text-right"
              title={fullName}
            >
              {label}
            </span>
            <div className="relative h-5 rounded bg-[var(--wt-border)]/20">
              <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--wt-text-2)]/30" />
              <div
                className={`absolute top-0.5 bottom-0.5 rounded-sm transition-all ${
                  positive ? 'bg-emerald-500/80' : 'bg-red-500/70'
                }`}
                style={
                  positive
                    ? { left: '50%', width: `${pct}%` }
                    : { right: '50%', width: `${pct}%` }
                }
              />
            </div>
            <span
              className={`text-xs tabular-nums text-right font-medium ${
                positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {v > 0 ? '+' : ''}
              {v.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const PLATFORM_COLOR: Record<string, string> = {
  Instagram: '#e1306c',
  TikTok: '#69c9d0',
  Facebook: '#1877f2',
  Twitter: '#1da1f2',
}

// Horizontal bar chart showing top platform × content-type combos by avg engagement
function SocialStrategyChart({ data }: { data: StrategyRow[] }) {
  const max = Math.max(0.001, ...data.map(d => d.avgEngagement))
  return (
    <div className="space-y-3 mt-2">
      {/* Column headers */}
      <div className="grid grid-cols-[7rem_6rem_1fr_4.5rem_4rem] gap-2 text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] pb-1 border-b border-[var(--wt-border)]">
        <span>Platform</span>
        <span>Content type</span>
        <span></span>
        <span className="text-right">Eng. rate</span>
        <span className="text-right">Avg refs</span>
      </div>
      {data.map((d, i) => (
        <div key={i} className="grid grid-cols-[7rem_6rem_1fr_4.5rem_4rem] items-center gap-2">
          <span
            className="text-xs font-semibold truncate"
            style={{ color: PLATFORM_COLOR[d.platform] ?? '#f59e0b' }}
          >
            {d.platform}
          </span>
          <span className="text-xs text-[var(--wt-text-2)] truncate">{d.contentType ?? '—'}</span>
          <div className="h-3 rounded-full bg-[var(--wt-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.avgEngagement / max) * 100}%`,
                backgroundColor: PLATFORM_COLOR[d.platform] ?? '#f59e0b',
              }}
            />
          </div>
          <span className="text-xs tabular-nums text-right font-semibold text-[var(--wt-accent)]">
            {(d.avgEngagement * 100).toFixed(1)}%
          </span>
          <span className="text-xs tabular-nums text-right text-[var(--wt-text-2)]">
            {d.avgReferrals.toFixed(0)}
          </span>
        </div>
      ))}
      {/* Platform legend */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[var(--wt-border)]">
        {Object.entries(PLATFORM_COLOR).map(([p, c]) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[11px] text-[var(--wt-text-2)]">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StallRiskBarChart({ data }: { data: StallRiskBandSummary[] }) {
  const max = Math.max(1, ...data.map(d => d.count))
  const barCls: Record<string, string> = {
    High: 'bg-red-500/80',
    Medium: 'bg-zinc-400/70',
    Low: 'bg-emerald-500/80',
  }
  return (
    <div className="space-y-3 mt-2">
      {data.map(d => (
        <div key={d.band} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3">
          <BandPill band={d.band} type="churn" />
          <div className="h-3 rounded-full bg-[var(--wt-border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barCls[d.band] ?? 'bg-zinc-400/70'}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-[var(--wt-text-2)] text-right">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function SocialMLTable({ data }: { data: SocialMLScore[] }) {
  const max = Math.max(0.001, ...data.map(d => d.predicted_engagement_rate ?? 0))
  return (
    <div className="space-y-3 mt-2">
      <div className="grid grid-cols-[6rem_6rem_1fr_4.5rem_4rem] gap-2 text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] pb-1 border-b border-[var(--wt-border)]">
        <span>Platform</span>
        <span>Content type</span>
        <span>Pred. engagement</span>
        <span className="text-right">Eng. rate</span>
        <span className="text-right">Pred. refs</span>
      </div>
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="grid grid-cols-[6rem_6rem_1fr_4.5rem_4rem] items-center gap-2">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: PLATFORM_COLOR[d.platform ?? ''] ?? '#f59e0b' }}
            >
              {d.platform ?? '—'}
            </span>
            <span className="text-xs text-[var(--wt-text-2)] truncate">{d.content_type ?? '—'}</span>
            <div className="h-3 rounded-full bg-[var(--wt-border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((d.predicted_engagement_rate ?? 0) / max) * 100}%`,
                  backgroundColor: PLATFORM_COLOR[d.platform ?? ''] ?? '#f59e0b',
                }}
              />
            </div>
            <span className="text-xs tabular-nums text-right font-semibold text-[var(--wt-accent)]">
              {((d.predicted_engagement_rate ?? 0) * 100).toFixed(1)}%
            </span>
            <span className="text-xs tabular-nums text-right text-[var(--wt-text-2)]">
              {(d.predicted_donation_referrals ?? 0).toFixed(0)}
            </span>
          </div>
          {d.recommendation && (
            <p className="text-[10px] text-[var(--wt-text-2)] pl-0 leading-relaxed col-span-full">
              <span className="text-[var(--wt-accent)] font-semibold">Tip:</span> {d.recommendation}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function ReportsPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)
  const isSocialRep = effectiveRoleIds.includes(ROLE_IDS.SOCIAL_MEDIA_REP) || effectiveRoleIds.includes(ROLE_IDS.ADMIN) || staff

  const safehouseQFn = useMemo(() => () => fetchSafehouseScores(), [])
  const { data: safehouseScores, loading: safehouseLoading } = useSupabaseQuery(safehouseQFn)

  const socialQFn = useMemo(() => () => fetchSocialStrategyData(), [])
  const { data: socialPosts, loading: socialLoading } = useSupabaseQuery(socialQFn)

  const upgradeQFn = useMemo(() => () => fetchUpgradeBands(), [])
  const { data: upgradeBands, loading: upgradeLoading } = useSupabaseQuery(upgradeQFn)

  const stallQFn = useMemo(() => () => fetchStallRiskBands(), [])
  const { data: stallBands, loading: stallLoading } = useSupabaseQuery(stallQFn)

  const socialMLQFn = useMemo(() => () => fetchSocialMLScores(), [])
  const { data: socialMLScores, loading: socialMLLoading } = useSupabaseQuery(socialMLQFn)

  // Aggregate social posts into ranked platform × content-type combos
  const strategyData = useMemo<StrategyRow[]>(() => {
    if (!socialPosts || socialPosts.length === 0) return []
    const map = new Map<string, { engSum: number; refSum: number; count: number }>()
    for (const r of socialPosts) {
      const key = `${r.platform ?? 'Unknown'}|${r.post_type ?? 'Unknown'}`
      const prev = map.get(key) ?? { engSum: 0, refSum: 0, count: 0 }
      map.set(key, {
        engSum: prev.engSum + (r.engagement_rate ?? 0),
        refSum: prev.refSum + (r.donation_referrals ?? 0),
        count: prev.count + 1,
      })
    }
    return Array.from(map.entries())
      .map(([key, v]) => {
        const [platform, contentType] = key.split('|')
        return { platform, contentType, avgEngagement: v.engSum / v.count, avgReferrals: v.refSum / v.count }
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10)
  }, [socialPosts])

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load reports.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Reports &amp; Analytics</h1>
        <p className="text-sm text-[var(--wt-text-2)] mt-1">
          Aggregated insights and ML model outputs to support decision-making.
        </p>
      </div>

      {/* Donor upgrade band distribution */}
      <SectionCard
        title="Donor Upgrade Opportunity — Band Distribution"
        subtitle="How many donors fall into each upgrade-likelihood band. Source: 04_donor_upgrade_predictor pipeline."
      >
        {upgradeLoading ? (
          <Spinner />
        ) : (upgradeBands ?? []).length === 0 ? (
          <NoData message="No upgrade scores yet. Run the donor_upgrade_predictor notebook and export to donor_upgrade_scores." />
        ) : (
          <>
            <BandBarChart data={upgradeBands!} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {upgradeBands!.map(d => (
                <div key={d.band} className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">{d.band} band</div>
                  <div className="text-xl font-bold text-[var(--wt-text)] tabular-nums">{d.count}</div>
                  <div className="text-xs text-[var(--wt-text-2)]">avg {(d.avg_score * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* Safehouse value-add */}
      {staff && (
        <SectionCard
          title="Safehouse Value-Add Analysis"
          subtitle="Case-mix-adjusted performance coefficients per safehouse. Positive = above-average outcomes after controlling for intake difficulty. Source: 03_safehouse_value_add pipeline."
        >
          {safehouseLoading ? (
            <Spinner />
          ) : (safehouseScores ?? []).length === 0 ? (
            <NoData message="No safehouse scores yet. Run the safehouse_value_add notebook and export to safehouse_ml_scores." />
          ) : (
            <>
              <SafehouseBar data={safehouseScores!} />
              <p className="mt-3 text-xs text-[var(--wt-text-2)]">
                Coefficients are from an OLS regression controlling for case category, intake severity, and resident count.
                Observe directional patterns, not causal attribution. Model v{safehouseScores![0].model_version} ·{' '}
                {safehouseScores![0].scored_at.slice(0, 10)}.
              </p>
            </>
          )}
        </SectionCard>
      )}

      {/* Clinical efficacy — health stall risk distribution */}
      {staff && (
        <SectionCard
          title="Clinical Efficacy — Health Stall Risk"
          subtitle="Distribution of residents by predicted health-stall risk band. Source: 01_clinical_efficacy pipeline. High = flag for care plan review."
        >
          {stallLoading ? (
            <Spinner />
          ) : (stallBands ?? []).length === 0 ? (
            <NoData message="No stall risk scores yet. Run the clinical_efficacy_pipeline notebook and export stall_risk_band to resident_ml_scores." />
          ) : (
            <>
              <StallRiskBarChart data={stallBands!} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {stallBands!.map(d => (
                  <div key={d.band} className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-3 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">{d.band} risk</div>
                    <div className="text-xl font-bold text-[var(--wt-text)] tabular-nums">{d.count}</div>
                    <div className="text-xs text-[var(--wt-text-2)]">residents</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--wt-text-2)]">
                Model precision for stall detection is exploratory (baseline recall ≈ 11%). Use as a conversation-starter
                in supervision and case review—not as a standalone clinical trigger.
              </p>
            </>
          )}
        </SectionCard>
      )}

      {/* Social media strategy performance chart */}
      {isSocialRep && (
        <SectionCard
          title="Social Media Strategy Performance"
          subtitle="Average engagement rate by platform and content type, ranked from actual post data. Use the highest bars to guide your next post."
        >
          {socialLoading ? (
            <Spinner />
          ) : strategyData.length === 0 ? (
            <NoData message="No social media post data found." />
          ) : (
            <SocialStrategyChart data={strategyData} />
          )}
        </SectionCard>
      )}

      {/* ML-powered social media recommendations */}
      {isSocialRep && (
        <SectionCard
          title="ML-Recommended Post Strategies"
          subtitle="Top platform and content-type combinations ranked by predicted engagement rate. Source: 09_social_media_optimization pipeline."
        >
          {socialMLLoading ? (
            <Spinner />
          ) : (socialMLScores ?? []).length === 0 ? (
            <NoData message="No ML scores yet. Run the social-media-optimization notebook and export to social_media_ml_scores." />
          ) : (
            <>
              <SocialMLTable data={socialMLScores!} />
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[var(--wt-border)]">
                {Object.entries(PLATFORM_COLOR).map(([p, c]) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[11px] text-[var(--wt-text-2)]">{p}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      )}
    </div>
  )
}
