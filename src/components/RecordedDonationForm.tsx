import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type DonationType = 'Monetary' | 'InKind' | 'Time' | 'Skills' | 'SocialMedia'

const DONATION_TYPES: DonationType[] = [
  'Monetary',
  'InKind',
  'Time',
  'Skills',
  'SocialMedia',
]

export function RecordedDonationForm() {
  const { session, user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [amount, setAmount] = useState('')
  const [donationType, setDonationType] = useState<DonationType>('Monetary')
  const [notes, setNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) setEmail(prev => (prev.trim() === '' ? user.email! : prev))
  }, [user?.email])

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 text-sm text-[var(--wt-text-2)]">
        Connect Supabase (<code className="text-[var(--wt-accent)]">VITE_SUPABASE_URL</code> and{' '}
        <code className="text-[var(--wt-accent)]">VITE_SUPABASE_ANON_KEY</code>) to record demo donations in the database.
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const parsed = parseFloat(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a valid positive amount.')
      setLoading(false)
      return
    }

    const { data, error: rpcError } = await supabase.rpc('submit_public_demo_donation', {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_email: email.trim(),
      p_amount: parsed,
      p_donation_type: donationType,
      p_notes: notes.trim() || null,
      p_is_recurring: isRecurring,
      p_campaign_name: campaignName.trim() || null,
      p_auth_user_id: session?.user?.id ?? null,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    setMessage(
      `Thank you. Your demo gift was recorded (donation #${(data as { donation_id?: number })?.donation_id ?? '—'}).`,
    )
    setAmount('')
    setNotes('')
    setCampaignName('')
    setIsRecurring(false)
    setLoading(false)
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 space-y-4"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--wt-text)]">Record a contribution (demo)</h2>
        <p className="mt-1 text-sm text-[var(--wt-text-2)] leading-relaxed">
          This does not charge a real card — it saves a sample donation to Watchtower&apos;s database for the portal and
          reports. Optional: sign in first so the same email can see history under Donors &amp; Contributions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">First name</label>
          <input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Last name</label>
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
          className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          autoComplete="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">
            Amount (PHP, demo)
          </label>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Type</label>
          <select
            value={donationType}
            onChange={e => setDonationType(e.target.value as DonationType)}
            className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          >
            {DONATION_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">
          Campaign (optional)
        </label>
        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          placeholder="e.g. Wheels of Hope"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] cursor-pointer">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={e => setIsRecurring(e.target.checked)}
          className="rounded border-[var(--wt-border)]"
        />
        Mark as recurring (demo flag only)
      </label>

      {error && <p className="text-sm text-[#dc2626]">{error}</p>}
      {message && <p className="text-sm text-[var(--wt-text-2)]">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-[var(--wt-accent)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Submit demo donation'}
      </button>
    </form>
  )
}
