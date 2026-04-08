import { useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
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

function formatAmount(row: MyDonation): string {
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
  const cur = row.currency_code?.trim() || ''
  return cur
    ? `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function YourDonationsPage() {
  const { user } = useAuth()

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

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Configure Supabase environment variables to load your donations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Your Donations</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1 max-w-2xl">
            A record of the contributions linked to your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="shrink-0 rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_18%,transparent)] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
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
                  <th className="px-4 py-3 font-medium whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Recurring</th>
                  <th className="px-4 py-3 font-medium min-w-[8rem]">Campaign</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Channel</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map(row => (
                  <tr
                    key={row.donation_id}
                    className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]"
                  >
                    <td className="px-4 py-3 text-[var(--wt-text)] tabular-nums">{row.donation_id}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {row.donation_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{row.donation_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{formatAmount(row)}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)]">{row.is_recurring ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)] max-w-[10rem] truncate">
                      {row.campaign_name?.trim() || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text-2)]">{row.channel_source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
