import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type ImpactSnapshot = {
  snapshot_id: number
  snapshot_date: string | null
  headline: string | null
  summary_text: string | null
  metric_payload_json: Record<string, unknown> | null
  published_at: string | null
}

async function fetchPublishedSnapshots(): Promise<{ data: ImpactSnapshot[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase is not configured.' } }
  const { data, error } = await supabase
    .from('public_impact_snapshots')
    .select('snapshot_id, snapshot_date, headline, summary_text, metric_payload_json, published_at')
    .eq('is_published', true)
    .order('snapshot_date', { ascending: false })
    .limit(48)
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as ImpactSnapshot[], error: null }
}

function formatMetricValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') return Number.isFinite(v) ? v.toLocaleString() : '—'
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

export function ImpactPage() {
  const q = useMemo(() => () => fetchPublishedSnapshots(), [])
  const { data: rows, loading, error } = useSupabaseQuery<ImpactSnapshot[]>(q)

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Impact</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-2">
            Connect the app to Supabase to view published aggregate impact snapshots.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Impact</h1>
        <p className="mt-2 text-[var(--wt-text-2)] max-w-2xl">
          Anonymized, aggregate monthly snapshots from Lighthouse Sanctuary operations. No personally identifiable information is
          shown here.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#dc2626]/40 bg-[#dc2626]/10 px-4 py-2 text-sm text-[#dc2626] mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
          <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
          Loading impact snapshots…
        </div>
      ) : (
        <div className="space-y-6">
          {(rows ?? []).length === 0 ? (
            <p className="text-sm text-[var(--wt-text-2)]">No published snapshots yet.</p>
          ) : (
            (rows ?? []).map((snap) => {
              const metrics = snap.metric_payload_json && typeof snap.metric_payload_json === 'object' ? snap.metric_payload_json : {}
              const entries = Object.entries(metrics)
              return (
                <article
                  key={snap.snapshot_id}
                  className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 md:p-8"
                >
                  <div className="text-[10px] uppercase tracking-widest text-[var(--wt-accent)]">
                    {snap.snapshot_date ? snap.snapshot_date.slice(0, 7) : 'Snapshot'}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[var(--wt-text)] mt-0.5">{snap.headline ?? 'Impact update'}</h2>
                  <p className="text-sm text-[var(--wt-text-2)] mt-2 leading-relaxed">{snap.summary_text ?? ''}</p>
                  {entries.length > 0 && (
                    <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {entries.map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-3">
                          <dt className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">{k.replace(/_/g, ' ')}</dt>
                          <dd className="text-lg font-semibold text-[var(--wt-text)] tabular-nums mt-1">{formatMetricValue(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              )
            })
          )}
        </div>
      )}

      <p className="mt-10 text-sm text-[var(--wt-text-2)]">
        Prefer to support the mission directly?{' '}
        <Link to="/donations" className="text-[var(--wt-accent)] font-medium hover:underline">
          View donations
        </Link>
        .
      </p>
    </div>
  )
}
