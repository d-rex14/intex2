# Supabase: donations feature — review & apply

Run these statements in the **Supabase SQL Editor** (or via CLI migrations) **after reviewing** each section. Order matters: extensions → sequences → columns → functions → RPC → RLS policies → grants.

---

## 0. Troubleshooting: portal not loading after applying SQL

If the portal spins forever or the admin area does not render after running these steps, the most likely cause is that **`user_roles` has Row Level Security enabled but no SELECT policy** for authenticated users. The `AuthContext` queries this table directly via PostgREST and if RLS blocks it, the roles query returns empty, and the portal becomes inaccessible.

### Diagnose

```sql
-- Check whether RLS is active on user_roles
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'user_roles'
  AND relnamespace = 'public'::regnamespace;

-- List existing policies on user_roles
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'user_roles' AND schemaname = 'public';
```

If `relrowsecurity = true` and there is **no `SELECT` policy**, run the fix below.

### Fix

```sql
-- Allow authenticated users to read their own role rows
CREATE POLICY IF NOT EXISTS "users_read_own_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

After running this, hard-refresh the browser and sign in again. The portal should load.

---

This matches the Watchtower app behavior: public **demo donation** via RPC (`SECURITY DEFINER`), **staff** CRUD on `supporters` / `donations`, **donors** read-only rows tied to their email or `auth_user_id`.

---

## 1. `user_roles`: allow multiple roles per user

The app (`[src/lib/roles.ts](../src/lib/roles.ts)`) expects **multiple** `user_roles` rows per `user_id` (e.g. staff + donor). If your table has `**UNIQUE (user_id)`**, drop that constraint so `(user_id, role_id)` can repeat for different `role_id` values.

```sql
-- List constraints (optional sanity check)
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_roles'::regclass;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
```

If the unique constraint uses another name, find it in the Dashboard → Table Editor → user_roles → constraints, or:

```sql
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
  AND contype = 'u';
```

---

## 2. Primary key sequences (integer IDs)

If `supporter_id` / `donation_id` are **not** already backed by sequences/identity, attach sequences and sync from current max values so inserts work without manual IDs.

```sql
CREATE SEQUENCE IF NOT EXISTS public.supporters_supporter_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.donations_donation_id_seq;

SELECT setval(
  'public.supporters_supporter_id_seq',
  COALESCE((SELECT MAX(supporter_id) FROM public.supporters), 0)
);
SELECT setval(
  'public.donations_donation_id_seq',
  COALESCE((SELECT MAX(donation_id) FROM public.donations), 0)
);

ALTER TABLE public.supporters
  ALTER COLUMN supporter_id SET DEFAULT nextval('public.supporters_supporter_id_seq');
ALTER TABLE public.donations
  ALTER COLUMN donation_id SET DEFAULT nextval('public.donations_donation_id_seq');

