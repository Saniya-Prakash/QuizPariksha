-- Create Storage buckets expected by the app (safe to run multiple times).
-- Student uploads use bucket: submissions
-- Teacher assignment PDFs use bucket: assignment
--
-- Run in Supabase → SQL → New query, or supabase db push.

INSERT INTO storage.buckets (id, name, public)
SELECT 'assignment', 'assignment', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'assignment');

INSERT INTO storage.buckets (id, name, public)
SELECT 'submissions', 'submissions', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'submissions');
