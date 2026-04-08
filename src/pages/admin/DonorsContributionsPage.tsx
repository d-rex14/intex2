import { useCallback, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { isStaffLike } from '../../lib/roles'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type SupporterEmbed = {
  supporter_id: number
  display_name: string | null
  email: string | null
} | null

export type DonationRow = {
  donation_id: number
  supporter_id: number | null
  donation_type: string | null
  donation_date: string | null
  channel_source: string | null
  currency_code: string | null
  amount: number | null
  estimated_value: number | null
  impact_unit: string | null
  is_recurring: boolean | null
  campaign_name: string | null
  notes: string | null
  supporters: SupporterEmbed
}

export function DonorsContributionsPage() {
  const { effectiveRoleIds } = useAuth()
  const staff = isStaffLike(effectiveRoleIds)
  const [editing, setEditing] = useState<DonationRow | null>(null)
  const [deleting, setDeleting] = useState<DonationRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const queryFn = useCallback(async () => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase is not configured.' } }
    }
    return supabase
      .from('donations')
      .select(
        `
        donation_id,
        supporter_id,
        donation_type,
        donation_date,
        channel_source,
        currency_code,
        amount,
        estimated_value,
        impact_unit,
        is_recurring,
        campaign_name,
        notes,
        supporters ( supporter_id, display_name, email )
      `,
      )
      .order('donation_date', { ascending: false })
      .limit(500)
  }, [])

  const { data, loading, error, refetch } = useSupabaseQuery<DonationRow[]>(async () => {
    const res = await queryFn()
    const rows = res.data as DonationRow[] | null
    return { data: rows, error: res.error }
  })

  const saveEdit = async () => {
    if (!supabase || !editing) return
    setSaving(true)
    setFormError(null)
    const { error: upErr } = await supabase
      .from('donations')
      .update({
        donation_type: editing.donation_type,
        donation_date: editing.donation_date,
        amount: editing.amount,
        estimated_value: editing.estimated_value,
        notes: editing.notes,
        is_recurring: editing.is_recurring,
        campaign_name: editing.campaign_name,
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
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 text-sm text-[var(--wt-text-2)]">
        Set <code className="text-[var(--wt-accent)]">VITE_SUPABASE_URL</code> and{' '}
        <code className="text-[var(--wt-accent)]">VITE_SUPABASE_ANON_KEY</code> to load donations.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--wt-text)] tracking-tight">
          {staff ? 'Donors & Contributions' : 'My giving'}
        </h1>
        <p className="mt-1 text-sm text-[var(--wt-text-2)] max-w-2xl">
          {staff
            ? 'Review and manage supporter-linked donations. Apply the SQL in supabase/SUPABASE_DONATIONS_SETUP.md so RLS and RPC exist.'
            : 'Donations linked to your account email appear here after you submit the demo form on the Donations page.'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--wt-text-2)]">
          <div className="w-5 h-5 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      )}
      {error && <p className="text-sm text-[#dc2626]">{error}</p>}
      {formError && <p className="text-sm text-[#dc2626]">{formError}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)]">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                {staff && <th className="px-4 py-3 font-medium">Supporter</th>}
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                {staff && <th className="px-4 py-3 font-medium w-28" />}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map(row => (
                <tr key={row.donation_id} className="border-b border-[var(--wt-border)]/80 text-[var(--wt-text)]">
                  {staff && (
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.supporters?.display_name ?? '—'}</div>
                      <div className="text-[var(--wt-text-2)] text-xs">{row.supporters?.email ?? '—'}</div>
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">{row.donation_date ?? '—'}</td>
                  <td className="px-4 py-3">{row.donation_type ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.amount != null ? `${row.currency_code ?? ''} ${row.amount}`.trim() : '—'}
                  </td>
                  <td className="px-4 py-3">{row.channel_source ?? '—'}</td>
                  <td className="px-4 py-3 max-w-[12rem] truncate" title={row.campaign_name ?? ''}>
                    {row.campaign_name ?? '—'}
                  </td>
                  {staff && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
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
          {data?.length === 0 && (
            <p className="p-6 text-sm text-[var(--wt-text-2)]">No donations visible yet.</p>
          )}
        </div>
      )}

      {editing && staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">Edit donation #{editing.donation_id}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Donation date
                <input
                  type="date"
                  value={editing.donation_date?.slice(0, 10) ?? ''}
                  onChange={e => setEditing({ ...editing, donation_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Type
                <input
                  value={editing.donation_type ?? ''}
                  onChange={e => setEditing({ ...editing, donation_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest">
                Amount
                <input
                  type="number"
                  value={editing.amount ?? ''}
                  onChange={e =>
                    setEditing({ ...editing, amount: e.target.value === '' ? null : parseFloat(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Channel
                <input
                  value={editing.channel_source ?? ''}
                  onChange={e => setEditing({ ...editing, channel_source: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
              </label>
              <label className="text-xs text-[var(--wt-text-2)] uppercase tracking-widest col-span-2">
                Campaign
                <input
                  value={editing.campaign_name ?? ''}
                  onChange={e => setEditing({ ...editing, campaign_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-surface)] px-3 py-2 text-sm text-[var(--wt-text)]"
                />
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
                  onChange={e => setEditing({ ...editing, notes: e.target.value })}
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
                {saving ? 'Saving…' : 'Save'}
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
