-- ============================================
-- MedVault: Patient Search Policy Fix
-- Run this in Supabase SQL Editor
-- ============================================

-- Allow patients (and anyone authenticated) to search for doctor profiles
-- This is required because earlier RLS policies only allowed doctors to search for patients
CREATE POLICY "Patients can search doctors"
  ON profiles FOR SELECT
  USING (role = 'doctor');
