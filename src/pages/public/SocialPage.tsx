import { ORG } from '../../content/org'

export function SocialPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--wt-text)] tracking-tight">Social</h1>
      <p className="mt-2 text-[var(--wt-text-2)] max-w-2xl">Videos and updates from Lighthouse Sanctuary.</p>

      <div className="mt-10 max-w-4xl">
        <div className="aspect-video rounded-2xl overflow-hidden border border-[var(--wt-border)] bg-black">
          <iframe
            title="A Puzzle Piece in the Big Picture"
            src={`${ORG.youtubeEmbedPuzzle}?rel=0`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <h2 className="mt-12 font-display text-xl font-bold text-[var(--wt-text)]">
        For the most updated information check out our Lighthouse Sanctuary Facebook page
      </h2>
      <div className="mt-6 flex justify-start">
        <a href={ORG.facebook} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl border border-[var(--wt-border)] p-2 hover:border-[var(--wt-accent)] transition-colors">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
            alt="Facebook"
            width={80}
            height={80}
            className="rounded-lg"
          />
        </a>
      </div>
    </div>
  )
}
