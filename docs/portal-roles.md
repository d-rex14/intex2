# Portal roles and user identity

## `public.roles` IDs

| `id` | `name` |
|------|--------|
| 1 | `social_media_rep` |
| 2 | `donor` |
| 3 | `staff` |
| 4 | `admin` |
| 5 | `user` |

## `public.user_roles`

- Composite primary key: `(user_id, role_id)`.
- `user_id` references `auth.users(id)` (UUID).
- `role_id` references `public.roles(id)`.

Privilege checks in app code and Edge Functions should use **`user_id` + `user_roles`**, not email. Email is for human-readable admin UI and lookup only.

## Defaults and future behavior

- New enrollments should receive **`role_id = 5` (`user`)** unless another process assigns a role (e.g. a database trigger on signup).
- Future: donating may automatically grant **`role_id = 2` (`donor`)** for specific permissions.

## Site Users (admin)

- The `admin-site-users` Edge Function requires a row in `user_roles` with **`role_id = 4`** for the caller.
- Display name is stored in auth **`user_metadata`** (the function reads/writes `full_name`).
- **Remove role**: deletes all `user_roles` rows for that user; the auth account remains.
- **Delete account**: removes `user_roles` rows then deletes the auth user via the Admin API (cannot delete your own account).

## Deploying the Edge Function

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
supabase functions deploy admin-site-users
```

Set **`ALLOWED_ORIGINS`** in the function secrets (comma-separated) to match your production site and `http://localhost:5173` for local dev. Hosted projects also receive `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically.

## GitHub Actions

The workflow [`.github/workflows/deploy-supabase-functions.yml`](../.github/workflows/deploy-supabase-functions.yml) deploys **`admin-site-users`** on pushes to **`main`** that touch `supabase/functions/**` (and when the workflow file itself changes), or when you run it manually (**Actions → Deploy Supabase Edge Functions → Run workflow**).

Add these **repository secrets** in GitHub (**Settings → Secrets and variables → Actions**):

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase access token](https://supabase.com/dashboard/account/tokens) for the CLI |
| `SUPABASE_PROJECT_REF` | Project ref from the dashboard URL (`/project/<ref>`) |

You do not need your public site URL in GitHub for the deploy step. Set **`ALLOWED_ORIGINS`** on the Supabase side (CLI or dashboard) so the function allows CORS from your real origins.
