-- Storage RLS for assignment PDFs (teachers) and student submissions.
-- Run in Supabase: SQL Editor → New query → paste → Run
-- Or: supabase db push (if you use Supabase CLI linked to this project)
--
-- Buckets must exist first. Run: 20260419160000_storage_create_buckets.sql
-- Or create "assignment" and "submissions" in Dashboard → Storage → New bucket

-- ========== bucket: assignment (Guru: batch_*/file.pdf) ==========

DROP POLICY IF EXISTS "assignment_authenticated_insert" ON storage.objects;
CREATE POLICY "assignment_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assignment');

DROP POLICY IF EXISTS "assignment_read" ON storage.objects;
CREATE POLICY "assignment_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment');

DROP POLICY IF EXISTS "assignment_authenticated_delete" ON storage.objects;
CREATE POLICY "assignment_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assignment');

-- ========== bucket: submissions (students) ==========

DROP POLICY IF EXISTS "submissions_authenticated_insert" ON storage.objects;
CREATE POLICY "submissions_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS "submissions_read" ON storage.objects;
CREATE POLICY "submissions_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');
