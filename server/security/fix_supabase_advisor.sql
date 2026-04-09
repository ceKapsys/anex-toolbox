-- Hardens Supabase public schema tables against anonymous/authenticated direct access.
-- Intended for projects where all database access is server-side via DATABASE_URL.

begin;

-- Prevent future public-table grants to anon/authenticated unless explicitly added.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;

-- Existing tables in this project
alter table public.admin_users enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.quotation_terms enable row level security;
alter table public.quotations enable row level security;
alter table public.services enable row level security;
alter table public.sessions enable row level security;
alter table public.settings enable row level security;
alter table public.terms enable row level security;

-- Remove broad grants that expose table data through anon/authenticated roles.
revoke all privileges on table public.admin_users from anon, authenticated;
revoke all privileges on table public.clients from anon, authenticated;
revoke all privileges on table public.invoices from anon, authenticated;
revoke all privileges on table public.quotation_terms from anon, authenticated;
revoke all privileges on table public.quotations from anon, authenticated;
revoke all privileges on table public.services from anon, authenticated;
revoke all privileges on table public.sessions from anon, authenticated;
revoke all privileges on table public.settings from anon, authenticated;
revoke all privileges on table public.terms from anon, authenticated;

-- Revoke sequence access too (defense in depth).
revoke all privileges on all sequences in schema public from anon, authenticated;

commit;
