import { Link } from 'react-router-dom'
import { ORG } from '../../content/org'
import { BOARD } from '../../content/board'
import { GiveButterWidget } from '../../components/GiveButterWidget'
import safetyIcon from '../../assets/icons/safety.png'
import healingIcon from '../../assets/icons/healing.png'
import justiceIcon from '../../assets/icons/justice.png'
import empowermentIcon from '../../assets/icons/empowerment.png'

const PROGRAMS = [
  {
    title: 'Physiological Needs',
    href: `${ORG.legacySite}/project/physiological-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2024/10/5DED2490-E094-4E0A-A25C-AC962EAEE506.jpg',
  },
  {
    title: 'Biological Needs',
    href: `${ORG.legacySite}/project/safety-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/Hands_Circle.jpg',
  },
  {
    title: 'Spiritual Needs',
    href: `${ORG.legacySite}/project/spiritual-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2024/10/60E9EC18-B817-4566-AA17-45EE89541594-e1727840646134.jpg',
  },
  {
    title: 'Psychological Needs',
    href: `${ORG.legacySite}/project/emotional-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/BackwardsJump-e1741389606772.jpg',
  },
  {
    title: 'Social Needs',
    href: `${ORG.legacySite}/project/esteem-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/PinkShirtPinkFlower.jpg',
  },
  {
    title: 'Love and Belonging',
    href: `${ORG.legacySite}/project/social-needs/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2014/06/GreenGrassFingerStar-e1741389539890.jpg',
  },
] as const

const RECENT_POSTS = [
  {
    id: 'highs-and-lows-of-lighthouse',
    title: 'Highs and Lows of Lighthouse',
    date: 'May 11, 2025',
    href: `${ORG.legacySite}/2025/05/11/highs-and-lows-of-lighthouse/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/09/372419701_1269541816887826_2749329426990876735_n.jpg',
    excerpt:
      'I’ve struggled to write a blog for some time because I so desperately want to encapsulate everything Lighthouse is—but that’s not possible.',
  },
  {
    id: 'the-power-of-light',
    title: 'The Power of Light',
    date: 'December 11, 2024',
    href: `${ORG.legacySite}/2024/12/11/the-power-of-light/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2025/03/DSC00649-scaled-e1743538384800.jpg',
    excerpt:
      'I took a phone call recently that inspired this blog. A potential donor called, eager to help the survivors at Lighthouse…',
  },
  {
    id: 'thankful-to-celebrate-5-years',
    title: 'Thankful to Celebrate 5 Years',
    date: 'September 12, 2023',
    href: `${ORG.legacySite}/2023/09/12/thankful-to-celebrate-5-years/`,
    img: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/09/img_0ae5140b8863-1.jpeg',
    excerpt:
      'It’s been 5 years since we opened the doors to Lighthouse Sanctuary here in the Philippines.',
  },
] as const

