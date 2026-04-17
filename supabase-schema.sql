-- ============================================
-- MedVault Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('patient', 'doctor')) NOT NULL DEFAULT 'patient',
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  date_of_birth DATE,
  gender TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Medical Summaries
CREATE TABLE IF NOT EXISTS medical_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  conditions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  blood_pressure TEXT DEFAULT '',
  blood_sugar TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT DEFAULT 'other',
  file_url TEXT,
  file_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Access Grants
CREATE TABLE IF NOT EXISTS access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(patient_id, doctor_id)
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/write their own profile, doctors can read patients they have access to
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can view granted patients"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = profiles.id
        AND access_grants.revoked_at IS NULL
    )
  );

-- Helper function to check if current user is a doctor (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Doctors can search for patients by name (uses function to avoid recursion)
CREATE POLICY "Doctors can search patients"
  ON profiles FOR SELECT
  USING (public.is_doctor());

-- Medical Summaries: Patient owns, doctors with access can read
CREATE POLICY "Patient owns summary"
  ON medical_summaries FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view granted summaries"
  ON medical_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = medical_summaries.patient_id
        AND access_grants.revoked_at IS NULL
    )
  );

-- Reports: Patient owns, doctors with access can read
CREATE POLICY "Patient owns reports"
  ON reports FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view granted reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = reports.patient_id
        AND access_grants.revoked_at IS NULL
    )
  );

-- Access Grants: Patient can manage, doctors can read their own grants
CREATE POLICY "Patient manages access"
  ON access_grants FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their grants"
  ON access_grants FOR SELECT
  USING (doctor_id = auth.uid());

-- ============================================
-- Storage Bucket for Reports
-- ============================================
-- Create a 'reports' bucket in Supabase Storage dashboard
-- Set it to private, then add this policy:

-- Storage policy (run in SQL editor):
-- INSERT: Only authenticated users can upload to their own folder
-- SELECT: Owners + granted doctors can read
