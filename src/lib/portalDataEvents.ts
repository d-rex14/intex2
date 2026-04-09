/** Cross-page portal refresh (e.g. dashboard stats after CRUD elsewhere). */
export const PORTAL_DASHBOARD_INVALIDATE = 'watchtower:invalidate-dashboard'

export function invalidatePortalDashboard(): void {
  window.dispatchEvent(new CustomEvent(PORTAL_DASHBOARD_INVALIDATE))
}
