-- Supabase Migration: Create students and payments tables with foreign key and basic RLS policies

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- TABLE: students
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  register_number text not null unique,
  section text,
  amount_due numeric not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- TABLE: payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  amount numeric not null,
  mode text not null,
  payment_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

-- ROW LEVEL SECURITY
alter table public.students enable row level security;
alter table public.payments enable row level security;

-- Policies for students (allow all operations for authenticated users; for MVP we allow everyone)
create policy "students select" on public.students for select using (true);
create policy "students insert" on public.students for insert with check (true);
create policy "students update" on public.students for update using (true) with check (true);
create policy "students delete" on public.students for delete using (true);

-- Policies for payments
create policy "payments select" on public.payments for select using (true);
create policy "payments insert" on public.payments for insert with check (true);
create policy "payments update" on public.payments for update using (true) with check (true);
create policy "payments delete" on public.payments for delete using (true);
