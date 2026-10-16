-- 003: QvaPay payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  remote_id text unique not null,
  transaction_uuid text,
  transaction_id text,
  status text not null check (status in ('pending','paid','cancelled','failed')),
  amount numeric(12,2),
  description text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy if not exists payments_select on public.payments for select using (true);
create policy if not exists payments_mod on public.payments for all using (public.casa_abierta_is_admin(auth.uid())) with check (public.casa_abierta_is_admin(auth.uid()));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute procedure public.set_updated_at();