ALTER SEQUENCE public.supporters_supporter_id_seq OWNED BY public.supporters.supporter_id;
ALTER SEQUENCE public.donations_donation_id_seq OWNED BY public.donations.donation_id;
```

If `DEFAULT` is already set, you may skip the `ALTER COLUMN … SET DEFAULT` lines after verifying.

---

## 3. `supporters`: auth link + unique email

```sql
ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS supporters_auth_user_id_idx
  ON public.supporters (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- One supporter row per email (for upserts + donor matching). NULL emails allowed for legacy rows.
CREATE UNIQUE INDEX IF NOT EXISTS supporters_email_lower_idx
  ON public.supporters (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
```

---

## 4. Helper functions (for RLS)

```sql
CREATE OR REPLACE FUNCTION public.is_staff_portal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (3, 4) -- staff=3, admin=4 per public.roles
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_portal_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_portal_user() TO authenticated;
```

Adjust role IDs **1, 3, 4** if your `public.roles` table uses different numbers.

---

## 5. RPC: public demo donation (anon + authenticated)

Inserts/updates `supporters` by normalized email and inserts one `donations` row. Uses `channel_source = 'Direct'` and `acquisition_channel = 'Website'` on insert.

```sql
CREATE OR REPLACE FUNCTION public.submit_public_demo_donation(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_amount numeric,
  p_donation_type text DEFAULT 'Monetary',
  p_notes text DEFAULT NULL,
  p_is_recurring boolean DEFAULT false,
  p_campaign_name text DEFAULT NULL,
  p_auth_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_supporter_id integer;
  v_donation_id integer;
  v_display text;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' OR position('@' IN v_email) < 2 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF p_auth_user_id IS NOT NULL AND p_auth_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Invalid session for linked account';
  END IF;

  v_display := trim(
    coalesce(nullif(trim(p_first_name), ''), '') || ' ' ||
    coalesce(nullif(trim(p_last_name), ''), '')
  );
  IF v_display = '' THEN
    v_display := split_part(v_email, '@', 1);
  END IF;

  SELECT supporter_id INTO v_supporter_id
  FROM public.supporters
  WHERE lower(trim(email)) = v_email
  LIMIT 1;

  IF v_supporter_id IS NOT NULL THEN
    UPDATE public.supporters
    SET
      display_name = v_display,
      first_name = coalesce(nullif(trim(p_first_name), ''), first_name),
      last_name = coalesce(nullif(trim(p_last_name), ''), last_name),
      auth_user_id = coalesce(p_auth_user_id, auth_user_id)
    WHERE supporter_id = v_supporter_id;
  ELSE
    INSERT INTO public.supporters (
      supporter_type,
      display_name,
      first_name,
      last_name,
      relationship_type,
      region,
      country,
      email,
      phone,
      status,
      created_at,
      acquisition_channel,
      auth_user_id
    )
    VALUES (
      'MonetaryDonor',
      v_display,
      nullif(trim(p_first_name), ''),
      nullif(trim(p_last_name), ''),
      'International',
      'N/A',
      'USA',
      v_email,
      '',
      'Active',
      CURRENT_DATE,
      'Website',
      p_auth_user_id
    )
    RETURNING supporter_id INTO v_supporter_id;
  END IF;

  INSERT INTO public.donations (
    supporter_id,
    donation_type,
    donation_date,
    channel_source,
    currency_code,
    amount,
    estimated_value,
    impact_unit,
    is_recurring,
    campaign_name,
    notes
  )
  VALUES (
    v_supporter_id,
    coalesce(nullif(trim(p_donation_type), ''), 'Monetary'),
    CURRENT_DATE,
    'Direct',
    'PHP',
    p_amount,
    p_amount,
    'pesos',
    coalesce(p_is_recurring, false),
    nullif(trim(p_campaign_name), ''),
    nullif(trim(p_notes), '')
  )
  RETURNING donation_id INTO v_donation_id;

  RETURN json_build_object(
    'supporter_id', v_supporter_id,
    'donation_id', v_donation_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_demo_donation(text, text, text, numeric, text, text, boolean, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_demo_donation(text, text, text, numeric, text, text, boolean, text, uuid) TO anon, authenticated;
```

---

## 6. Row Level Security

Enable RLS and add policies. **Test in a staging project first** if the database already has data or other apps connected.

```sql
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Staff: full access
CREATE POLICY supporters_staff_all
  ON public.supporters
  FOR ALL
  TO authenticated
  USING (public.is_staff_portal_user())
  WITH CHECK (public.is_staff_portal_user());

CREATE POLICY donations_staff_all
  ON public.donations
  FOR ALL
  TO authenticated
  USING (public.is_staff_portal_user())
  WITH CHECK (public.is_staff_portal_user());

-- Non-staff: read supporter row when it belongs to this login (email or auth link).
-- Works for DONOR, MEMBER, etc., so guest donations appear after signup without extra role grants.
CREATE POLICY supporters_self_select
  ON public.supporters
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR lower(trim(coalesce(email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY donations_self_select
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.supporters s
      WHERE s.supporter_id = donations.supporter_id
        AND (
          s.auth_user_id = auth.uid()
          OR lower(trim(coalesce(s.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        )
    )
  );
```

**Notes**

- **No** `INSERT`/`UPDATE` on `donations` / `supporters` for end users via PostgREST — demo gifts go through `submit_public_demo_donation` only.
- If policy names collide with existing ones, `DROP POLICY …` first or pick new names.

---

## 6b. Re-run `is_staff_portal_user` if already created with wrong IDs

If you ran Section 4 before the roles table mismatch was discovered, the function was created with `role_id IN (1, 3, 4)` which treated `social_media_rep` as staff. Re-run the corrected version from Section 4 above (it uses `CREATE OR REPLACE`, so it is safe to run again). The correct check is `role_id IN (3, 4)` — staff and admin.

Also update your own admin account role if needed:

```sql
-- Move yourself from social_media_rep (1) to admin (4)
UPDATE public.user_roles
SET role_id = 4
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

---

## 7. Verification checklist

- `submit_public_demo_donation` succeeds as **anon** (e.g. SQL `select submit_public_demo_donation(...)` with `SET request.jwt.claim` or from the app without login).
- Logged-in **staff** can `select` / `update` / `delete` on `donations`.
- Logged-in **donor** sees only rows matching email / `auth_user_id`.
- Multiple `user_roles` rows per user work (e.g. user has both STAFF and DONOR if you insert both).

---

## 8. Optional: `first_donation_date` on supporter

You can add a trigger to maintain `supporters.first_donation_date` on new donations; not required for the first app slice.

---

## Related frontend (this repo)

After SQL is applied: public form calls `submit_public_demo_donation` from `[src/components/RecordedDonationForm.tsx](../src/components/RecordedDonationForm.tsx)`; staff/donor list is `[src/pages/admin/DonorsContributionsPage.tsx](../src/pages/admin/DonorsContributionsPage.tsx)`. Route access for `/admin/donors` includes `MEMBER` so signed-in users can open **My giving** (read-only) per `[src/lib/roles.ts](../src/lib/roles.ts)`.

---

## Rollback (emergency)

- `DROP FUNCTION IF EXISTS public.submit_public_demo_donation(text, text, text, numeric, text, text, boolean, text, uuid);`
- `DROP POLICY …` for each policy added
- `ALTER TABLE … DISABLE ROW LEVEL SECURITY;` (only if you understand exposure)
- Restore `UNIQUE (user_id)` on `user_roles` only if you intentionally revert to single-role semantics (app routing will need to match).

