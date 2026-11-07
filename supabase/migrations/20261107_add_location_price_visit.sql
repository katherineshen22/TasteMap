-- Adds location, price, and visit date to dishes. All columns are optional,
-- so existing dishes keep working. Run this in the Supabase SQL editor.
alter table public.dishes
  add column if not exists city text,
  add column if not exists neighborhood text,
  add column if not exists price_level smallint check (price_level between 1 and 4),
  add column if not exists visited_on date;

create index if not exists dishes_user_city_idx on public.dishes (user_id, city);
