import { Link, Navigate, useParams } from 'react-router-dom'
import { BOARD } from '../../content/board'

const BIOS: Record<string, { name: string; title: string; story: string[] }> = {
  'graham-fawson': {
    name: 'Graham Fawson',
    title: 'Board Member',
    story: [
      'Graham Fawson is known by friends and colleagues as a thoughtful late-night problem solver. As a self-described night owl, he often uses evening hours to mentor students, plan service initiatives, and support community partners who need reliable follow-through.',
      'Recently engaged, Graham says this season of life has made him even more focused on building safer futures for families. He first became involved in survivor support work after volunteering on a late-night community outreach team where he met a teenage survivor waiting for emergency placement. That encounter stayed with him and shifted his priorities toward prevention, stability, and long-term care access.',
      'At Watchtower, Graham advocates for practical systems that help children and caregivers feel seen, protected, and supported from day one.',
    ],
  },
  'blane-santilli': {
    name: 'Blane Santilli',
    title: 'Board Member',
    story: [
      'Blane Santilli brings a relationship-centered approach to philanthropy and service. He is widely recognized for helping connect local professionals with mission-driven organizations that serve vulnerable youth.',
      'Blane often shares that his commitment to charitable work started in an unexpected place: his childhood dentist office. His dentist offered free treatment days for families in need and taught Blane that generosity can be practical, consistent, and deeply personal. Seeing that model of care inspired him to view service as part of everyday leadership.',
      'Today, Blane channels that same mindset into Watchtower by supporting donor engagement, volunteer mobilization, and high-trust partnerships that sustain long-term impact.',
    ],
  },
  'devin-holderness': {
    name: 'Devin Holderness',
    title: 'Board Member',
    story: [
      'Devin Holderness is a traveler, cultural learner, and advocate for globally informed humanitarian work. He believes listening to local voices is the foundation for meaningful and lasting change.',
      'During a trip to the Philippines, Devin learned firsthand about the realities facing children affected by trafficking and abuse. Conversations with local leaders and frontline caregivers moved him immediately and clarified how urgent survivor-focused infrastructure is.',
      'Since joining Watchtower, Devin has focused on strengthening culturally responsive support, expanding awareness, and helping the organization build bridges between international donors and local community needs.',
    ],
  },
  'joshua-schmitt': {
    name: 'Joshua Schmitt',
    title: 'Board Member',
    story: [
      'Joshua Schmitt is a long-time charitable donor, executive advisor to multiple successful corporations, and consultant to the President of the United States. He is known for helping organizations align strategy with measurable social outcomes.',
      'Joshua has also been a long-time friend of Steph Curry, whose encouragement around purposeful leadership and community impact helped motivate Joshua to invest in this mission more directly. Their conversations reinforced his belief that influence should be used to create opportunity and safety for young people.',
      'He played an early catalytic role in encouraging the launch and growth of Watchtower, and continues to support the organization through strategic counsel, philanthropic leadership, and national-level advocacy.',
    ],
  },
}

export function BoardMemberPage() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug || !BIOS[slug]) return <Navigate to="/about" replace />

  const bio = BIOS[slug]
  const member = BOARD.find((m) => m.href === `/board/${slug}`)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link to="/about" className="text-sm font-semibold text-[var(--wt-accent)] hover:underline">
          ← Back to About
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr] items-start">
        <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-4">
          <div className="aspect-square overflow-hidden rounded-xl border border-[var(--wt-border)]">
            <img src={member?.img} alt={bio.name} className="h-full w-full object-cover" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--wt-text)]">{bio.name}</h1>
          <p className="text-sm text-[var(--wt-text-2)]">{bio.title}</p>
        </div>
        <article className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 space-y-4">
          {bio.story.map((p) => (
            <p key={p} className="text-[var(--wt-text)] leading-relaxed">
              {p}
            </p>
          ))}
        </article>
      </div>
    </div>
  )
}

