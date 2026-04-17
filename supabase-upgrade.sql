-- ============================================
-- MedVault Upgrade Migration
-- Run this in Supabase SQL Editor AFTER the base schema
-- ============================================

-- 1. Add expires_at to access_grants for time-based access (Feature 4)
ALTER TABLE access_grants ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Access Logs table (Feature 4)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'view',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient can view their access logs"
  ON access_logs FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can insert access logs"
  ON access_logs FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can view their own logs"
  ON access_logs FOR SELECT
  USING (doctor_id = auth.uid());

-- 3. Health Events table (Feature 5)
CREATE TABLE IF NOT EXISTS health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('diagnosis', 'report', 'treatment', 'medication', 'note', 'prescription')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient owns health events"
  ON health_events FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view granted patient events"
  ON health_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = health_events.patient_id
        AND access_grants.revoked_at IS NULL
        AND (access_grants.expires_at IS NULL OR access_grants.expires_at > NOW())
    )
  );

-- 4. Prescriptions table (Feature 7)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  medicines JSONB DEFAULT '[]',
  raw_text TEXT DEFAULT '',
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient owns prescriptions"
  ON prescriptions FOR ALL
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view granted prescriptions"
  ON prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = prescriptions.patient_id
        AND access_grants.revoked_at IS NULL
        AND (access_grants.expires_at IS NULL OR access_grants.expires_at > NOW())
    )
  );

-- 5. Update access_grants policy to check expiration
DROP POLICY IF EXISTS "Doctors can view granted patients" ON profiles;
CREATE POLICY "Doctors can view granted patients"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = profiles.id
        AND access_grants.revoked_at IS NULL
        AND (access_grants.expires_at IS NULL OR access_grants.expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS "Doctors can view granted summaries" ON medical_summaries;
CREATE POLICY "Doctors can view granted summaries"
  ON medical_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = medical_summaries.patient_id
        AND access_grants.revoked_at IS NULL
        AND (access_grants.expires_at IS NULL OR access_grants.expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS "Doctors can view granted reports" ON reports;
CREATE POLICY "Doctors can view granted reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM access_grants
      WHERE access_grants.doctor_id = auth.uid()
        AND access_grants.patient_id = reports.patient_id
        AND access_grants.revoked_at IS NULL
        AND (access_grants.expires_at IS NULL OR access_grants.expires_at > NOW())
    )
  );