export function HomePage() {
  return (
    <div className="text-[var(--wt-text)]">
      <section className="border-b border-[var(--wt-border)] bg-[color-mix(in_srgb,var(--wt-surface)_55%,var(--wt-bg))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-semibold">Lighthouse Sanctuary</p>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Safety. Healing. Justice. Empowerment.
              </h1>
              <p className="mt-4 text-[var(--wt-text-2)] max-w-xl">
                Click below to donate through PayPal, or visit our Donations page for more ways to give—including Wheels of Hope.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={ORG.paypalHosted}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[var(--wt-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors"
                >
                  Donate Now
                </a>
                <Link
                  to="/donations"
                  className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_22%,transparent)] transition-colors"
                >
                  All ways to give
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-[var(--wt-text-2)] hover:text-[var(--wt-text)] transition-colors"
                >
                  Staff sign in
                </Link>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <img
                src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/09/cropped-7a65dec3f78a0c67627638e6d1cd47fe-1.jpeg"
                alt=""
                className="max-h-[420px] w-auto rounded-2xl border border-[var(--wt-border)] object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        <section>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-semibold">What we do</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold">Provide safety, healing, and empowerment</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Safety',
                text: 'Safety is the number one focus of Lighthouse Sanctuary since it is the first step of healing.',
                icon: safetyIcon,
                shape: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/08/service-shape-01.png',
                to: '/safety',
              },
              {
                title: 'Healing',
                text: 'Once a child trusts that they are safe they begin the healing process.',
                icon: healingIcon,
                shape: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/08/service-shape-02.png',
                to: '/healing',
              },
              {
                title: 'Justice',
                text: 'Lighthouse does not encourage or discourage children to file cases—we support them in pursuing what justice means for them.',
                icon: justiceIcon,
                shape: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/08/service-shape-03.png',
                to: '/justice',
              },
              {
                title: 'Empowerment',
                text: 'The goal is to help children move from a mindset of victimhood into leadership and advocacy.',
                icon: empowermentIcon,
                shape: 'https://www.lighthousesanctuary.org/wp-content/uploads/2023/08/service-shape-04.png',
                to: '/empowerment',
              },
            ].map(item => (
              <div
                key={item.title}
                className="relative rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6 overflow-hidden"
              >
                <div className="mb-3 relative inline-flex h-16 w-16 items-center justify-center">
                  <img src={item.shape} alt="" className="absolute inset-0 h-full w-full object-contain opacity-95" />
                  <img src={item.icon} alt="" className="relative z-10 h-8 w-8 object-contain" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--wt-text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--wt-text-2)] leading-relaxed">{item.text}</p>
                <Link to={item.to} className="mt-3 inline-block text-sm font-semibold text-[var(--wt-accent)] hover:underline">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-xs text-[var(--wt-text-2)] space-y-1">
            <p>
              <a href="https://www.flaticon.com/free-icons/partner" title="partner icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Partner icons created by Freepik - Flaticon
              </a>
            </p>
            <p>
              <a href="https://www.flaticon.com/free-icons/forgiveness" title="forgiveness icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Forgiveness icons created by Freepik - Flaticon
              </a>
            </p>
            <p>
              <a href="https://www.flaticon.com/free-icons/proud" title="proud icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Proud icons created by Hexagon075 - Flaticon
              </a>
            </p>
            <p>
              <a href="https://www.flaticon.com/free-icons/study" title="study icons" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Study icons created by Freepik - Flaticon
              </a>
            </p>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/03/SunsetArmsUp-e1741390695381.jpg"
              alt=""
              className="col-span-2 rounded-2xl border border-[var(--wt-border)] w-full object-cover max-h-64"
            />
            <img
              src="https://www.lighthousesanctuary.org/wp-content/uploads/2025/03/BlueWhiteSpotsWStar-scaled-e1741390738601.jpg"
              alt=""
              className="rounded-2xl border border-[var(--wt-border)] w-full object-cover h-40"
            />
            <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-accent-2)] p-4 flex items-center">
              <p className="text-sm font-medium text-[var(--wt-text)] italic leading-relaxed">
                “Lighthouse is a safe place, where we are treated as family”
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-[var(--wt-accent)] font-semibold">Lighthouse Sanctuary motto</p>
            <p className="mt-4 text-[var(--wt-text)] leading-relaxed">
              We are Lighthouse: full of hope, love and new beginnings. Our focus is progress in all aspects of life. We treat
              each other as family where each individual is seen, heard and loved. We create fun memories, we fight for justice
              and we acknowledge God in all we do.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-8">
          <h2 className="font-display text-2xl font-bold text-center">Wheels of Hope</h2>
          <p className="mt-1 text-center text-[var(--wt-text-2)]">A van that changes lives</p>
          <p className="mt-6 text-[var(--wt-text)] leading-relaxed max-w-3xl mx-auto">
            Every mile matters when a girl’s safety and future are on the line. Our <em>Wheels of Hope</em> campaign supports the
            purchase of a <strong>new van</strong> that does far more than provide transportation—it delivers{' '}
            <strong>security, dignity, and connection</strong>. The vans bring girls to <strong>safety</strong>, shuttle them to{' '}
            <strong>court hearings</strong> to seek justice, and take them to church and community activities that help them build
            trust with safe, caring people.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <GiveButterWidget />
          </div>
        </section>

        <section>
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Our programs and services</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map(p => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-bg)] overflow-hidden hover:border-[var(--wt-accent)] transition-colors"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.img}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[var(--wt-text)] group-hover:text-[var(--wt-accent)]">{p.title}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border border-[var(--wt-border)] py-16 px-6 text-center bg-cover bg-center relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in srgb, var(--wt-bg) 82%, transparent), color-mix(in srgb, var(--wt-bg) 88%, transparent)), url(https://www.lighthousesanctuary.org/wp-content/uploads/2025/03/HoldingHandsAtBeach-scaled-e1741390298312.jpg)",
          }}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold max-w-2xl mx-auto relative z-10">
            Bring safety, healing and empowerment to children in need
          </h2>
          <a
            href={ORG.paypalHosted}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-lg bg-[var(--wt-accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--wt-accent-hover)] transition-colors relative z-10"
          >
            Donate now
          </a>
        </section>

        <section>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10">Board of Directors</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BOARD.map(member => (
              <a
                key={member.href}
                href={member.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center group"
              >
                <div className="mx-auto w-36 h-36 rounded-full overflow-hidden border-2 border-[var(--wt-border)] group-hover:border-[var(--wt-accent)] transition-colors">
                  <img src={member.img} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="mt-3 font-semibold text-[var(--wt-text)] group-hover:text-[var(--wt-accent)]">{member.name}</p>
                <p className="text-sm text-[var(--wt-text-2)]">{member.role}</p>
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Recent posts</h2>
            <Link to="/blog" className="text-sm font-semibold text-[var(--wt-accent)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {RECENT_POSTS.map(post => (
              <article key={post.href} className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden flex flex-col">
                <img src={post.img} alt="" className="h-44 w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col">
                  <time className="text-xs uppercase tracking-widest text-[var(--wt-text-2)]">{post.date}</time>
                  <h3 className="mt-2 font-display text-lg font-bold text-[var(--wt-text)]">
                    <Link to={`/blog#${post.id}`} className="hover:text-[var(--wt-accent)]">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-[var(--wt-text-2)] leading-relaxed flex-1">{post.excerpt}</p>
                  <Link to={`/blog#${post.id}`} className="mt-4 text-sm font-semibold text-[var(--wt-accent)]">
                    Read on blog →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
