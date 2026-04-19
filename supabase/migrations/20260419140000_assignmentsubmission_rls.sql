-- RLS for public.assignmentsubmission (student turn-in + teacher grading).
-- Run in Supabase SQL Editor after reviewing table/column names.
-- Requires: "User".id = auth.uid(), "User".user_id = assignmentsubmission.student_id
-- Requires: public.assignment, public.batchassignment, public.batchteacher

-- Adjust schema if your tables live outside public.

DROP POLICY IF EXISTS "assignmentsubmission_student_select_own" ON public.assignmentsubmission;
CREATE POLICY "assignmentsubmission_student_select_own"
ON public.assignmentsubmission FOR SELECT
TO authenticated
USING (
  student_id = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
);

DROP POLICY IF EXISTS "assignmentsubmission_teacher_select" ON public.assignmentsubmission;
CREATE POLICY "assignmentsubmission_teacher_select"
ON public.assignmentsubmission FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignment a
    WHERE a.assignment_id = assignmentsubmission.assignment_id
      AND a.posted_by = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.batchassignment ba
    JOIN public.batchteacher bt ON bt.batch_id = ba.batch_id
    WHERE ba.assignment_id = assignmentsubmission.assignment_id
      AND bt.teacher_id = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
);

DROP POLICY IF EXISTS "assignmentsubmission_student_insert_own" ON public.assignmentsubmission;
CREATE POLICY "assignmentsubmission_student_insert_own"
ON public.assignmentsubmission FOR INSERT
TO authenticated
WITH CHECK (
  student_id = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
);

DROP POLICY IF EXISTS "assignmentsubmission_teacher_update" ON public.assignmentsubmission;
CREATE POLICY "assignmentsubmission_teacher_update"
ON public.assignmentsubmission FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignment a
    WHERE a.assignment_id = assignmentsubmission.assignment_id
      AND a.posted_by = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.batchassignment ba
    JOIN public.batchteacher bt ON bt.batch_id = ba.batch_id
    WHERE ba.assignment_id = assignmentsubmission.assignment_id
      AND bt.teacher_id = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignment a
    WHERE a.assignment_id = assignmentsubmission.assignment_id
      AND a.posted_by = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.batchassignment ba
    JOIN public.batchteacher bt ON bt.batch_id = ba.batch_id
    WHERE ba.assignment_id = assignmentsubmission.assignment_id
      AND bt.teacher_id = (SELECT u.user_id FROM public."User" u WHERE u.id = auth.uid())
  )
);

-- If inserts still fail and RLS is disabled on this table, you do not need this line.
-- If RLS is on but there were no policies, enable only after policies exist:
-- ALTER TABLE public.assignmentsubmission ENABLE ROW LEVEL SECURITY;
