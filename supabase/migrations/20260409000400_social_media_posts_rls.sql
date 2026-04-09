-- =============================================================================
-- social_media_posts: RLS for admin, staff, and social_media_rep (roles 4, 3, 1)
-- Matches src/lib/roles.ts ROLE_IDS.
-- =============================================================================

-- Editor roles: SOCIAL_MEDIA_REP=1, STAFF=3, ADMIN=4
CREATE OR REPLACE FUNCTION public.is_social_media_editor()
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
      AND ur.role_id IN (1, 3, 4)
  );
$$;

REVOKE ALL ON FUNCTION public.is_social_media_editor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_social_media_editor() TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_posts TO authenticated;

ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_media_posts_editor_all ON public.social_media_posts;
CREATE POLICY social_media_posts_editor_all
  ON public.social_media_posts
  FOR ALL
  TO authenticated
  USING (public.is_social_media_editor())
  WITH CHECK (public.is_social_media_editor());

-- post_id default only when column is not already GENERATED / IDENTITY
DO $body$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'social_media_posts'
      AND a.attname = 'post_id'
      AND NOT a.attisdropped
      AND a.attidentity = ''
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS public.social_media_posts_post_id_seq;
    PERFORM setval(
      'public.social_media_posts_post_id_seq',
      COALESCE((SELECT MAX(post_id) FROM public.social_media_posts), 0)
    );
    ALTER TABLE public.social_media_posts
      ALTER COLUMN post_id SET DEFAULT nextval('public.social_media_posts_post_id_seq');
    ALTER SEQUENCE public.social_media_posts_post_id_seq OWNED BY public.social_media_posts.post_id;
    GRANT USAGE, SELECT ON SEQUENCE public.social_media_posts_post_id_seq TO authenticated;
  END IF;
END $body$;
