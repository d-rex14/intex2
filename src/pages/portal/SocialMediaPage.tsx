import { type ReactNode, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { invalidatePortalDashboard } from '../../lib/portalDataEvents'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type SocialMediaPost = {
  post_id: number
  platform: string | null
  platform_post_id: string | null
  post_url: string | null
  created_at: string | null
  day_of_week: string | null
  post_hour: number | null
  post_type: string | null
  media_type: string | null
  caption: string | null
  hashtags: string | null
  num_hashtags: number | null
  mentions_count: number | null
  has_call_to_action: boolean | null
  call_to_action_type: string | null
  content_topic: string | null
  sentiment_tone: string | null
  caption_length: number | null
  features_resident_story: boolean | null
  campaign_name: string | null
  is_boosted: boolean | null
  boost_budget_php: number | null
  impressions: number | null
  reach: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  click_throughs: number | null
  video_views: number | null
  engagement_rate: number | null
  profile_visits: number | null
  donation_referrals: number | null
  estimated_donation_value_php: number | null
  follower_count_at_post: number | null
  watch_time_seconds: number | null
  avg_view_duration_seconds: number | null
  subscriber_count_at_post: number | null
  forwards: number | null
}

type PostDraft = {
  platform: string
  platform_post_id: string
  post_url: string
  created_at: string
  day_of_week: string
  post_hour: string
  post_type: string
  media_type: string
  caption: string
  hashtags: string
  num_hashtags: string
  mentions_count: string
  has_call_to_action: boolean
  call_to_action_type: string
  content_topic: string
  sentiment_tone: string
  caption_length: string
  features_resident_story: boolean
  campaign_name: string
  is_boosted: boolean
  boost_budget_php: string
  impressions: string
  reach: string
  likes: string
  comments: string
  shares: string
  saves: string
  click_throughs: string
  video_views: string
  engagement_rate: string
  profile_visits: string
  donation_referrals: string
  estimated_donation_value_php: string
  follower_count_at_post: string
  watch_time_seconds: string
  avg_view_duration_seconds: string
  subscriber_count_at_post: string
  forwards: string
}

const BLANK_DRAFT: PostDraft = {
  platform: '',
  platform_post_id: '',
  post_url: '',
  created_at: '',
  day_of_week: '',
  post_hour: '',
  post_type: '',
  media_type: '',
  caption: '',
  hashtags: '',
  num_hashtags: '',
  mentions_count: '',
  has_call_to_action: false,
  call_to_action_type: '',
  content_topic: '',
  sentiment_tone: '',
  caption_length: '',
  features_resident_story: false,
  campaign_name: '',
  is_boosted: false,
  boost_budget_php: '',
  impressions: '',
  reach: '',
  likes: '',
  comments: '',
  shares: '',
  saves: '',
  click_throughs: '',
  video_views: '',
  engagement_rate: '',
  profile_visits: '',
  donation_referrals: '',
  estimated_donation_value_php: '',
  follower_count_at_post: '',
  watch_time_seconds: '',
  avg_view_duration_seconds: '',
  subscriber_count_at_post: '',
  forwards: '',
}

function toDraft(p?: SocialMediaPost): PostDraft {
  if (!p) return { ...BLANK_DRAFT }
  return {
    platform: p.platform ?? '',
    platform_post_id: p.platform_post_id ?? '',
    post_url: p.post_url ?? '',
    created_at: (p.created_at ?? '').slice(0, 16),
    day_of_week: p.day_of_week ?? '',
    post_hour: p.post_hour != null ? String(p.post_hour) : '',
    post_type: p.post_type ?? '',
    media_type: p.media_type ?? '',
    caption: p.caption ?? '',
    hashtags: p.hashtags ?? '',
    num_hashtags: p.num_hashtags != null ? String(p.num_hashtags) : '',
    mentions_count: p.mentions_count != null ? String(p.mentions_count) : '',
    has_call_to_action: Boolean(p.has_call_to_action),
    call_to_action_type: p.call_to_action_type ?? '',
    content_topic: p.content_topic ?? '',
    sentiment_tone: p.sentiment_tone ?? '',
    caption_length: p.caption_length != null ? String(p.caption_length) : '',
    features_resident_story: Boolean(p.features_resident_story),
    campaign_name: p.campaign_name ?? '',
    is_boosted: Boolean(p.is_boosted),
    boost_budget_php: p.boost_budget_php != null ? String(p.boost_budget_php) : '',
    impressions: p.impressions != null ? String(p.impressions) : '',
    reach: p.reach != null ? String(p.reach) : '',
    likes: p.likes != null ? String(p.likes) : '',
    comments: p.comments != null ? String(p.comments) : '',
    shares: p.shares != null ? String(p.shares) : '',
    saves: p.saves != null ? String(p.saves) : '',
    click_throughs: p.click_throughs != null ? String(p.click_throughs) : '',
    video_views: p.video_views != null ? String(p.video_views) : '',
    engagement_rate: p.engagement_rate != null ? String(p.engagement_rate) : '',
    profile_visits: p.profile_visits != null ? String(p.profile_visits) : '',
    donation_referrals: p.donation_referrals != null ? String(p.donation_referrals) : '',
    estimated_donation_value_php: p.estimated_donation_value_php != null ? String(p.estimated_donation_value_php) : '',
    follower_count_at_post: p.follower_count_at_post != null ? String(p.follower_count_at_post) : '',
    watch_time_seconds: p.watch_time_seconds != null ? String(p.watch_time_seconds) : '',
    avg_view_duration_seconds: p.avg_view_duration_seconds != null ? String(p.avg_view_duration_seconds) : '',
    subscriber_count_at_post: p.subscriber_count_at_post != null ? String(p.subscriber_count_at_post) : '',
    forwards: p.forwards != null ? String(p.forwards) : '',
  }
}

function draftToPayload(d: PostDraft): Record<string, unknown> {
  const num = (v: string) => v.trim() === '' ? null : Number(v)
  return {
    platform: d.platform || null,
    platform_post_id: d.platform_post_id || null,
    post_url: d.post_url || null,
    created_at: d.created_at || null,
    day_of_week: d.day_of_week || null,
    post_hour: num(d.post_hour),
    post_type: d.post_type || null,
    media_type: d.media_type || null,
    caption: d.caption || null,
    hashtags: d.hashtags || null,
    num_hashtags: num(d.num_hashtags),
    mentions_count: num(d.mentions_count),
    has_call_to_action: d.has_call_to_action,
    call_to_action_type: d.call_to_action_type || null,
    content_topic: d.content_topic || null,
    sentiment_tone: d.sentiment_tone || null,
    caption_length: num(d.caption_length),
    features_resident_story: d.features_resident_story,
    campaign_name: d.campaign_name || null,
    is_boosted: d.is_boosted,
    boost_budget_php: num(d.boost_budget_php),
    impressions: num(d.impressions),
    reach: num(d.reach),
    likes: num(d.likes),
    comments: num(d.comments),
    shares: num(d.shares),
    saves: num(d.saves),
    click_throughs: num(d.click_throughs),
    video_views: num(d.video_views),
    engagement_rate: num(d.engagement_rate),
    profile_visits: num(d.profile_visits),
    donation_referrals: num(d.donation_referrals),
    estimated_donation_value_php: num(d.estimated_donation_value_php),
    follower_count_at_post: num(d.follower_count_at_post),
    watch_time_seconds: num(d.watch_time_seconds),
    avg_view_duration_seconds: num(d.avg_view_duration_seconds),
    subscriber_count_at_post: num(d.subscriber_count_at_post),
    forwards: num(d.forwards),
  }
}

async function fetchPosts(): Promise<{ data: SocialMediaPost[] | null; error: { message: string } | null }> {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured.' } }
  const { data, error } = await supabase.from('social_media_posts').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: { message: error.message } }
  return { data: (data ?? []) as SocialMediaPost[], error: null }
}

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'Facebook', 'Twitter', 'WhatsApp']
const POST_TYPE_OPTIONS = ['FundraisingAppeal', 'EducationalContent', 'EventPromotion', 'Awareness', 'ImpactStory', 'PartnerShoutout', 'Other']
const MEDIA_TYPE_OPTIONS = ['Text', 'Photo', 'Video', 'Carousel', 'Reel', 'Story', 'Other']
const DAY_OF_WEEK_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const CTA_TYPE_OPTIONS = ['LearnMore', 'DonateNow', 'SignUp', 'ContactUs', 'VisitWebsite', 'Other']
const CONTENT_TOPIC_OPTIONS = ['Education', 'Health', 'Fundraising', 'Advocacy', 'Community', 'Events', 'Other']
const SENTIMENT_TONE_OPTIONS = ['Grateful', 'Celebratory', 'Urgent', 'Hopeful', 'Informative', 'Empathetic', 'Other']

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const inputCls =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)] w-full'
const selectCls =
  'rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]'
