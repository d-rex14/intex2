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
      quote="At 13 years old I thought my life was hopeless, that there was nowhere to turn, because the abuse done to me was so painful. In the last year and a half at Watchtower I found light and help to make sense of my life. Watchtower is where I experienced love and I received help in my healing process and with my fight for justice."
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
        'Although Watchtower does not encourage or discourage the children to file cases, we support the children in pursuing what justice is for them.',
        'When a child chooses to file a case against their perpetrator, Watchtower helps that child prepare for their court hearings and assists them through the case.',
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
        'The goal of Watchtower is to help move children who have suffered abuse from a mindset of victimhood into a mindset of leadership and advocacy.',
        'Watchtower helps educate the children formally with the objective to empower them to stand strong for their own rights and for the rights of others.',
      ]}
    />
  )
}

export function PhysiologicalNeedsPage() {
  return (
    <ProgramPage
      title="Physiological Needs"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2024/10/5DED2490-E094-4E0A-A25C-AC962EAEE506.jpg"
      quote="Watchtower helped me to end the abuse I had been experiencing since preschool. They are the family that helped me to overcome everything I was afraid of and to heal from the abuse I experienced. And because of Watchtower, I felt the true love of a family."
      paragraphs={[
        'To provide for the physical needs of each girl, Watchtower provides nutritious meals, vitamins, comfortable beds for adequate sleep, and appropriate exercise for their growing bodies.',
        'Watchtower also coordinates with doctors and hospitals nearby to provide needed services such as medical and dental care for all their physical needs.',
      ]}
    />
  )
}

export function BiologicalNeedsPage() {
  return (
    <ProgramPage
      title="Biological Needs"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/Hands_Circle.jpg"
      quote="At 13 years old I thought my life was hopeless, that there was nowhere to turn, because the abuse done to me was so painful. In the last year and a half at Watchtower I found light and help to make sense of my life. Watchtower is where I experienced love and I received help in my healing process and with my fight for justice."
      paragraphs={[
        'The safe house that shelters the girls is surrounded by a protection wall with cameras and is built strong for the constant tropical storms.',
        'Each staff member is well trained to comfort and care for the children so they are safe and they feel safe.',
      ]}
    />
  )
}

export function SpiritualNeedsPage() {
  return (
    <ProgramPage
      title="Spiritual Needs"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2024/10/60E9EC18-B817-4566-AA17-45EE89541594-e1727840646134.jpg"
      quote="If I were to describe Watchtower, it would be HOME. It was one of the best times of my life where I found safety and healing from abuse. Watchtower extends help and does not ask anything in return."
      paragraphs={[
        'Each child is invited daily to participate in singing song of praise and in group prayers and scripture reading.',
        'Each week the children are invited to church services and to spiritual activities.',
        'Many of the girls learn to pray for their first time at Watchtower and most say that they found their healing through prayer.',
        '*No child is forced or coerced to attend or believe anything that is offered.',
      ]}
    />
  )
}

export function PsychologicalNeedsPage() {
  return (
    <ProgramPage
      title="Psychological Needs"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/BackwardsJump-e1741389606772.jpg"
      quote="Watchtower directs us through life’s challenges and difficult times. I’m grateful for the times when we would share what we learned during group sessions, or when we would write in our journals."
      paragraphs={[
        'Each week the girls are taught the principles of emotional resilience and are coached in using those principles as difficulties inevitably arise.',
        'The girls are walked through the skills of resolving conflict, finding healthy ways to cope and healthy thinking patterns.',
      ]}
    />
  )
}

export function SocialNeedsPage() {
  return (
    <ProgramPage
      title="Social Needs"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/PinkShirtPinkFlower.jpg"
      quote="One thing I will always remember from my stay is how we, residents, created such a beautiful connection. We built a long term support system who checks on each other even after leaving the shelter."
      paragraphs={[
        'One thing that makes Watchtower unique is that although most of the girls who come are teenagers, there are no cliques, popularity contests or ranks.',
        'Each girl is taught that she is divine and that her worth is eternal, just as all the others at the shelter.',
        'The girls learn to overcome their differences and find comfort in friendships they never imagined possible.',
      ]}
    />
  )
}

export function LoveBelongingPage() {
  return (
    <ProgramPage
      title="Love and Belonging"
      image="https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/GreenGrassFingerStar-e1741389539890.jpg"
      quote="Watchtower for me is a family. The staff helped me understand myself and my life circumstances and gave me the love and attention I never had from my own family."
      paragraphs={[
        'Friendship, inclusion, respect, and intimacy in friendships and family relationships are essential to a happy life.',
        'Many of the girls do not have healthy relationships outside of Watchtower and come to see the staff and fellow residents as their closest friends and family.',
        'Those relationships make life fulfilling and worthwhile.',
      ]}
    />
  )
}
