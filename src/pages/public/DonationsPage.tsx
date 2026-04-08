import { ORG } from '../../content/org'
import { RecordedDonationForm } from '../../components/RecordedDonationForm'

export function DonationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Donations</h1>
      <div className="mt-8 max-w-3xl space-y-6 text-[var(--wt-text)] leading-relaxed">
        <p>
          Watchtower Sanctuary is a 501(c)(3) (EIN {ORG.ein}) organization that focuses on safety and healing for
          children-survivors of sexual abuse and sex trafficking.
        </p>
        <p>
          Your donation will change the course of a child&apos;s life. The holistic healing provided to the children of
          Watchtower Sanctuary is only possible with your financial help.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--wt-text-2)]">
          <li>$15 a month will provide essential vitamins for a child</li>
          <li>$50 a month will feed a child</li>
          <li>$100 a month will cover medical, dental, and educational needs for a child</li>
          <li>$300 a month will employ a professional caregiver to care for many children</li>
          <li>$1,500 a month will pay for the mortgage that provides refuge for all of the children</li>
        </ul>
        <p>
          The total monthly expenses of Watchtower Sanctuary are nearly $11,000, and every penny is spent in providing refuge,
          rehabilitation, and reintegration services for children-survivors of sexual exploitation. Thank you for making this
          world a brighter place by helping to support the children of Watchtower Sanctuary!
        </p>
      </div>

      <div className="mt-12 max-w-xl mx-auto">
        <RecordedDonationForm />
      </div>
    </div>
  )
}
