-- ============================================================
-- SMART EXAM PLATFORM - Profiles INSERT policy
-- ============================================================
-- Fix: allow authenticated users to create their own profile row.
-- Without this, teacher/student registration fails when the frontend
-- tries to insert into public.profiles (RLS enabled).

DO $$
BEGIN
  -- Only run if profiles table exists (schema may not be applied yet)
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)';
  END IF;
END $$;
