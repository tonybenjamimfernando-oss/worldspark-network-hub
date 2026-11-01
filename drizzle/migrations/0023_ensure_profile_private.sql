CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_id text CHECK (tax_id IS NULL OR char_length(tax_id) <= 40),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner reads private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Owner inserts private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Owner updates private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Owner deletes private profile" ON public.profile_private;
CREATE POLICY "Owner reads private profile" ON public.profile_private FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts private profile" ON public.profile_private FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates private profile" ON public.profile_private FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes private profile" ON public.profile_private FOR DELETE TO authenticated USING (auth.uid() = user_id);