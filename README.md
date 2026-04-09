# Watchtower

**Secure operations and impact platform for survivor care, donor stewardship, and outreach analytics.**

Built as a capstone project (BYU IS 413/414/455 — INTEX) for **Lighthouse Sanctuary**, a 501(c)(3) nonprofit operating safe homes for girls who are survivors of sexual abuse and sex trafficking in the Philippines.

---

## Submission Information

### Live Site

**URL:** https://watchtower.foundation

### Test Accounts

| Account | Email | Password | MFA | Role |
|---|---|---|---|---|
| Admin | `admin@watchtower.test` | `Admin123!@#Secure` | No | Admin — full portal access |
| Donor | `donor@watchtower.test` | `Donor123!@#Secure` | No | Donor — linked to donation history |
| MFA-enabled | `mfa@watchtower.test` | `MfaUser123!@#Secure` | **TODO — enroll TOTP** | Admin — will require authenticator code once MFA is enrolled |

### GitHub Repository

**URL:** https://github.com/d-rex14/intex2 (branch: `main`)

### ML Pipeline Notebooks

All notebooks are in the `ml-pipelines/` directory:

| Notebook | Supabase Table | Portal Page |
|---|---|---|
| `04_donor_upgrade_predictor/donor_upgrade_predictor.ipynb` | `donor_upgrade_scores` | `/portal/donors`, `/portal/reports` |
| `donor-churn-prediction.ipynb` | `donor_churn_scores` | `/portal/donors` |
| `reintegration-readiness.ipynb` | `resident_ml_scores` | `/portal/caseload` |
| `school-struggle-risk.ipynb` | `resident_ml_scores` | `/portal/caseload` |
| `resident-wellbeing-prediction.ipynb` | `resident_ml_scores` | `/portal/caseload` |
| `02_incident_leading_indicators/incident_leading_indicators.ipynb` | `resident_ml_scores` | `/portal/caseload` |
| `03_safehouse_value_add/safehouse_value_add.ipynb` | `safehouse_ml_scores` | `/portal/reports` |
| `social-media-optimization.ipynb` | `social_media_ml_scores` | `/portal/reports` |
| `01_clinical_efficacy/clinical_efficacy_pipeline.ipynb` | (analysis only) | — |

### Security Features Implemented (IS 414)

| Feature | Implementation |
|---|---|
| HTTPS/TLS | Vercel provides automatic TLS certificates |
| HTTP → HTTPS redirect | Handled by Vercel |
| Username/password auth | Supabase Auth with email/password |
| Password policy | Min 12 chars, uppercase, lowercase, digit, special char (client + server) |
| Auth-protected pages/endpoints | `RequireAuth` + `RequirePortalAccess` guards; Supabase RLS policies |
| RBAC | `user_roles` table with admin (4), staff (3), donor (2), social_media_rep (1), user (5) |
| Delete confirmation | Modal confirmations on all delete operations |
| Credential security | `.env` / `.env.local` gitignored; no secrets in code |
| Privacy policy | Full GDPR-compliant policy at `/privacy` |
| Cookie consent | Functional accept/decline banner; no tracking cookies used |
| CSP header | `Content-Security-Policy` set via `vercel.json` headers |
| HSTS | `Strict-Transport-Security` header via `vercel.json` |
| Third-party auth | Google OAuth sign-in |
| MFA | TOTP-based MFA via Supabase (test account created, enrollment pending) |
| User preference cookie | `watchtower_theme` cookie stores dark/light mode (browser-accessible, non-httpOnly) |
| Additional headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |

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

### Staff Portal (`/portal/*`, requires auth)
| Route | Description |
|---|---|
| `/portal` | Dashboard — high-level KPIs and activity summary |
| `/portal/donors` | Donations and allocations — donor directory, giving history, ML churn/upgrade scores |
| `/portal/caseload` | Caseload inventory — resident profiles with ML risk chips (reintegration, school, wellbeing, incident) |
| `/portal/process-recordings` | Process recordings — counseling session CRUD with resident linking |
| `/portal/visitations` | Home visitations — visit records with family cooperation and safety tracking |
| `/portal/reports` | Reports and analytics — safehouse value-add, social media strategy, donor upgrade bands |
| `/portal/your-donations` | Your donations — donor-facing personal giving history |
| `/portal/site-users` | Site users — admin user/role management via Edge Function |

