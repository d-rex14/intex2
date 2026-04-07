import type { User } from '@supabase/supabase-js'

/**
 * Aligns with Supabase `roles.role_id` / `user_roles.role_id`.
 * Union rule: if a user has multiple rows in `user_roles`, they may access any route
 * allowed for any of their role_ids. Role ADMIN (1) bypasses checks.
 */

/** Matches typical Lighthouse / Watchtower deployment; adjust if your `roles` table differs. */
export const ROLE_IDS = {
  ADMIN: 1,
  /** Donor capabilities (e.g. giving history); may be auto-granted after a donation. */
  DONOR: 2,
  STAFF: 3,
  /** Elevated operational access (e.g. coordinators); same route set as STAFF unless you split in DB. */
  COORDINATOR: 4,
  /** Default at signup; minimal portal access. */
  MEMBER: 5,
} as const

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]

const ALL_ASSIGNED = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.DONOR,
  ROLE_IDS.STAFF,
  ROLE_IDS.COORDINATOR,
  ROLE_IDS.MEMBER,
] as const

/** Longest-prefix wins; order matters (most specific first). */
const ROUTE_ACCESS_RULES: { prefix: string; allowedRoleIds: readonly number[] }[] = [
  { prefix: '/admin/reports', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.COORDINATOR] },
  { prefix: '/admin/visitations', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.COORDINATOR] },
  { prefix: '/admin/process-recordings', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.COORDINATOR] },
  { prefix: '/admin/caseload', allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.STAFF, ROLE_IDS.COORDINATOR] },
  {
    prefix: '/admin/donors',
    allowedRoleIds: [ROLE_IDS.ADMIN, ROLE_IDS.DONOR, ROLE_IDS.STAFF, ROLE_IDS.COORDINATOR],
  },
  { prefix: '/admin', allowedRoleIds: [...ALL_ASSIGNED] },
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

/**
 * Whether the user may open this pathname under `/admin`.
 * ADMIN (1) always returns true for routes under `/admin`.
 */
export function canAccessPath(roleIds: readonly number[], pathname: string): boolean {
  if (roleIds.includes(ROLE_IDS.ADMIN)) return true
  const path = normalizeAdminPath(pathname)
  if (!path.startsWith('/admin')) return false

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

export type LegacyRoleLabel = 'admin' | 'staff' | 'donor' | 'member' | 'unknown'

/**
 * Human-readable primary label for the portal footer (best-effort from numeric roles).
 */
export function roleIdsToDisplayLabel(roleIds: readonly number[]): LegacyRoleLabel {
  if (roleIds.includes(ROLE_IDS.ADMIN)) return 'admin'
  if (roleIds.includes(ROLE_IDS.STAFF)) return 'staff'
  if (roleIds.includes(ROLE_IDS.COORDINATOR)) return 'staff'
  if (roleIds.includes(ROLE_IDS.DONOR)) return 'donor'
  if (roleIds.includes(ROLE_IDS.MEMBER)) return 'member'
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
  return []
}

/**
 * Prefer DB `user_roles`; if empty, use JWT metadata; if still empty but session exists,
 * assume MEMBER (5) so the portal remains usable before the signup trigger runs.
 */
export function resolveEffectiveRoleIds(dbRoleIds: readonly number[], user: User | null): number[] {
  if (dbRoleIds.length > 0) return [...dbRoleIds]
  const fromMeta = roleIdsFromMetadata(user)
  if (fromMeta.length > 0) return fromMeta
  if (user) return [ROLE_IDS.MEMBER]
  return []
}

export const ADMIN_NAV_PATHS = [
  '/admin',
  '/admin/donors',
  '/admin/caseload',
  '/admin/process-recordings',
  '/admin/visitations',
  '/admin/reports',
] as const
