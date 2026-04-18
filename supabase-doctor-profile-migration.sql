-- Run this in your Supabase SQL Editor
-- Adds doctor-specific columns directly to the profiles table

alter table public.profiles
  add column if not exists specialization text,
  add column if not exists license_number text,
  add column if not exists hospital_clinic text;
