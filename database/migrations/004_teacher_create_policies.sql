-- ============================================================
-- SMART EXAM PLATFORM - Minimal policies for teacher create flows
-- ============================================================
-- Purpose: ensure teachers can create/list their own classes and exams.
-- This is idempotent and safe even if the schema wasn't applied yet.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

    -- Remove recursive or stale profile policies before recreating safe ones
    EXECUTE 'DROP POLICY IF EXISTS "Students can view their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles';

    -- PROFILES: users can create, view, and update only their own row
    EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id)';
    EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
    EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;

  IF to_regclass('public.exams') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_code VARCHAR(12)';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_exam_code ON public.exams(exam_code)';
  END IF;

  -- Enable RLS only if tables exist
  IF to_regclass('public.classes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY';

    -- Let students look up active classes by code before enrollment
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'classes'
        AND policyname = 'Students can view active classes'
    ) THEN
      EXECUTE 'DROP POLICY "Students can view active classes" ON public.classes';
    END IF;

    EXECUTE 'CREATE POLICY "Students can view active classes" ON public.classes '
      'FOR SELECT USING (is_active = true)';

    -- CLASSES: teacher can select own
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'classes'
        AND policyname = 'Teachers can view their own classes'
    ) THEN
      EXECUTE 'CREATE POLICY "Teachers can view their own classes" ON public.classes '
        'FOR SELECT USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
    END IF;

    -- CLASSES: teacher can insert own
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'classes'
        AND policyname = 'Teachers can create classes'
    ) THEN
      EXECUTE 'CREATE POLICY "Teachers can create classes" ON public.classes '
        'FOR INSERT WITH CHECK (teacher_id = auth.uid())';
    END IF;
  END IF;

  IF to_regclass('public.exams') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY';

    -- EXAMS: teacher can select own
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'exams'
        AND policyname = 'Teachers can view their own exams'
    ) THEN
      EXECUTE 'CREATE POLICY "Teachers can view their own exams" ON public.exams '
        'FOR SELECT USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))';
    END IF;

    -- EXAMS: teacher can insert own
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'exams'
        AND policyname = 'Teachers can create exams'
    ) THEN
      EXECUTE 'CREATE POLICY "Teachers can create exams" ON public.exams '
        'FOR INSERT WITH CHECK (teacher_id = auth.uid())';
    END IF;
  END IF;
END $$;
