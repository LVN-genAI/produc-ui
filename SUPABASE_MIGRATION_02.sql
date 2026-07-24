-- =============================================================================
-- Migration 02 — Soft-delete (archive) + admin-managed home page
-- Safe to run on an existing database created from SUPABASE_SCHEMA.sql.
-- Idempotent.
-- =============================================================================

-- --- Archive columns (NULL = active, timestamp = archived) -------------------
alter table public.categories
  add column if not exists archived_at timestamptz;
alter table public.products
  add column if not exists archived_at timestamptz;

create index if not exists categories_archived_at_idx
  on public.categories (archived_at);
create index if not exists products_archived_at_idx
  on public.products (archived_at);

-- --- Site settings (single-row, admin-editable home content) ------------------
create table if not exists public.site_settings (
  -- Singleton: only one row, always id = true.
  id                boolean primary key default true,
  hero_eyebrow      text not null default 'Explore the collection',
  hero_title        text not null default 'Everything, beautifully organised.',
  hero_subtitle     text not null default 'Browse by category to discover products — complete with rich specs and interactive 3D previews.',
  primary_cta_label text not null default 'Browse the catalog',
  primary_cta_href  text not null default '/catalog',
  featured_enabled  boolean not null default true,
  updated_at        timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

-- Seed the single row if it doesn't exist yet.
insert into public.site_settings (id) values (true)
on conflict (id) do nothing;

-- keep updated_at fresh (reuses set_updated_at() from the base schema)
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- --- RLS: public read, authenticated write -----------------------------------
alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_auth_write" on public.site_settings;
create policy "site_settings_auth_write"
  on public.site_settings for all
  to authenticated
  using (true)
  with check (true);
