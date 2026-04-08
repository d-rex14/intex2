import { ORG } from '../../content/org'
import { GiveButterWidget } from '../../components/GiveButterWidget'
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

      <h2 className="mt-14 font-display text-2xl font-bold text-[var(--wt-text)] text-center">
        Wheels of Hope: A van that changes lives
      </h2>
      <p className="mt-4 max-w-3xl mx-auto text-[var(--wt-text)] leading-relaxed text-center">
        Every mile matters when a girl&apos;s safety and future are on the line. Our <em>Wheels of Hope</em> campaign supports the
        purchase of a <strong>new van</strong> that does far more than provide transportation—it delivers{' '}
        <strong>security, dignity, and connection</strong>. The vans bring girls to <strong>safety</strong>, shuttle them to{' '}
        <strong>court hearings</strong> to seek justice, and take them to church and other community activities that help them
        build trust with safe, caring people.
      </p>

      <div className="mt-10 max-w-xl mx-auto">
        <GiveButterWidget />
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-10">
        <a href={ORG.venmo} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/11/Venmo-2-1-300x288.png"
            alt="Donate with Venmo"
            className="h-24 w-auto object-contain"
          />
        </a>
        <a href={ORG.paypalMe} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/11/PayPal-300x272.png"
            alt="Donate with PayPal"
            className="h-20 w-auto object-contain"
          />
        </a>
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href={ORG.paypalHosted}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[var(--wt-accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
        >
          Donate with PayPal (hosted button)
        </a>
      </div>
    </div>
  )
}
