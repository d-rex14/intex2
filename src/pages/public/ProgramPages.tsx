type ProgramPageProps = {
  eyebrow?: string
  title: string
  image: string
  quote?: string
  paragraphs: string[]
}

function ProgramPage({ eyebrow, title, image, quote, paragraphs }: ProgramPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">{title}</h1>
      </div>

      <section className="grid gap-12 lg:grid-cols-2 lg:gap-14 items-start">
        <div>
          <img
            src={image}
            alt=""
            className="rounded-2xl border border-[var(--wt-border)] w-full object-cover max-h-[480px]"
          />
        </div>
        <div className="space-y-4 text-[var(--wt-text)] leading-relaxed">
          {eyebrow && <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-semibold">{eyebrow}</p>}
          {quote && <p className="font-semibold text-lg">{quote}</p>}
          {paragraphs.map(p => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
    </div>
  )
}

export function SafetyPage() {
  return (
    <ProgramPage
      title="Safety"
      eyebrow="Physiological"
      image="https://lighthousesanctuary.org/wp-content/uploads/2025/03/DSC00649-scaled-e1743538384800.jpg"
      quote="At 13 years old I thought my life was hopeless, that there was nowhere to turn, because the abuse done to me was so painful. In the last year and a half at Lighthouse I found light and help to make sense of my life. Lighthouse is where I experienced love and I received help in my healing process and with my fight for justice."
      paragraphs={[
        'The safe house that shelters the girls is surrounded by a protection wall with cameras and is built strong for the constant tropical storms.',
        'Each staff member is well trained to comfort and care for the children so they are safe and they feel safe.',
      ]}
    />
  )
}

export function HealingPage() {
  return (
    <ProgramPage
      title="Healing"
      eyebrow="Get to know us"
      image="https://lighthousesanctuary.org/wp-content/uploads/2025/04/RedShirt-scaled-e1743539063402.jpg"
      paragraphs={[
        'Once a child trusts that they are safe they begin the healing process. Healing is holistic and includes the body, mind and spirit.',
        'The healing of the body takes place through proper care and nutritious food. Each child is fed well and given the opportunity to see doctors and dentists for their needs.',
        'For the mind, each child receives individual and group sessions every week and is evaluated by a psychiatrist when needed.',
        'The spirit of the child is nourished through daily devotionals, good music and opportunities to learn about and worship the Lord our God.',
      ]}
    />
  )
}

export function JusticePage() {
  return (
    <ProgramPage
      title="Justice"
      eyebrow="Phase 3"
      image="https://lighthousesanctuary.org/wp-content/uploads/2025/04/WorkerAndGirlsFlexing-scaled-e1743538759803.jpg"
      paragraphs={[
        'Although Lighthouse does not encourage or discourage the children to file cases, we support the children in pursuing what justice is for them.',
        'When a child chooses to file a case against their perpetrator, Lighthouse helps that child prepare for their court hearings and assists them through the case.',
      ]}
    />
  )
}

export function EmpowermentPage() {
  return (
    <ProgramPage
      title="Empowerment"
      eyebrow="Phase 4"
      image="https://lighthousesanctuary.org/wp-content/uploads/2025/03/IMG_5526-2-e1743539222751.jpg"
      paragraphs={[
        'The goal of Lighthouse is to help move children who have suffered abuse from a mindset of victimhood into a mindset of leadership and advocacy.',
        'Lighthouse helps educate the children formally with the objective to empower them to stand strong for their own rights and for the rights of others.',
      ]}
    />
  )
}
