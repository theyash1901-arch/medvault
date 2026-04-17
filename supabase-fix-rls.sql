-- ============================================
-- MedVault RLS Fix: Infinite Recursion
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Doctors can search patients" ON profiles;

-- 2. Create a helper function that bypasses RLS to check role
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Recreate the policy using the function (no recursion)
CREATE POLICY "Doctors can search patients"
  ON profiles FOR SELECT
  USING (public.is_doctor());
