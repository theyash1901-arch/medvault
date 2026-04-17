-- ============================================
-- MedVault: Patient Code Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add patient_code column to profiles (unique, nullable for doctors)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS patient_code TEXT UNIQUE;

-- Add a unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_patient_code_idx
  ON profiles (patient_code)
  WHERE patient_code IS NOT NULL;
