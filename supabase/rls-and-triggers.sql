-- Watchtower / INTEX — reference SQL for Supabase (run in SQL editor or migrations).
-- Adjust schema/table names to match your project. Client RBAC lives in src/lib/roles.ts;
-- this file is the server-side complement: RLS + triggers. Never rely on the SPA alone.

-- ---------------------------------------------------------------------------
-- Role IDs (keep in sync with src/lib/roles.ts ROLE_IDS)
-- 1 = SOCIAL_MEDIA_REP, 2 = DONOR, 3 = STAFF, 4 = ADMIN, 5 = USER (default)
-- ---------------------------------------------------------------------------

-- Example: helper for policies (returns true if auth.uid() has a row with that role_id)
-- create or replace function public.user_has_role(target_role_id int)
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select exists (
--     select 1
--     from public.user_roles ur
--     where ur.user_id = auth.uid()
--       and ur.role_id = target_role_id
--   );
-- $$;

-- Example: users can read their own role assignments; writes only via service role / triggers
-- alter table public.user_roles enable row level security;
--
-- create policy "Users read own roles"
--   on public.user_roles for select
--   using (user_id = auth.uid());

-- Operational tables (residents, donations, etc.): add policies per table, e.g. staff/admin
-- using user_has_role(4) or user_has_role(3), and donor-scoped rows with
-- user_has_role(2) plus row ownership keyed to auth.uid() or supporter_id.

-- ---------------------------------------------------------------------------
-- Default role USER (5) on signup
-- Prefer a trigger on auth.users so every new user gets a row even if the SPA never runs.
-- ---------------------------------------------------------------------------

-- create or replace function public.handle_new_user_default_role()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.user_roles (user_id, role_id)
--   values (new.id, 5)
--   on conflict do nothing;
--   return new;
-- end;
-- $$;

-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user_default_role();

-- Requires a unique constraint on (user_id, role_id) if you use ON CONFLICT, or use a
-- separate id primary key and check existence before insert.

-- ---------------------------------------------------------------------------
-- Donation -> DONOR role (2)
-- Implement outside the browser: Stripe/GiveButter webhook, Edge Function with service role,
-- or DB trigger on a donations table when payment_status = 'succeeded' and user_id is set.
-- Example pattern:
--   insert into public.user_roles (user_id, role_id)
--   values ($user_id, 2)
--   on conflict (user_id, role_id) do nothing;
-- After insert, the React app should call refetchRoles() from AuthContext (or rely on
-- a full page load) so effectiveRoleIds updates.
-- ---------------------------------------------------------------------------
