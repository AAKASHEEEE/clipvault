-- Fresh Supabase projects only. Intentionally fails if original tables exist.
-- Review and run manually. This file has NOT been applied to a live database.
BEGIN;
CREATE TABLE public.user_profiles (
 id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 email text NOT NULL,
 display_name text NOT NULL DEFAULT '',
 avatar_url text NOT NULL DEFAULT '',
 theme text NOT NULL DEFAULT 'auto' CHECK(theme IN ('light','dark','auto')),
 notifications_enabled boolean NOT NULL DEFAULT true,
 default_platform text NOT NULL DEFAULT 'youtube' CHECK(default_platform IN ('youtube','instagram','tiktok','facebook','podcast')),
 sort_preference text NOT NULL DEFAULT 'newest' CHECK(sort_preference IN ('newest','priority','name')),
 bio text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 100),
 platform text NOT NULL CHECK(platform IN ('youtube','instagram','tiktok','facebook','podcast')),
 url text NOT NULL CHECK(url ~ '^https?://'),
 niche text NOT NULL DEFAULT 'other', handle text NOT NULL DEFAULT '',
 email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','review')),
 priority text NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
 views bigint NOT NULL DEFAULT 0 CHECK(views BETWEEN 0 AND 9007199254740991),
 subscribers bigint NOT NULL DEFAULT 0 CHECK(subscribers BETWEEN 0 AND 9007199254740991),
 videos bigint NOT NULL DEFAULT 0 CHECK(videos BETWEEN 0 AND 9007199254740991),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.clips (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
 title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 180),
 source_url text NOT NULL DEFAULT '' CHECK(source_url='' OR source_url ~ '^https?://'),
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','cutting','ready','posted')),
 priority text NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
 views bigint NOT NULL DEFAULT 0 CHECK(views BETWEEN 0 AND 9007199254740991),
 views_24h bigint NOT NULL DEFAULT 0 CHECK(views_24h>=0 AND views_24h<=views),
 geo text NOT NULL DEFAULT '', age_group text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX accounts_owner_idx ON public.accounts(user_id);
CREATE INDEX clips_owner_stage_idx ON public.clips(user_id,status);
CREATE INDEX clips_account_idx ON public.clips(account_id);
CREATE INDEX user_profiles_email_idx ON public.user_profiles(email);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.accounts,public.clips,public.user_profiles FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.accounts,public.clips TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.user_profiles TO authenticated;
CREATE POLICY account_owner ON public.accounts FOR ALL TO authenticated
 USING((SELECT auth.uid())=user_id) WITH CHECK((SELECT auth.uid())=user_id);
CREATE POLICY profile_self ON public.user_profiles FOR ALL TO authenticated
 USING((SELECT auth.uid())=id) WITH CHECK((SELECT auth.uid())=id);
CREATE POLICY clip_owner ON public.clips FOR ALL TO authenticated
 USING((SELECT auth.uid())=user_id)
 WITH CHECK((SELECT auth.uid())=user_id AND (account_id IS NULL OR EXISTS
 (SELECT 1 FROM public.accounts a WHERE a.id=account_id AND a.user_id=(SELECT auth.uid()))));
COMMIT;
-- Verify all CRUD operations using two distinct authenticated test users.
