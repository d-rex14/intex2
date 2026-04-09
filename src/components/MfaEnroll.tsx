import { useCallback, useEffect, useState } from 'react'
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Stage = 'idle' | 'enrolling' | 'verifying'

export function MfaEnroll() {
  const { hasMfaFactor, refreshAal } = useAuth()
  const [stage, setStage] = useState<Stage>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const reset = useCallback(() => {
    setStage('idle')
    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setCode('')
    setError(null)
    setCopied(false)
  }, [])

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(t)
    }
  }, [copied])

  const startEnroll = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    setSuccess(null)

    const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Watchtower TOTP',
    })

    if (enrollErr || !data) {
      setError(enrollErr?.message ?? 'Failed to start enrollment.')
      setBusy(false)
      return
    }

    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    setStage('verifying')
    setBusy(false)
  }

  const verifyEnrollment = async () => {
    if (!supabase || !factorId) return
    setBusy(true)
    setError(null)

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr || !challenge) {
      setError(challengeErr?.message ?? 'Failed to create challenge.')
      setBusy(false)
      return
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (verifyErr) {
      setError(verifyErr.message)
      setBusy(false)
      return
    }

    await refreshAal()
    setSuccess('Two-factor authentication has been enabled.')
    reset()
    setBusy(false)
  }

  const unenroll = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    setSuccess(null)

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const verified = factors?.totp?.filter(f => f.status === 'verified') ?? []

    for (const f of verified) {
      const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: f.id })
      if (unErr) {
        setError(unErr.message)
        setBusy(false)
        return
      }
    }

    await refreshAal()
    setSuccess('Two-factor authentication has been disabled.')
    setBusy(false)
  }

  if (stage === 'verifying' && qrCode) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--wt-text)] mb-3 flex items-center gap-2">
          <Shield size={16} className="text-[var(--wt-accent)]" />
          Set Up Two-Factor Authentication
        </h3>

        <p className="text-xs text-[var(--wt-text-2)] mb-3">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
        </p>

        <div className="flex justify-center mb-3">
          <div className="rounded-lg bg-white p-2">
            <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
          </div>
        </div>

        {secret && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Manual entry key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-[var(--wt-bg)] border border-[var(--wt-border)] px-2 py-1 text-xs text-[var(--wt-text)] font-mono break-all select-all">
                {secret}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(secret)
                  setCopied(true)
                }}
                className="shrink-0 rounded-lg border border-[var(--wt-border)] p-1.5 text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors"
                aria-label="Copy secret"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--wt-text-2)] mb-1">Verification Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)] text-center tracking-[0.3em] font-mono"
            />
          </div>

          {error && <p className="text-xs text-[#dc2626]">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void verifyEnrollment()}
              disabled={busy || code.length < 6}
              className="flex-1 rounded-lg bg-[var(--wt-accent)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Enable 2FA'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[var(--wt-border)] px-3 py-2 text-xs text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--wt-text)] mb-2 flex items-center gap-2">
        {hasMfaFactor ? (
          <ShieldCheck size={16} className="text-emerald-400" />
        ) : (
          <ShieldOff size={16} className="text-[var(--wt-text-2)]" />
        )}
        Two-Factor Authentication
      </h3>

      {success && <p className="text-xs text-emerald-400 mb-2">{success}</p>}
      {error && <p className="text-xs text-[#dc2626] mb-2">{error}</p>}

      {hasMfaFactor ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--wt-text-2)]">
            2FA is <strong className="text-emerald-400">enabled</strong>. You will be asked for a code from your authenticator app each time you sign in.
          </p>
          <button
            type="button"
            onClick={() => void unenroll()}
            disabled={busy}
            className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs text-[#dc2626] hover:bg-[color-mix(in_srgb,#dc2626_12%,transparent)] transition-colors disabled:opacity-60"
          >
            {busy ? 'Disabling…' : 'Disable 2FA'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--wt-text-2)]">
            Add an extra layer of security to your account by enabling two-factor authentication with an authenticator app.
          </p>
          <button
            type="button"
            onClick={() => void startEnroll()}
            disabled={busy}
            className="rounded-lg bg-[var(--wt-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors disabled:opacity-60"
          >
            {busy ? 'Setting up…' : 'Enable 2FA'}
          </button>
        </div>
      )}
    </div>
  )
}
