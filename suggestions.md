# Frontend Suggestions for Future Builds

Suggestions based on the current React/TypeScript codebase and INTEX requirements. Grouped by priority.

---

## High Priority (Affects Grading)

### 1. Replace Supabase Auth with Backend JWT
`src/context/AuthContext.tsx` is fully wired to Supabase. Once the .NET backend is ready:
- Replace `supabase.auth.signInWithPassword` with `POST /api/auth/login`
- Store JWT in an `httpOnly` cookie (preferred for IS 414) or `localStorage`
- Update `RequireAuth` to decode and validate the JWT on the client side
- Expose role from the JWT payload to drive RBAC in the UI

### 2. Implement All 6 Admin Page Placeholders
All routes in `src/App.tsx` render `<AdminPlaceholder>`. Each page needs:
- A data-fetching layer using the existing `useSupabaseQuery` hook pattern (swap to `fetch` against .NET API)
- A table/list view with pagination (required by IS 413 spec)
- CRUD forms with validation
- Delete confirmations (required by IS 414)

Pages: `/admin/donors`, `/admin/caseload`, `/admin/process-recordings`, `/admin/visitations`, `/admin/reports`

### 3. Make Cookie Consent Fully Functional
`src/components/CookieConsent.tsx` is currently cosmetic. IS 414 awards points specifically for "fully functional" vs. cosmetic:
- On first visit, block all non-essential cookies until accepted
- Store the consent preference in a **non-httpOnly** browser cookie (IS 414 also awards points for a readable user-preference cookie)
- On acceptance, enable analytics scripts dynamically
- Add "Manage Preferences" for granular control (optional but looks polished)

### 4. Add Charts to Reports & Analytics Page
IS 413 expects visualized aggregated insights. Add `recharts` (lightweight, React-native):
```bash
npm install recharts
```
Charts to build: donation trends over time (LineChart), resident outcome metrics (BarChart), safehouse comparison (BarChart), reintegration success rates (PieChart).

### 5. Connect `/impact` to Real Data
The Impact/Donor-Facing Dashboard at `/impact` is currently a placeholder. Wire it to `GET /api/impact` — this is a public endpoint (no auth) that returns anonymized aggregate stats from `public_impact_snapshots.csv`.

---

## Medium Priority (Polish + Score Boosters)

### 6. Add ML Result Displays
Three places to surface ML model outputs:
- **Donors page:** Churn risk badge (Low/Medium/High) next to each donor row — pull from `GET /api/ml/donor-churn-risk`
- **Caseload page:** Readiness indicator badge on each resident — pull from `GET /api/ml/reintegration-readiness`
- **Reports page:** Social media optimizer panel with best platform/time/type recommendations + a "score my post" input form

### 7. Add `recharts` Accessibility Attributes
Lighthouse accessibility scoring (target ≥ 90%) will flag charts without ARIA labels. Add `aria-label` to all chart containers and ensure color contrast meets WCAG AA.

### 8. Pagination
IS 413 explicitly lists pagination as a finishing touch that separates good from excellent. Add pagination to all tables in admin pages. A simple pattern:
```tsx
const [page, setPage] = useState(1)
const PAGE_SIZE = 20
const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
```

### 9. Filter and Search on Caseload Inventory
IS 413 explicitly requires filtering by case status, safehouse, case category. Add a filter bar at the top of the caseload page with dropdowns for these three fields plus a text search on resident name.

### 10. Role-Based UI Rendering
The `useAuth()` hook already exposes `role`. Use it to conditionally render:
- CUD buttons (only show Add/Edit/Delete for `admin` role)
- Donor history section (only show for `donor` role)
- This prevents confusion and aligns with the RBAC requirements in IS 414

---

## Lower Priority (Nice-to-Haves)

### 11. Light/Dark Mode Toggle with Cookie
IS 414 awards bonus points for a browser-accessible (non-httpOnly) cookie that saves a user setting used by React. Light/dark mode is the cleanest implementation:
- Store `theme=dark` or `theme=light` in a readable cookie
- Read it on app load in `main.tsx` and apply a `data-theme` attribute
- Tailwind `dark:` variants handle the rest

### 12. Error Boundaries
Wrap each admin page in a React Error Boundary so a broken API response on one page doesn't crash the entire app.

### 13. Loading Skeletons
Replace the current `loading...` text fallbacks with Tailwind-animated skeleton placeholders — a small touch that reads as polished during the live demo.

### 14. Page Titles
Each route should set a unique `<title>` tag. Use a small `useEffect` per page or a `<Helmet>` library. Lighthouse and accessibility scores penalize missing/duplicate titles.

### 15. Toast Notifications for CRUD Actions
After a successful create/update/delete, show a brief toast notification (e.g., "Resident saved successfully"). Avoids the need for full-page refreshes and makes the app feel responsive.

---

## Code Quality Notes

- `src/hooks/useSupabaseQuery.ts` is well-structured — extend this pattern for all `.NET` API calls rather than writing raw `useEffect` + `fetch` logic each time.
- The `AuthContext` memo pattern is already correct — don't refactor it.
- Tailwind v4 is used via `@tailwindcss/vite` — no `tailwind.config.js` needed. Keep it that way.
