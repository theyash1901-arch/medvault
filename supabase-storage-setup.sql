-- ============================================
-- MedVault: Storage Setup for Reports
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create the 'reports' bucket (must be public for getPublicUrl to work)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage objects (it usually is by default, but just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

-- 4. Policy: Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- 5. Policy: Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reports');

-- 6. Important: Just in case the `reports` table RLS was incomplete, ensure INSERT works:
CREATE POLICY "Patient can insert own reports into DB"
ON public.reports FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = auth.uid());
