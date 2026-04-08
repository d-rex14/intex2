import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
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

type SocialMediaRec = {
  post_id: number | null
  platform: string | null
  content_type: string | null
  predicted_engagement_rate: number | null
  predicted_donation_referrals: number | null
  recommendation: string | null
  model_version: string
  scored_at: string
}

type UpgradeBandSummary = { band: string; count: number; avg_score: number }

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

async function fetchSocialRecs(): Promise<{ data: SocialMediaRec[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase
    .from('social_media_ml_scores')
    .select('*')
    .order('predicted_engagement_rate', { ascending: false })
    .limit(10)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SocialMediaRec[], error: null }
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const selectClass =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'

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
  const colors: Record<string, string> = {
    High:
      type === 'upgrade'
        ? 'bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-accent)] border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]'
        : type === 'churn'
        ? 'bg-[color-mix(in_srgb,#dc2626_14%,transparent)] text-[#dc2626] border-[color-mix(in_srgb,#dc2626_30%,transparent)]'
        : 'bg-[color-mix(in_srgb,var(--wt-accent)_18%,transparent)] text-[var(--wt-accent)] border-[color-mix(in_srgb,var(--wt-accent)_35%,transparent)]',
    Medium:
      'bg-[color-mix(in_srgb,var(--wt-text-2)_14%,transparent)] text-[var(--wt-text-2)] border-[color-mix(in_srgb,var(--wt-text-2)_25%,transparent)]',
    Low: 'bg-[color-mix(in_srgb,var(--wt-border)_40%,transparent)] text-[var(--wt-text-2)] border-[var(--wt-border)]',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[band] ?? colors.Low}`}
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
              className="h-full rounded-full bg-[var(--wt-accent)] transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-[var(--wt-text-2)] text-right">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

// Horizontal bar chart for safehouse value-add
function SafehouseBar({ data }: { data: SafehouseScore[] }) {
  const vals = data.map(d => d.value_add_coef ?? 0)
  const absMax = Math.max(1, ...vals.map(Math.abs))
  return (
    <div className="space-y-3 mt-2">
      {data.map(d => {
        const v = d.value_add_coef ?? 0
        const pct = Math.abs(v) / absMax
        const positive = v >= 0
        return (
          <div key={d.safehouse_id} className="grid grid-cols-[10rem_1fr_4rem] items-center gap-3">
            <span className="text-sm text-[var(--wt-text)] truncate" title={d.safehouse_name ?? `Safehouse ${d.safehouse_id}`}>
              {d.safehouse_name ?? `Safehouse ${d.safehouse_id}`}
            </span>
            <div className="h-3 rounded-full bg-[var(--wt-border)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${positive ? 'bg-[var(--wt-accent)]' : 'bg-[#dc2626]/70'}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <span className={`text-xs tabular-nums text-right ${positive ? 'text-[var(--wt-accent)]' : 'text-[#dc2626]'}`}>
              {v > 0 ? '+' : ''}{v.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Post-scorer interactive form for social media
function PostScorerForm() {
  const [platform, setPlatform] = useState('Instagram')
  const [contentType, setContentType] = useState('Photo')
  const [boosted, setBoosted] = useState(false)
  const [result, setResult] = useState<{ engagement: number; referrals: number } | null>(null)

  // Lightweight heuristic scoring for UI demo (real model served via notebook export / Edge Function in production)
  const score = () => {
    const platBoost: Record<string, number> = { Instagram: 1.2, Facebook: 1.0, Twitter: 0.85, TikTok: 1.35 }
    const typeBoost: Record<string, number> = { Video: 1.4, Photo: 1.0, 'Text/Link': 0.7, Story: 1.15, Reel: 1.5 }
    const base = 0.04 * (platBoost[platform] ?? 1.0) * (typeBoost[contentType] ?? 1.0) * (boosted ? 1.3 : 1.0)
    const refs = Math.round(base * 25 * (contentType === 'Video' || contentType === 'Reel' ? 1.5 : 1.0))
    setResult({ engagement: Math.min(0.3, base), referrals: refs })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Platform</span>
          <select className={selectClass} value={platform} onChange={e => setPlatform(e.target.value)}>
            {['Instagram', 'Facebook', 'Twitter', 'TikTok'].map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Content type</span>
          <select className={selectClass} value={contentType} onChange={e => setContentType(e.target.value)}>
            {['Photo', 'Video', 'Reel', 'Story', 'Text/Link'].map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            checked={boosted}
            onChange={e => setBoosted(e.target.checked)}
            className="rounded border-[var(--wt-border)] mb-2"
          />
          <span className="text-sm text-[var(--wt-text)]">Paid boost</span>
        </label>
      </div>

      <button
        type="button"
        onClick={score}
        className="rounded-lg bg-[var(--wt-accent)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
      >
        Score this post
      </button>

      {result && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Predicted engagement rate</div>
            <div className="text-2xl font-bold text-[var(--wt-accent)] tabular-nums">{(result.engagement * 100).toFixed(1)}%</div>
          </div>
          <div className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Est. donation referrals</div>
            <div className="text-2xl font-bold text-[var(--wt-text)] tabular-nums">{result.referrals}</div>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-[var(--wt-text-2)]">
              Heuristic preview based on <code>social-media-optimization</code> pipeline feature importances.
              Connect to the full model endpoint for production-accuracy scores.
            </p>
          </div>
        </div>
      )}
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

  const socialQFn = useMemo(() => () => fetchSocialRecs(), [])
  const { data: socialRecs, loading: socialLoading } = useSupabaseQuery(socialQFn)

  const upgradeQFn = useMemo(() => () => fetchUpgradeBands(), [])
  const { data: upgradeBands, loading: upgradeLoading } = useSupabaseQuery(upgradeQFn)

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

      {/* Social media post scorer */}
      {isSocialRep && (
        <SectionCard
          title="Social Media Post Scorer"
          subtitle="Estimate predicted engagement rate and donation referrals for a draft post before publishing. Source: social-media-optimization pipeline."
        >
          <PostScorerForm />
        </SectionCard>
      )}

      {/* Top social media recommendations table */}
      {isSocialRep && (
        <SectionCard
          title="Top Recommended Post Strategies"
          subtitle="Highest-scoring platform/format combinations from the social media optimization model."
        >
          {socialLoading ? (
            <Spinner />
          ) : (socialRecs ?? []).length === 0 ? (
            <NoData message="No social media scores yet. Run the social_media_optimization notebook and export to social_media_ml_scores." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Content type</th>
                    <th className="px-4 py-3 font-medium text-right">Eng. rate</th>
                    <th className="px-4 py-3 font-medium text-right">Donation refs</th>
                    <th className="px-4 py-3 font-medium min-w-[10rem]">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {socialRecs!.map((r, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                    >
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.platform ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--wt-text)]">{r.content_type ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--wt-accent)] font-semibold">
                        {r.predicted_engagement_rate != null
                          ? `${(r.predicted_engagement_rate * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--wt-text)]">
                        {r.predicted_donation_referrals?.toFixed(1) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--wt-text-2)] text-xs">{r.recommendation ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
