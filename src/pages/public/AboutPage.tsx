import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BOARD } from '../../content/board'

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[var(--wt-text-2)] max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const TESTIMONIALS = [
  {
    age: '16 Years',
    quote: (
      <>
        <p>
          “Watchtower was the light in my life during the times when I wanted to give up. It was an answered prayer for me that
          I could go to a safe place like Watchtower Sanctuary.”
        </p>
        <p className="mt-3">
          “One thing I love about Watchtower is how we are able to love one another, be a support system, and let love prevail
          in our lives.”
        </p>
      </>
    ),
  },
  {
    age: '15 Years',
    quote: (
      <>
        <p>
          “Watchtower for me is a family. The staff helped me understand myself and my life circumstances. They helped me find
          answers to my questions and they gave me the love and attention I never had from my own family.”
        </p>
        <p className="mt-3">
          “I will never forget the time when I was at my lowest and the Mamas and the management gave me comfort and told me
          that all of my sufferings had purpose. During that time I found relief and hope. I&apos;m also grateful that we got to
          celebrate our birthdays there; it made us feel seen and loved.”
        </p>
      </>
    ),
  },
  {
    age: '15 Years',
    quote: (
      <p>
        “One thing I will always remember from my stay is how we, residents, created such a beautiful connection. Sometimes, we
        had misunderstandings or conflicts but we learned to forgive, understand our imperfections, and most of all, love our
        sisters. We built a long term support system who checks on each other even after leaving the shelter.”
      </p>
    ),
  },
] as const

export function AboutPage() {
  return (
    <PageShell title="About us" subtitle="Get to know Watchtower Sanctuary—who we are and how we serve children in the Philippines.">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-14 items-start">
        <div>
          <img
            src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/03/PinkPantsArmsUpByOcean-e1741391204308.jpg"
            alt=""
            className="rounded-2xl border border-[var(--wt-border)] w-full object-cover max-h-[480px]"
          />
        </div>
        <div className="space-y-4 text-[var(--wt-text)] leading-relaxed">
          <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-semibold">Get to know us</p>
          <p className="font-semibold text-lg">
            Watchtower Sanctuary is a 501(c)(3) organization (EIN 81-3220618) created to meet the needs of
            children-survivors of sexual abuse and sex trafficking in the Philippines by providing a safe haven and professional
            rehabilitation services so children can successfully reintegrate back into family life and society.
          </p>
          <p>
            There is a great need for residential shelters in the Philippines for children who are trapped in abuse or who are
            sexually trafficked. Watchtower Sanctuary has stepped up to fill the need for female survivors between the ages of 8
            to 18.
          </p>
          <p>
            Watchtower Sanctuary has two residential style shelters, that caters to up to 20 children each. The children are
            rescued by the local police department or anti-trafficking agents who refer the children through the Department of
            Social Welfare and Development (DSWD) to Watchtower Sanctuary. The social worker in the sanctuary will assist the
            child in transitioning into their new environment.
          </p>
          <p>
            Once in the home, the children will be provided with counseling, medical services, daily needs and an individualized
            education. Partners of Watchtower Sanctuary will be working toward justice for each child in order to ensure a safe
            reintegration into society. Watchtower Sanctuary believes that the family unit is the ideal place for any child and
            will coordinate with the DSWD to find suitable families for each child. Whether a child is placed with their birth
            family, a foster family or an adoptive family, Watchtower Sanctuary will provide family counseling to assist in the
            transition.
          </p>
        </div>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold text-[var(--wt-text)]">Testimonials</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map(t => (
          <blockquote
            key={t.age}
            className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 text-sm text-[var(--wt-text)] leading-relaxed"
          >
            <div className="text-[var(--wt-accent)] text-2xl leading-none mb-2">”</div>
            <div className="space-y-0">{t.quote}</div>
            <footer className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--wt-text-2)]">{t.age}</footer>
          </blockquote>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold text-[var(--wt-text)] text-center">Watchtower Sanctuary Board</h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {BOARD.map(member => (
          <Link key={member.href} to={member.href} className="text-center group">
            <div className="mx-auto w-36 h-36 rounded-full overflow-hidden border-2 border-[var(--wt-border)] group-hover:border-[var(--wt-accent)] transition-colors">
              <img src={member.img} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="mt-3 font-semibold text-[var(--wt-text)] group-hover:text-[var(--wt-accent)]">{member.name}</p>
            <p className="text-sm text-[var(--wt-text-2)]">{member.role}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