const labelCls = 'flex flex-col gap-1'
const labelTextCls = 'text-xs font-medium text-[var(--wt-text-2)]'

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelCls}>
      <span className={labelTextCls}>{label}</span>
      {children}
    </label>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-full mt-2">
      <p className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)] border-b border-[var(--wt-border)] pb-1">{title}</p>
    </div>
  )
}

export function SocialMediaPage() {
  const postsQuery = useMemo(() => () => fetchPosts(), [])
  const { data: posts, loading, error, refetch } = useSupabaseQuery<SocialMediaPost[]>(postsQuery)

  const [platformFilter, setPlatformFilter] = useState('all')
  const [postTypeFilter, setPostTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(25)
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<PostDraft>({ ...BLANK_DRAFT })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const platforms = useMemo(() => {
    const s = new Set((posts ?? []).map(p => p.platform).filter(Boolean) as string[])
    return [...s].sort()
  }, [posts])

  const postTypes = useMemo(() => {
    const s = new Set((posts ?? []).map(p => p.post_type).filter(Boolean) as string[])
    return [...s].sort()
  }, [posts])

  const filtered = useMemo(() => {
    let rows = posts ?? []
    if (platformFilter !== 'all') rows = rows.filter(r => r.platform === platformFilter)
    if (postTypeFilter !== 'all') rows = rows.filter(r => r.post_type === postTypeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        (r.caption ?? '').toLowerCase().includes(q) ||
        (r.campaign_name ?? '').toLowerCase().includes(q) ||
        (r.platform_post_id ?? '').toLowerCase().includes(q) ||
        String(r.post_id).includes(q)
      )
    }
    return rows
  }, [posts, platformFilter, postTypeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  function openCreate() {
    setEditingId(null)
    setDraft({ ...BLANK_DRAFT })
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(post: SocialMediaPost) {
    setEditingId(post.post_id)
    setDraft(toDraft(post))
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
  }

  function set(field: keyof PostDraft, value: string | boolean) {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setFormError(null)
    const basePayload = draftToPayload(draft)
    const payload =
      editingId == null && !(draft.created_at ?? '').trim()
        ? { ...basePayload, created_at: new Date().toISOString() }
        : basePayload
    let dbError: string | null = null
    if (editingId == null) {
      const { error } = await supabase.from('social_media_posts').insert(payload)
      dbError = error?.message ?? null
    } else {
      const { error } = await supabase.from('social_media_posts').update(payload).eq('post_id', editingId)
      dbError = error?.message ?? null
    }
    setSaving(false)
    if (dbError) {
      setFormError(dbError)
    } else {
      closeModal()
      refetch()
      invalidatePortalDashboard()
    }
  }

  async function handleDelete(postId: number) {
    if (!supabase) return
    const ok = window.confirm(`Delete post #${postId}? This cannot be undone.`)
    if (!ok) return
    const { error } = await supabase.from('social_media_posts').delete().eq('post_id', postId)
    if (error) setFormError(error.message)
    else {
      refetch()
      invalidatePortalDashboard()
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] p-6">
        <p className="text-sm text-[var(--wt-text-2)]">
          Set <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to load social media data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--wt-text)]">Social Media</h1>
          <p className="text-sm text-[var(--wt-text-2)] mt-1">
            Log and manage social media posts to track performance and retrain the strategy model on new data.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white shrink-0">
          + Add Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-center rounded-xl border border-[var(--wt-border)] bg-[var(--wt-surface)] px-4 py-3 text-sm">
        <label className="flex flex-col gap-1 min-w-[14rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Search</span>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Post ID, caption, campaign..."
            className="rounded-lg border border-[var(--wt-border)] bg-[var(--wt-bg)] px-3 py-2 text-sm text-[var(--wt-text)] outline-none focus:border-[var(--wt-accent)]"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Platform</span>
          <select className={selectCls} value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setPage(1) }}>
            <option value="all">All platforms</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[10rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Post type</span>
          <select className={selectCls} value={postTypeFilter} onChange={e => { setPostTypeFilter(e.target.value); setPage(1) }}>
            <option value="all">All types</option>
            {postTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-[8rem]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--wt-text-2)]">Rows per page</span>
          <select className={selectCls} value={pageSize} onChange={e => { setPageSize(Number(e.target.value) as 10 | 25 | 50); setPage(1) }}>
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {formError && <p className="text-sm text-[#dc2626]">{formError}</p>}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--wt-text-2)] text-sm">
            <div className="w-6 h-6 border-2 border-[var(--wt-accent)] border-t-transparent rounded-full animate-spin" />
            Loading posts…
          </div>
        ) : error ? (
          <div className="p-6"><p className="text-sm text-[#dc2626]">{error}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wt-border)] text-[var(--wt-text-2)] uppercase text-[10px] tracking-widest">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Platform</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Post type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Media type</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Engagement rate</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Impressions</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Donation referrals</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Boosted</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-[var(--wt-text-2)]">No posts found.</td>
                  </tr>
                ) : pagedRows.map(p => (
                  <tr key={p.post_id} className="border-b border-[var(--wt-border)] last:border-0 hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]">
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap font-medium">#{p.post_id}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{p.platform ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{p.post_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{p.media_type ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{(p.created_at ?? '').slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {p.engagement_rate != null ? `${(p.engagement_rate * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{p.impressions?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">{p.donation_referrals ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--wt-text)] whitespace-nowrap">
                      {p.is_boosted ? (
                        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Yes</span>
                      ) : (
                        <span className="text-[var(--wt-text-2)] text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-md border border-[var(--wt-border)] px-3 py-1 text-xs font-medium text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_12%,transparent)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.post_id)}
                          className="rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--wt-text-2)]">
          <span>{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs">Page {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-[var(--wt-border)] px-3 py-1.5 text-xs hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--wt-border)] bg-[var(--wt-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--wt-border)] px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[var(--wt-text)]">
                {editingId == null ? 'Add Post' : `Edit Post #${editingId}`}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 text-[var(--wt-text-2)] hover:text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_10%,transparent)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <SectionHeader title="Post Info" />

                <FieldLabel label="Platform">
                  <select className={`${selectCls} w-full`} value={draft.platform} onChange={e => set('platform', e.target.value)}>
                    <option value="">— select —</option>
                    {PLATFORM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Post type">
                  <select className={`${selectCls} w-full`} value={draft.post_type} onChange={e => set('post_type', e.target.value)}>
                    <option value="">— select —</option>
                    {POST_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Media type">
                  <select className={`${selectCls} w-full`} value={draft.media_type} onChange={e => set('media_type', e.target.value)}>
                    <option value="">— select —</option>
                    {MEDIA_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Posted at">
                  <input type="datetime-local" className={inputCls} value={draft.created_at} onChange={e => set('created_at', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Platform post ID">
                  <input type="text" className={inputCls} value={draft.platform_post_id} onChange={e => set('platform_post_id', e.target.value)} placeholder="e.g. 1234567890" />
                </FieldLabel>

                <FieldLabel label="Post URL">
                  <input type="url" className={inputCls} value={draft.post_url} onChange={e => set('post_url', e.target.value)} placeholder="https://..." />
                </FieldLabel>

                <div className="col-span-full">
                  <FieldLabel label="Caption">
                    <textarea className={inputCls} rows={3} value={draft.caption} onChange={e => set('caption', e.target.value)} placeholder="Post caption text…" />
                  </FieldLabel>
                </div>

                <div className="col-span-full">
                  <FieldLabel label="Hashtags">
                    <input type="text" className={inputCls} value={draft.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="#tag1, #tag2" />
                  </FieldLabel>
                </div>

                <SectionHeader title="Strategy" />

                <FieldLabel label="Day of week">
                  <select className={`${selectCls} w-full`} value={draft.day_of_week} onChange={e => set('day_of_week', e.target.value)}>
                    <option value="">— select —</option>
                    {DAY_OF_WEEK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Post hour (0–23)">
                  <input type="number" min={0} max={23} className={inputCls} value={draft.post_hour} onChange={e => set('post_hour', e.target.value)} placeholder="e.g. 14" />
                </FieldLabel>

                <FieldLabel label="Content topic">
                  <select className={`${selectCls} w-full`} value={draft.content_topic} onChange={e => set('content_topic', e.target.value)}>
                    <option value="">— select —</option>
                    {CONTENT_TOPIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Sentiment tone">
                  <select className={`${selectCls} w-full`} value={draft.sentiment_tone} onChange={e => set('sentiment_tone', e.target.value)}>
                    <option value="">— select —</option>
                    {SENTIMENT_TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="Num hashtags">
                  <input type="number" min={0} className={inputCls} value={draft.num_hashtags} onChange={e => set('num_hashtags', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Mentions count">
                  <input type="number" min={0} className={inputCls} value={draft.mentions_count} onChange={e => set('mentions_count', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Caption length (chars)">
                  <input type="number" min={0} className={inputCls} value={draft.caption_length} onChange={e => set('caption_length', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Campaign name">
                  <input type="text" className={inputCls} value={draft.campaign_name} onChange={e => set('campaign_name', e.target.value)} placeholder="e.g. GivingTuesday2025" />
                </FieldLabel>

                <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-6">
                  <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] cursor-pointer">
                    <input type="checkbox" checked={draft.has_call_to_action} onChange={e => set('has_call_to_action', e.target.checked)} className="h-4 w-4 accent-[var(--wt-accent)]" />
                    Has call to action
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] cursor-pointer">
                    <input type="checkbox" checked={draft.features_resident_story} onChange={e => set('features_resident_story', e.target.checked)} className="h-4 w-4 accent-[var(--wt-accent)]" />
                    Features resident story
                  </label>
                </div>

                {draft.has_call_to_action && (
                  <FieldLabel label="Call to action type">
                    <select className={`${selectCls} w-full`} value={draft.call_to_action_type} onChange={e => set('call_to_action_type', e.target.value)}>
                      <option value="">— select —</option>
                      {CTA_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FieldLabel>
                )}

                <SectionHeader title="Promotion" />

                <label className="flex items-center gap-2 text-sm text-[var(--wt-text)] cursor-pointer col-span-full">
                  <input type="checkbox" checked={draft.is_boosted} onChange={e => set('is_boosted', e.target.checked)} className="h-4 w-4 accent-[var(--wt-accent)]" />
                  Boosted post
                </label>

                {draft.is_boosted && (
                  <FieldLabel label="Boost budget (PHP)">
                    <input type="number" min={0} step="0.01" className={inputCls} value={draft.boost_budget_php} onChange={e => set('boost_budget_php', e.target.value)} />
                  </FieldLabel>
                )}

                <SectionHeader title="Performance" />

                {(
                  [
                    ['impressions', 'Impressions'],
                    ['reach', 'Reach'],
                    ['likes', 'Likes'],
                    ['comments', 'Comments'],
                    ['shares', 'Shares'],
                    ['saves', 'Saves'],
                    ['click_throughs', 'Click-throughs'],
                    ['video_views', 'Video views'],
                    ['profile_visits', 'Profile visits'],
                    ['donation_referrals', 'Donation referrals'],
                    ['forwards', 'Forwards'],
                    ['watch_time_seconds', 'Watch time (s)'],
                    ['follower_count_at_post', 'Follower count at post'],
                    ['subscriber_count_at_post', 'Subscriber count at post'],
                  ] as [keyof PostDraft, string][]
                ).map(([field, label]) => (
                  <FieldLabel key={field} label={label}>
                    <input type="number" min={0} className={inputCls} value={draft[field] as string} onChange={e => set(field, e.target.value)} />
                  </FieldLabel>
                ))}

                <FieldLabel label="Engagement rate (decimal, e.g. 0.05)">
                  <input type="number" min={0} step="0.0001" className={inputCls} value={draft.engagement_rate} onChange={e => set('engagement_rate', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Avg view duration (s)">
                  <input type="number" min={0} step="0.01" className={inputCls} value={draft.avg_view_duration_seconds} onChange={e => set('avg_view_duration_seconds', e.target.value)} />
                </FieldLabel>

                <FieldLabel label="Est. donation value (PHP)">
                  <input type="number" min={0} step="0.01" className={inputCls} value={draft.estimated_donation_value_php} onChange={e => set('estimated_donation_value_php', e.target.value)} />
                </FieldLabel>

              </div>

              {formError && <p className="text-sm text-[#dc2626]">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2 border-t border-[var(--wt-border)]">
                <button type="button" onClick={closeModal} className="rounded-lg border border-[var(--wt-border)] px-4 py-2 text-sm text-[var(--wt-text)] hover:bg-[color-mix(in_srgb,var(--wt-accent-2)_8%,transparent)]">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-[var(--wt-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? 'Saving…' : editingId == null ? 'Add Post' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
