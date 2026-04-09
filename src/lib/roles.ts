import type { User } from '@supabase/supabase-js'

/**
 * Role IDs — must match `public.roles` in Supabase exactly.
 *
 * id | name
 * ---+-----------------
 *  1 | social_media_rep
 *  2 | donor
 *  3 | staff
 *  4 | admin
 *  5 | user  (default on signup / fallback for accounts with no role row)
 */
export const ROLE_IDS = {
  SOCIAL_MEDIA_REP: 1,
  DONOR: 2,
  STAFF: 3,
  ADMIN: 4,
  /** Default role — all signed-in users without an explicit role fall back here. */
  USER: 5,
} as const

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]

const ALL_ASSIGNED = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.STAFF,
  ROLE_IDS.DONOR,
  ROLE_IDS.SOCIAL_MEDIA_REP,
  ROLE_IDS.USER,
] as const

/** Longest-prefix wins; order matters (most specific first). */
const ROUTE_ACCESS_RULES: { prefix: string; allowedRoleIds: readonly number[] }[] = [
  // Sensitive case-management routes: staff + admin only
  { prefix: '/portal/visitations', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF] },
  { prefix: '/portal/process-recordings', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF] },
  { prefix: '/portal/caseload', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF] },
  // Reports: staff, admin, and social_media_rep (they need outreach analytics)
  { prefix: '/portal/reports', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.SOCIAL_MEDIA_REP] },
  // Site users: admin only
  { prefix: '/portal/site-users', allowedRoleIds: [ROLE_IDS.ADMIN] },
  // Donors page: staff/admin full CRUD; non-staff roles do not access this staff view.
  {
    prefix: '/portal/donors',
    allowedRoleIds: [
      ROLE_IDS.ADMIN,
      ROLE_IDS.STAFF,
      ROLE_IDS.SOCIAL_MEDIA_REP,
    ],
  },
  // Your donations: any signed-in user
  { prefix: '/portal/your-donations', allowedRoleIds: [...ALL_ASSIGNED] },
  // Dashboard: staff/admin/social role views (donor sees their own donations page only).
  {
    prefix: '/portal',
    allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.SOCIAL_MEDIA_REP],
  },
]

export function normalizeAdminPath(pathname: string): string {
  if (!pathname) return '/'
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  return p
}

export function hasRoleId(roleIds: readonly number[], id: number): boolean {
  return roleIds.includes(id)
}

export function hasAnyRoleId(roleIds: readonly number[], candidates: readonly number[]): boolean {
  return candidates.some(id => roleIds.includes(id))
}

/** Admin/staff portal CRUD — not donors/social_media_rep viewing limited data. */
export function isStaffLike(roleIds: readonly number[]): boolean {
  return hasAnyRoleId(roleIds, [ROLE_IDS.ADMIN, ROLE_IDS.STAFF])
}

/**
 * Whether the user may open this pathname under `/portal`.
 * ADMIN (4) always returns true for any route under `/portal`.
 */
export function canAccessPath(roleIds: readonly number[], pathname: string): boolean {
  if (roleIds.includes(ROLE_IDS.ADMIN)) return true
  const path = normalizeAdminPath(pathname)
  if (!path.startsWith('/portal')) return false

  for (const rule of ROUTE_ACCESS_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return hasAnyRoleId(roleIds, rule.allowedRoleIds)
    }
  }
  return false
}

/** Same rules as routing: used to filter sidebar links. */
export function canAccessNavPath(roleIds: readonly number[], navPath: string): boolean {
  return canAccessPath(roleIds, navPath)
}

export type LegacyRoleLabel = 'admin' | 'staff' | 'social_media_rep' | 'donor' | 'member' | 'unknown'

/**
 * Human-readable primary label for the portal footer (best-effort from numeric roles).
 */
export function roleIdsToDisplayLabel(roleIds: readonly number[]): LegacyRoleLabel {
  if (roleIds.includes(ROLE_IDS.ADMIN)) return 'admin'
  if (roleIds.includes(ROLE_IDS.STAFF)) return 'staff'
  if (roleIds.includes(ROLE_IDS.SOCIAL_MEDIA_REP)) return 'social_media_rep'
  if (roleIds.includes(ROLE_IDS.DONOR)) return 'donor'
  if (roleIds.includes(ROLE_IDS.USER)) return 'member'
  return 'unknown'
}

/** Maps legacy JWT metadata `role` when `user_roles` has not synced yet. */
export function roleIdsFromMetadata(user: User | null): number[] {
  if (!user) return []
  const r = String(
    (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined) ??
      ''
  ).toLowerCase()
  if (r === 'admin') return [ROLE_IDS.ADMIN]
  if (r === 'staff') return [ROLE_IDS.STAFF]
  if (r === 'donor') return [ROLE_IDS.DONOR]
  if (r === 'social_media_rep') return [ROLE_IDS.SOCIAL_MEDIA_REP]
  return []
}

/**
 * Prefer DB `user_roles`; if empty, use JWT metadata; if still empty but session exists,
 * fall back to USER (5) so new accounts can open the portal without a role row.
 */
export function resolveEffectiveRoleIds(dbRoleIds: readonly number[], user: User | null): number[] {
  if (dbRoleIds.length > 0) return [...dbRoleIds]
  const fromMeta = roleIdsFromMetadata(user)
  if (fromMeta.length > 0) return fromMeta
  if (user) return [ROLE_IDS.USER]
  return []
}

export const ADMIN_NAV_PATHS = [
  '/portal',
  '/portal/donors',
  '/portal/caseload',
  '/portal/process-recordings',
  '/portal/visitations',
  '/portal/reports',
  '/portal/your-donations',
  '/portal/site-users',
] as const
