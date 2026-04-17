-- ============================================
-- MedVault: Doctor Code Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add doctor_code column to profiles (unique, nullable for patients)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS doctor_code TEXT UNIQUE;

-- Add a unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_doctor_code_idx
  ON profiles (doctor_code)
  WHERE doctor_code IS NOT NULL;
