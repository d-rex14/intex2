# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Watchtower** — A secure operations and impact platform for survivor care, donor stewardship, and outreach analytics for a nonprofit organization (Lighthouse Sanctuary). Built as a capstone project (INTEX) for BYU IS 413/414.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build to ./dist
npm run preview      # Preview production build locally
```

No test runner or linter is currently configured.

## Environment Variables

Required for Supabase connection (create a `.env` file):
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

The app gracefully degrades if these are missing (auth features disabled).

## Architecture

**Frontend-only React app** (backend not yet built). Uses Supabase for auth and data.

### Routing & Layout

All routes are defined in `src/App.tsx`. Two layout wrappers:
- `PublicLayout` — public-facing pages (nav + footer)
- `AdminLayout` — authenticated admin portal (collapsible sidebar + header)

Public routes: `/`, `/impact`, `/privacy`, `/login`
Protected routes (require auth): `/admin/*` — wrapped with `RequireAuth`

### Authentication

`src/context/AuthContext.tsx` manages session state via Supabase. Role is read from `user.user_metadata.role` or `app_metadata.role`. Roles: `admin | staff | donor | unknown`.

Use the `useAuth()` hook to access `{ session, user, role, loading, signInWithPassword, signOut }`.

### Data Fetching

`src/hooks/useSupabaseQuery.ts` — generic hook for Supabase queries with loading/error/refetch states and race condition cleanup. Use this for all Supabase reads.

### Current State

All admin pages (`/admin/donors`, `/admin/caseload`, `/admin/process-recordings`, `/admin/visitations`, `/admin/reports`) render placeholder components. These need real implementations connected to Supabase.

### Data Model

17 sample CSV files in `data/lighthouse_csv_v7/` represent the full schema across three domains:
- **Case Management**: residents, process_recordings, home_visitations, education_records, health_wellbeing_records, intervention_plans, incident_reports, safehouse_monthly_metrics
- **Donor & Support**: supporters, donations, in_kind_donation_items, donation_allocations, partners, partner_assignments, safehouses
- **Outreach**: social_media_posts, public_impact_snapshots

### Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS 4 (via `@tailwindcss/vite` — no postcss config needed)
- React Router 6
- Supabase JS client (auth + database)
- Lucide React (icons)

### Styling Conventions

Dark theme: navy background (`#0a0e1a`), card surface (`#0f1729`), amber accent (`#f59e0b`). Use Tailwind utility classes. Mobile-responsive with `sm:`, `md:`, `lg:` breakpoints.

## Requirements Reference

`INTEX-Case.md` contains the full project specification including:
- Security requirements (RBAC, HTTPS, password policies, secrets management)
- Detailed feature requirements per admin page
- Grading criteria and deliverables



