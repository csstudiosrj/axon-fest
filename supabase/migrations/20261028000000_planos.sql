-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 4e — Plano da produtora (Start / Pro)
--
-- Start: gratuito por N meses (configuracoes_sistema.precos.mesesStart) a
-- partir de plano_inicio; depois, modo leitura por mais N meses (mesesGuarda);
-- depois, exclusão dos dados. Pro: mantém tudo enquanto pro_ate estiver no
-- futuro. Por enquanto o super admin muda o plano manualmente; a cobrança
-- automática entra com o meio de pagamento.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.produtoras
  add column if not exists plano text not null default 'start',
  add column if not exists plano_inicio timestamptz,
  add column if not exists pro_ate timestamptz;

alter table public.produtoras drop constraint if exists produtoras_plano_check;
alter table public.produtoras add constraint produtoras_plano_check check (plano in ('start', 'pro'));

update public.produtoras set plano_inicio = coalesce(created_at, now()) where plano_inicio is null;
alter table public.produtoras alter column plano_inicio set default now();
alter table public.produtoras alter column plano_inicio set not null;

-- O dono do festival edita nome, logo e contato da produtora, mas não o plano
create or replace function public.proteger_plano_produtora() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') and not eh_super_admin() then
    new.plano := old.plano;
    new.plano_inicio := old.plano_inicio;
    new.pro_ate := old.pro_ate;
    new.demonstracao := old.demonstracao;
    new.ativo := old.ativo;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_plano_produtora on public.produtoras;
create trigger trg_proteger_plano_produtora
  before update on public.produtoras
  for each row execute function public.proteger_plano_produtora();
