# Watchtower

**Secure operations and impact platform for survivor care, donor stewardship, and outreach analytics.**

Built as a capstone project (BYU IS 413/414 — INTEX) for **Lighthouse Sanctuary**, a 501(c)(3) nonprofit operating safe homes for girls who are survivors of sexual abuse and sex trafficking in the Philippines.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Authentication & Roles](#authentication--roles)
- [Data Model](#data-model)
- [ML Pipelines](#ml-pipelines)
- [Deployment](#deployment)
- [Security](#security)
- [Team](#team)

---

## Overview

Watchtower gives Lighthouse Sanctuary staff a unified platform to:

1. **Donor Management** — Track supporter engagement, predict churn, personalize outreach, and link donations to resident outcomes.
2. **Case Management** — Monitor resident caseloads, process counseling recordings, log home visitations, and manage intervention plans.
3. **Outreach Analytics** — Analyze social media performance and surface anonymized public impact snapshots for donor communications.

The frontend is a React single-page application backed by Supabase for auth and data. All admin pages require authentication; public-facing pages (home, impact, privacy) are open.

---

## Features

### Public Site
- **Homepage** — Mission overview and organizational story
- **Impact Page** — Anonymized outcome metrics for public and donor audiences
- **Privacy Policy** — GDPR/data handling transparency
- **Cookie Consent** — Compliant consent dialog

### Admin Portal (`/admin/*`, requires auth)
| Route | Description |
|---|---|
| `/admin/dashboard` | High-level KPIs and activity summary |
| `/admin/donors` | Donor directory, giving history, churn predictions |
| `/admin/caseload` | Resident inventory with risk and reintegration status |
| `/admin/process-recordings` | Counseling session logs and outcome tagging |
| `/admin/visitations` | Home visitation records and family assessments |
| `/admin/reports` | Aggregated reporting across all domains |

### Authentication
- Email/password sign-in and sign-up
- OAuth via Google and GitHub
- Role-based access control (admin, staff, donor)
- Graceful degradation when Supabase is not configured

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Routing | React Router 6 |
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| Icons | Lucide React |
| ML Pipelines | Python / Jupyter Notebooks |
| Deployment | Vercel |

---

## Project Structure

```
intex2/
├── src/
│   ├── App.tsx                  # Route definitions and layout wrappers
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global styles and Tailwind design tokens
│   ├── components/
│   │   └── CookieConsent.tsx    # Cookie consent dialog
│   ├── context/
│   │   └── AuthContext.tsx      # Supabase session + role management
│   ├── hooks/
│   │   └── useSupabaseQuery.ts  # Generic data-fetching hook
│   ├── layouts/
│   │   ├── PublicLayout.tsx     # Nav + footer for public pages
│   │   └── AdminLayout.tsx      # Collapsible sidebar + header for admin
│   └── lib/
│       └── supabase.ts          # Supabase client initialization
├── data/
│   └── raw/                     # 17 CSV files (full schema sample data)
├── ml-pipelines/                # 5 Jupyter notebooks for ML predictions
├── INTEX-Case.md                # Full project specification
├── CLAUDE.md                    # Development guidance
├── vercel.json                  # Vercel deployment config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema loaded from `data/raw/`

### Installation

```bash
git clone https://github.com/your-org/intex2.git
cd intex2
npm install
```

### Development

```bash
npm run dev
# App runs at http://localhost:5173
```

### Production Build

```bash
npm run build       # Outputs to ./dist
npm run preview     # Preview the production build locally
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

The app will run without these variables but auth and data features will be disabled.

> **Never commit `.env` to version control.** It is listed in `.gitignore`.

---

## Architecture

### Routing & Layouts

All routes are declared in `src/App.tsx` using two layout wrappers:

- **`PublicLayout`** — wraps public pages with a shared navigation bar and footer.
- **`AdminLayout`** — wraps authenticated admin pages with a collapsible sidebar and header.

Protected admin routes are wrapped with a `RequireAuth` guard that redirects unauthenticated users to `/login`.

```
/                    → PublicLayout → HomePage
/impact              → PublicLayout → ImpactPage
/privacy             → PublicLayout → PrivacyPage
/login               → PublicLayout → LoginPage
/auth/callback       → AuthCallbackPage
/admin/*             → RequireAuth → AdminLayout → [admin pages]
```

### Data Fetching

`src/hooks/useSupabaseQuery.ts` is a generic hook for all Supabase reads:

```typescript
const { data, loading, error, refetch } = useSupabaseQuery(
  () => supabase.from('residents').select('*')
)
```

It handles loading/error state, race condition cleanup via cancellation tokens, and a `refetch()` trigger.

### Design System

The app uses a light cream theme defined as CSS custom properties in `src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--wt-bg` | `#fff6e9` | Page background |
| `--wt-surface` | `#f1e9da` | Card surfaces |
| `--wt-accent` | `#f4a261` | Primary CTA (orange) |
| `--wt-accent-2` | `#a8dadc` | Secondary accent (blue) |
| `--wt-text` | `#2f2f2f` | Body text |
| `--wt-muted` | `#6b6b6b` | Secondary text |

All styling uses Tailwind utility classes. Breakpoints: `sm:`, `md:`, `lg:`.

---

## Authentication & Roles

Authentication is managed in `src/context/AuthContext.tsx` via the Supabase JS client.

### Methods

| Method | Description |
|---|---|
| `signInWithPassword(email, password)` | Email/password login |
| `signUpWithPassword(email, password)` | New account registration |
| `signInWithOAuth('google' \| 'github')` | OAuth login with redirect |
| `signOut()` | Clears the session |

### Roles

Role is read from `user.user_metadata.role` or `app_metadata.role` at login:

| Role | Access |
|---|---|
| `admin` | Full access to all admin pages and data |
| `staff` | Case management and reporting |
| `donor` | Donor-facing views and impact data |
| `unknown` | Authenticated but no role assigned |

Use the `useAuth()` hook anywhere in the component tree:

```typescript
const { session, user, role, loading, signOut } = useAuth()
```

---

## Data Model

17 CSV files in `data/raw/` define the full schema across three domains.

### Case Management

| Table | Description |
|---|---|
| `residents` | 600+ case records — demographics, risk scores, reintegration status |
| `process_recordings` | 1000+ counseling sessions — emotional state, interventions, follow-up |
| `home_visitations` | Family assessment visits — observations and safety concerns |
| `education_records` | Monthly enrollment, attendance, and academic progress |
| `health_wellbeing_records` | Monthly physical health, nutrition, sleep, and energy scores |
| `intervention_plans` | Goals and services by domain (Safety, Psychosocial, Education, etc.) |
| `incident_reports` | Behavioral and security incidents with severity and resolution |
| `safehouse_monthly_metrics` | Pre-aggregated monthly outcomes per facility |

### Donor & Operations

| Table | Description |
|---|---|
| `supporters` | Donors, volunteers, and skilled contributors — type, acquisition, status |
| `donations` | All donation types (Monetary, InKind, Time, Skills, SocialMedia) |
| `in_kind_donation_items` | Line-item detail for in-kind gifts (Food, Supplies, Clothing, Medical, etc.) |
| `donation_allocations` | How donations are distributed across safehouses and program areas |
| `safehouses` | 7 physical facilities — capacity, occupancy, region |
| `partners` | Service contractors — Education, Operations, Transport, etc. |
| `partner_assignments` | Partner-to-safehouse assignments with roles |

### Outreach

| Table | Description |
|---|---|
| `social_media_posts` | Posts across Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube, WhatsApp with engagement metrics |
| `public_impact_snapshots` | Monthly anonymized impact reports for public and donor audiences |

---

## ML Pipelines

Five Jupyter notebooks in `ml-pipelines/` implement predictive models trained on the sample dataset:

| Notebook | Model | Purpose |
|---|---|---|
| `donor-churn-prediction.ipynb` | Classification | Predict which donors are at risk of lapsing |
| `reintegration-readiness.ipynb` | Classification | Estimate resident readiness to transition out of care |
| `resident-wellbeing-prediction.ipynb` | Regression / Classification | Forecast wellbeing trajectory from case data |
| `school-struggle-risk.ipynb` | Classification | Identify residents at academic risk |
| `social-media-optimization.ipynb` | Regression / Analysis | Predict post engagement to optimize outreach timing and content |

Each pipeline includes data preprocessing, feature engineering, model training, evaluation metrics, and serialized output for integration into the admin dashboard.

---

## Deployment

The app is configured for deployment on **Vercel** via `vercel.json`. All routes are rewritten to `index.html` to support client-side routing.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel project's environment variable settings.

---

## Security

This project was built to meet the following security requirements from the INTEX specification:

- **RBAC** — Role-based access control enforced at the route and component level
- **HTTPS** — Enforced in production via Vercel
- **Secrets management** — All credentials stored in environment variables, never hardcoded
- **Password policies** — Delegated to Supabase Auth (minimum length, breach detection)
- **Cookie consent** — GDPR-compliant consent dialog before any tracking
- **Auth tokens** — Session management handled entirely by Supabase; no custom token storage

---

## Team

Developed by BYU Information Systems students as part of the IS 413/414 INTEX capstone program.

- The platform is modeled after **Lighthouse Sanctuary**, a real 501(c)(3) nonprofit. All data in `data/raw/` is synthetic sample data generated for academic use.
- See `INTEX-Case.md` for the full project specification, grading criteria, and deliverable requirements.