### Authentication
- Email/password sign-in and sign-up with password strength enforcement
- OAuth via Google
- TOTP-based multi-factor authentication
- Role-based access control (admin, staff, donor, social_media_rep, user)
- Dark/light mode toggle with browser cookie preference
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
/portal/*            → RequireAuth → RequirePortalAccess → AdminLayout → [portal pages]
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

Roles are stored in the `user_roles` table (linked to `auth.users`). Fallback reads from JWT metadata.

| Role ID | Name | Access |
|---|---|---|
| 4 | `admin` | Full access to all portal pages, user management, CRUD on all data |
| 3 | `staff` | Case management, process recordings, visitations, reports |
| 2 | `donor` | Donor-facing views, personal donation history |
| 1 | `social_media_rep` | Donors page (view), reports (outreach analytics) |
| 5 | `user` | Default for new accounts — dashboard and your-donations only |

Use the `useAuth()` hook anywhere in the component tree:

```typescript
const { session, user, role, effectiveRoleIds, loading, signOut } = useAuth()
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

Jupyter notebooks in `ml-pipelines/` implement predictive models trained on the sample dataset. Each pipeline writes scores back to Supabase tables for the admin portal to consume.

| Notebook | Model Type | Purpose | Supabase Table |
|---|---|---|---|
| `donor-churn-prediction.ipynb` | Classification | Predict which donors are at risk of lapsing | `donor_churn_scores` |
| `04_donor_upgrade_predictor/donor_upgrade_predictor.ipynb` | Classification | Predict donors likely to increase giving | `donor_upgrade_scores` |
| `reintegration-readiness.ipynb` | Classification | Estimate resident readiness to transition out of care | `resident_ml_scores` |
| `resident-wellbeing-prediction.ipynb` | Regression / Classification | Forecast wellbeing trajectory from case data | `resident_ml_scores` |
| `school-struggle-risk.ipynb` | Classification | Identify residents at academic risk | `resident_ml_scores` |
| `02_incident_leading_indicators/incident_leading_indicators.ipynb` | Classification | Predict incident likelihood from resident features | `resident_ml_scores` |
| `03_safehouse_value_add/safehouse_value_add.ipynb` | Analysis | Measure per-safehouse value-add on outcomes | `safehouse_ml_scores` |
| `social-media-optimization.ipynb` | Regression / Analysis | Predict post engagement to optimize outreach timing and content | `social_media_ml_scores` |
| `01_clinical_efficacy/clinical_efficacy_pipeline.ipynb` | Statistical Analysis | Evaluate intervention effectiveness across modalities | (analysis only) |

Each pipeline includes data preprocessing, feature engineering, model training, evaluation metrics, and export to Supabase for integration into the admin portal.

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

This project was built to meet the IS 414 security requirements from the INTEX specification:

- **HTTPS/TLS** — Automatic TLS certificates via Vercel; HTTP requests redirected to HTTPS
- **HTTP security headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy configured in `vercel.json`
- **RBAC** — Role-based access control enforced at the route level (`RequireAuth`, `RequirePortalAccess`) and at the data level (Supabase RLS policies)
- **Password policy** — Minimum 12 characters, requires uppercase, lowercase, digit, and special character; enforced both client-side and server-side
- **MFA** — TOTP-based multi-factor authentication available via Supabase
- **Third-party auth** — Google OAuth sign-in
- **Secrets management** — All credentials in `.env` / `.env.local` (gitignored); no secrets committed to the repository
- **Cookie consent** — GDPR-compliant accept/decline banner; user theme preference stored in a browser-accessible cookie only after consent
- **Privacy policy** — Full GDPR-compliant data handling policy at `/privacy`
- **Delete confirmation** — Modal dialogs on all destructive operations
- **Auth tokens** — Session management handled entirely by Supabase; no custom token storage

---

## Team

Developed by BYU Information Systems students as part of the IS 413/414 INTEX capstone program.

- The platform is modeled after **Lighthouse Sanctuary**, a real 501(c)(3) nonprofit. All data in `data/raw/` is synthetic sample data generated for academic use.
- See `INTEX-Case.md` for the full project specification, grading criteria, and deliverable requirements.
