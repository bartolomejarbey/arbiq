-- ============================================================================
-- 0022: serverless-safe rate limiting (atomicky counter v DB)
-- ============================================================================
-- Verejne POST endpointy /api/track a /api/consent byly bez limitu (spam/DoS).
-- In-memory limiter v serverless nefunguje (per-instance). Reseni: counter
-- tabulka + atomicka RPC rl_hit (insert-on-conflict, sliding okno).

create table if not exists public.rate_limits (
  bucket text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;  -- zadne user policies → jen service/definer

-- rl_hit: zaznamena pokus, vrati true pokud JE pod limitem (povoleno).
create or replace function public.rl_hit(p_bucket text, p_limit int, p_window int)
returns boolean language plpgsql security definer set search_path = public as $$
declare cur_count int;
begin
  insert into public.rate_limits(bucket, count, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update set
    count = case when public.rate_limits.window_start < now() - make_interval(secs => p_window)
                 then 1 else public.rate_limits.count + 1 end,
    window_start = case when public.rate_limits.window_start < now() - make_interval(secs => p_window)
                        then now() else public.rate_limits.window_start end
  returning count into cur_count;
  return cur_count <= p_limit;
end;
$$;
grant execute on function public.rl_hit(text, int, int) to anon, authenticated;
