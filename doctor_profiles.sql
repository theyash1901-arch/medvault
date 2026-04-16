-- Run this in your Supabase SQL Editor to add Doctor Profile fields

create table public.doctor_profiles (
  id uuid references public.profiles(id) primary key,
  specialization text,
  license_number text,
  hospital_clinic text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.doctor_profiles enable row level security;

create policy "Doctors can view their own profile" 
on public.doctor_profiles for select 
using (auth.uid() = id);

create policy "Doctors can insert their own profile" 
on public.doctor_profiles for insert 
with check (auth.uid() = id);

create policy "Doctors can update their own profile" 
on public.doctor_profiles for update 
using (auth.uid() = id);
