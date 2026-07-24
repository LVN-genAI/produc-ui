-- =============================================================================
-- SUPABASE_SCHEMA.sql
-- Schema-driven, N-level category product catalog.
-- Run this in the Supabase SQL Editor (or via the CLI) once per project.
-- Idempotent where practical so it can be re-run safely.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- categories
-- N-level tree via self-referencing parent_id.
-- attributes_schema is the JSONB "blueprint" the admin edits. It is an ARRAY of
-- field definitions, each shaped like:
--   {
--     "key": "ram",                 -- machine key used in products.attributes
--     "label": "RAM",               -- human label
--     "type": "select",             -- text | number | select | swatch
--     "options": ["8GB","16GB"],    -- only for select / swatch
--     "required": true,
--     "show_in_grid": true          -- surface this attribute on catalog cards
--   }
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id                uuid primary key default gen_random_uuid(),
  parent_id         uuid references public.categories (id) on delete cascade,
  name              text not null,
  slug              text not null,
  attributes_schema jsonb not null default '[]'::jsonb,
  position          integer not null default 0,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Sibling slugs must be unique so a category path resolves deterministically.
create unique index if not exists categories_parent_slug_uidx
  on public.categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index if not exists categories_parent_id_idx on public.categories (parent_id);

-- -----------------------------------------------------------------------------
-- products
-- attributes is the JSONB payload whose keys match the category's schema keys.
-- image_urls holds public URLs from the catalog-assets bucket.
-- model_3d_url is a single public URL to a .glb/.gltf asset (nullable).
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete cascade,
  title        text not null,
  base_price   numeric(12, 2) not null default 0,
  attributes   jsonb not null default '{}'::jsonb,
  image_urls   text[] not null default '{}',
  model_3d_url text,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
-- Public (anon) can READ the catalog. Authenticated users (admins) can write.
-- Tighten "authenticated" to a role/claim check later if you add non-admin users.
-- =============================================================================
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- categories: public read
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

-- categories: authenticated write
drop policy if exists "categories_auth_write" on public.categories;
create policy "categories_auth_write"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

-- products: public read
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- products: authenticated write
drop policy if exists "products_auth_write" on public.products;
create policy "products_auth_write"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- =============================================================================
-- Storage: catalog-assets bucket (images + 3D models)
-- Public read so <img> / <model-viewer> can load by URL; authenticated write
-- so admins can upload directly from the browser.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('catalog-assets', 'catalog-assets', true)
on conflict (id) do nothing;

drop policy if exists "catalog_assets_public_read" on storage.objects;
create policy "catalog_assets_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'catalog-assets');

drop policy if exists "catalog_assets_auth_insert" on storage.objects;
create policy "catalog_assets_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'catalog-assets');

drop policy if exists "catalog_assets_auth_update" on storage.objects;
create policy "catalog_assets_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'catalog-assets')
  with check (bucket_id = 'catalog-assets');

drop policy if exists "catalog_assets_auth_delete" on storage.objects;
create policy "catalog_assets_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'catalog-assets');

-- =============================================================================
-- Archive indexes + site_settings (admin-managed home page).
-- (Also delivered standalone as SUPABASE_MIGRATION_02.sql for existing DBs.)
-- =============================================================================
create index if not exists categories_archived_at_idx
  on public.categories (archived_at);
create index if not exists products_archived_at_idx
  on public.products (archived_at);

create table if not exists public.site_settings (
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

insert into public.site_settings (id) values (true)
on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

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
