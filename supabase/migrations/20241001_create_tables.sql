-- Supabase Migration: IV Payment Management System Schema with RLS

-- Enable pgcrypto for gen_random_uuid
create extension if not exists "pgcrypto";

-- TABLE: students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  register_number text not null unique,
  department text default 'CSE',
  section text default 'B',
  phone text default '',
  total_amount numeric not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- TABLE: payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('UPI', 'Cash', 'Bank Transfer', 'Other')),
  payment_date date not null default current_date,
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_students_register_number on public.students(register_number);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_payments_payment_date on public.payments(payment_date);

-- ROW LEVEL SECURITY
alter table public.students enable row level security;
alter table public.payments enable row level security;

-- Drop existing policies if any to avoid conflicts
drop policy if exists "Enable all operations for students" on public.students;
drop policy if exists "Enable all operations for payments" on public.payments;
drop policy if exists "students select" on public.students;
drop policy if exists "students insert" on public.students;
drop policy if exists "students update" on public.students;
drop policy if exists "students delete" on public.students;
drop policy if exists "payments select" on public.payments;
drop policy if exists "payments insert" on public.payments;
drop policy if exists "payments update" on public.payments;
drop policy if exists "payments delete" on public.payments;

-- Create permissive RLS policies for the frontend application
create policy "Enable all operations for students" on public.students
  for all
  using (true)
  with check (true);

create policy "Enable all operations for payments" on public.payments
  for all
  using (true)
  with check (true);
