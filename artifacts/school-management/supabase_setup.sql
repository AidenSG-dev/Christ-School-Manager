-- ============================================================
-- Christ School Management System — Supabase Database Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- 1. Teachers profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.teachers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name VARCHAR(255) NOT NULL,
  subject      VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own profile"
  ON public.teachers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can insert own profile"
  ON public.teachers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
  ON public.teachers FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- NOTE: The app currently uses localStorage for all student,
-- class, marks, and lesson plan data. The schema below is
-- provided as a migration target if you want to move to
-- full Supabase persistence in a future step.
-- ============================================================

-- 2. Academic years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  year_label  VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, year_label)
);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher owns academic_years"
  ON public.academic_years FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);


-- 3. Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  year_label  VARCHAR(20) NOT NULL,
  name        VARCHAR(20) NOT NULL,
  section     VARCHAR(10) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher owns classes"
  ON public.classes FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);


-- 4. Students
CREATE TABLE IF NOT EXISTS public.students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id      UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  roll_no       INTEGER NOT NULL,
  student_name  VARCHAR(255),
  student_code  VARCHAR(100),
  birth_date    DATE,
  address       TEXT,
  parent_phone  VARCHAR(30),
  extra_data    JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher owns students"
  ON public.students FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);


-- 5. Assessment configurations
CREATE TABLE IF NOT EXISTS public.assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  year_label  VARCHAR(20) NOT NULL,
  term        VARCHAR(50) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  num_tests   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher owns assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);


-- 6. Marks entries
CREATE TABLE IF NOT EXISTS public.marks_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  assessment_id  UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_index     INTEGER NOT NULL,
  mark_value     NUMERIC,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, student_id, test_index)
);

ALTER TABLE public.marks_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher owns marks_entries"
  ON public.marks_entries FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
