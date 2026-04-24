create extension if not exists "pgcrypto";

create table if not exists public.laptops (
  id uuid primary key default gen_random_uuid(),
  post_number integer unique,
  brand text not null,
  model text not null,
  condition text,
  warranty_months integer,
  cpu jsonb not null default '{}'::jsonb,
  ram jsonb not null default '{}'::jsonb,
  storage jsonb not null default '{}'::jsonb,
  display jsonb not null default '{}'::jsonb,
  gpus jsonb not null default '[]'::jsonb,
  features text[] default '{}',
  contacts text[] default '{}',
  links jsonb not null default '{}'::jsonb,
  os text,
  price numeric(10,2) not null,
  currency text not null default 'USD',
  is_favorite boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  image_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.laptops
  add column if not exists is_favorite boolean not null default false;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_laptops_updated_at on public.laptops;

create trigger trg_laptops_updated_at
before update on public.laptops
for each row
execute function set_updated_at();

create index if not exists idx_laptops_brand_model on public.laptops(brand, model);
create index if not exists idx_laptops_price on public.laptops(price);
create index if not exists idx_laptops_cpu on public.laptops using gin(cpu);
create index if not exists idx_laptops_ram on public.laptops using gin(ram);
create index if not exists idx_laptops_storage on public.laptops using gin(storage);
create index if not exists idx_laptops_display on public.laptops using gin(display);
create index if not exists idx_laptops_gpus on public.laptops using gin(gpus);
create index if not exists idx_laptops_features on public.laptops using gin(features);
create index if not exists idx_laptops_links on public.laptops using gin(links);
create index if not exists idx_laptops_favorite_created on public.laptops(is_favorite, created_at desc);

insert into public.laptops (
  post_number,
  brand,
  model,
  condition,
  warranty_months,
  cpu,
  ram,
  storage,
  display,
  gpus,
  features,
  contacts,
  links,
  os,
  price,
  currency
)
select
  1237,
  'Gigabyte',
  'Aero',
  'Ko''p ishlamagan',
  12,
  '{
    "name": "Intel Core i7-12700H",
    "cores": 14,
    "threads": 20,
    "base_ghz": 2.30,
    "boost_ghz": 4.90
  }'::jsonb,
  '{
    "size_gb": 24,
    "type": "DDR5",
    "speed_mhz": 4800
  }'::jsonb,
  '{
    "size_gb": 1000,
    "type": "SSD",
    "interface": "M.2 NVME PCIE4"
  }'::jsonb,
  '{
    "size_inch": 16.0,
    "resolution": "4K",
    "panel": "OLED"
  }'::jsonb,
  '[
    {"type": "dedicated", "name": "RTX 3070TI", "vram_gb": 8},
    {"type": "integrated", "name": "Intel Iris Xe", "vram_gb": 8}
  ]'::jsonb,
  array[
    'Podsvetka klaviatura',
    'Podsvetka logo',
    'Metal корпус',
    'Face ID',
    'Harman Kardon Sound 4x'
  ],
  array[
    '+998979660595',
    '+998558080907'
  ],
  '{
    "note": "https://t.me/noutbuk_kompyuter/880?single",
    "admin": "http://t.me/rogadmin",
    "telegram_group": "https://t.me/noteboks_uz",
    "instagram": "https://www.instagram.com/noutbuk_kompyuter",
    "channel": "http://t.me/noutbuk_kompyuter"
  }'::jsonb,
  'Windows 11 Pro Republic Of Gamers Edition',
  899,
  'USD'
where not exists (
  select 1 from public.laptops where post_number = 1237
);
