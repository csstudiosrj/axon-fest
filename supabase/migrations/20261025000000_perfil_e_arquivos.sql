-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 4 — Tipo de festival por evento e arquivos técnicos por apresentação
--
-- • O vocabulário (escola/banda/companhia, bailarino/músico/ator…) e os arquivos
--   pedidos (trilha, rider de som, mapa de palco…) dependem do tipo do EVENTO
--   (eventos.perfil_id → perfis_festival.slug). Ver lib/perfis.ts.
-- • apresentacao_arquivos substitui as colunas fixas arquivo_audio e
--   arquivo_mapa_luz (que continuam existindo, só para leitura de dados antigos).
-- ════════════════════════════════════════════════════════════════════════════

-- Eventos sem tipo herdam o tipo configurado na produtora; senão, Multidisciplinar
update public.eventos e
set perfil_id = coalesce(
  (select tc.perfil_id from public.tenant_config tc where tc.produtora_id = e.produtora_id and tc.perfil_id is not null limit 1),
  (select id from public.perfis_festival where slug = 'multidisciplinar')
)
where e.perfil_id is null;

-- ── Arquivos técnicos ───────────────────────────────────────────────────────
create table if not exists public.apresentacao_arquivos (
  id uuid primary key default gen_random_uuid(),
  apresentacao_id uuid not null references public.apresentacoes(id) on delete cascade,
  tipo text not null,                 -- chave em lib/perfis.ts (trilha, rider_som, mapa_palco…)
  url text not null,
  nome text,
  tamanho bigint,
  mime text,
  status text not null default 'recebido' check (status in ('recebido', 'aprovado', 'recusado')),
  observacao text,                    -- retorno da produção (ex.: motivo da recusa)
  enviado_por uuid references public.usuarios(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apresentacao_id, tipo)
);
create index if not exists idx_arquivos_apresentacao on public.apresentacao_arquivos (apresentacao_id);

-- Migra os arquivos que estavam nas colunas antigas
insert into public.apresentacao_arquivos (apresentacao_id, tipo, url, enviado_por)
select id, 'trilha', arquivo_audio, null from public.apresentacoes
where nullif(trim(arquivo_audio), '') is not null
on conflict (apresentacao_id, tipo) do nothing;

insert into public.apresentacao_arquivos (apresentacao_id, tipo, url, enviado_por)
select id, 'mapa_luz', arquivo_mapa_luz, null from public.apresentacoes
where nullif(trim(arquivo_mapa_luz), '') is not null
on conflict (apresentacao_id, tipo) do nothing;

alter table public.apresentacao_arquivos enable row level security;

-- Grupo dono e equipe do evento veem e enviam; só a equipe aprova/recusa (coluna status)
drop policy if exists arquivos_select on public.apresentacao_arquivos;
create policy arquivos_select on public.apresentacao_arquivos for select to authenticated
  using (pode_editar_apresentacao(apresentacao_id));
drop policy if exists arquivos_write on public.apresentacao_arquivos;
create policy arquivos_write on public.apresentacao_arquivos for all to authenticated
  using (pode_editar_apresentacao(apresentacao_id))
  with check (pode_editar_apresentacao(apresentacao_id));

-- O grupo não pode aprovar o próprio arquivo: ao reenviar, volta para "recebido"
create or replace function public.proteger_status_arquivo() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') and not eh_equipe() then
    if tg_op = 'INSERT' then
      new.status := 'recebido';
      new.observacao := null;
    elsif new.url is distinct from old.url then
      new.status := 'recebido';
      new.observacao := null;
    elsif new.status is distinct from old.status or new.observacao is distinct from old.observacao then
      raise exception 'Somente a produção altera o status do arquivo.' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_proteger_status_arquivo on public.apresentacao_arquivos;
create trigger trg_proteger_status_arquivo
  before insert or update on public.apresentacao_arquivos
  for each row execute function public.proteger_status_arquivo();
