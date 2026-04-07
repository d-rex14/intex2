import { ORG } from '../../content/org'

export function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Contact us</h1>
      <div className="mt-8 max-w-xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-8 space-y-6">
        <div>
          <p className="text-lg font-semibold text-[var(--wt-text)]">Julie Hernando, Co-Founder and President</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">Email</p>
          <a
            href={`mailto:${ORG.emailContact}`}
            className="text-[var(--wt-text)] font-medium hover:text-[var(--wt-accent)] underline underline-offset-2"
          >
            {ORG.emailContact}
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">Phone</p>
          <a
            href={`tel:${ORG.phoneTel}`}
            className="text-[var(--wt-text)] font-medium hover:text-[var(--wt-accent)] underline underline-offset-2"
          >
            {ORG.phoneDisplay}
          </a>
          <p className="mt-1 text-sm text-[var(--wt-text-2)]">EIN: {ORG.ein}</p>
        </div>
      </div>
    </div>
  )
}
