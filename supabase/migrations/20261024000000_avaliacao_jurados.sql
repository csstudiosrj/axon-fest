-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 3 — Avaliação dos jurados (offline) e apuração
--
-- • Ficha = avaliação de UM jurado para UMA apresentação: comentário e estado
--   (finalizada trava as notas; só a produção reabre). Notas por critério
--   continuam em avaliacoes.
-- • Cada designação de jurado (evento_jurados) tem uma chave AES-256 usada para
--   criptografar as notas entregues por QR code, sem internet.
-- • O festival escolhe o método de apuração por evento e define pesos.
-- • Escrita de notas/fichas pelo jurado acontece só pela rota do servidor
--   (/api/jurado/sincronizar), que aplica a trava de finalização.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Configuração da apuração no evento ──────────────────────────────────────
alter table public.eventos
  add column if not exists metodo_apuracao text not null default 'media_simples',
  add column if not exists liberar_comentarios boolean not null default false,
  add column if not exists resultado_publicado_em timestamptz;

alter table public.eventos drop constraint if exists eventos_metodo_apuracao_check;
alter table public.eventos add constraint eventos_metodo_apuracao_check
  check (metodo_apuracao in ('media_simples', 'ponderada', 'descarta_extremos'));

alter table public.criterios_avaliacao
  add column if not exists peso numeric not null default 1 check (peso > 0);

-- Desempate definido manualmente pela produção (menor = melhor colocado entre empatados)
alter table public.apresentacoes add column if not exists desempate integer;

-- ── Chave de transferência por jurado/evento (32 bytes em base64) ───────────
create or replace function public.gerar_chave_transferencia() returns text
  language sql volatile
as $$
  select encode(
    decode(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'hex'),
    'base64');
$$;

alter table public.evento_jurados
  add column if not exists chave_transferencia text not null default public.gerar_chave_transferencia();

-- ── Notas: carimbo de atualização (resolve conflitos entre aparelhos) ───────
alter table public.avaliacoes
  add column if not exists atualizado_em timestamptz not null default now();

-- ── Fichas ──────────────────────────────────────────────────────────────────
create table if not exists public.avaliacoes_fichas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  apresentacao_id uuid not null references public.apresentacoes(id) on delete cascade,
  avaliador_id uuid not null references public.usuarios(id) on delete cascade,
  comentario text,
  finalizada_em timestamptz,
  origem text not null default 'online' check (origem in ('online', 'qr')),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (evento_id, apresentacao_id, avaliador_id)
);
create index if not exists idx_fichas_evento on public.avaliacoes_fichas (evento_id);

-- Notas de apresentações apagadas não devem travar a exclusão
alter table public.avaliacoes drop constraint if exists avaliacoes_coreografia_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_coreografia_id_fkey
  foreign key (apresentacao_id) references public.apresentacoes(id) on delete cascade;
alter table public.avaliacoes drop constraint if exists avaliacoes_evento_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_evento_id_fkey
  foreign key (evento_id) references public.eventos(id) on delete cascade;
alter table public.avaliacoes drop constraint if exists avaliacoes_criterio_id_fkey;
alter table public.avaliacoes add constraint avaliacoes_criterio_id_fkey
  foreign key (criterio_id) references public.criterios_avaliacao(id) on delete cascade;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.avaliacoes_fichas enable row level security;

drop policy if exists fichas_select on public.avaliacoes_fichas;
create policy fichas_select on public.avaliacoes_fichas for select to authenticated
  using (avaliador_id = auth.uid() or eh_super_admin() or evento_da_minha_produtora(evento_id));
drop policy if exists fichas_write on public.avaliacoes_fichas;
create policy fichas_write on public.avaliacoes_fichas for all to authenticated
  using (pode_gerir_evento(evento_id)) with check (pode_gerir_evento(evento_id));

-- Jurado passa a gravar só pelo servidor (trava de finalização aplicada lá)
drop policy if exists avaliacoes_insert on public.avaliacoes;
drop policy if exists avaliacoes_update on public.avaliacoes;
create policy avaliacoes_insert on public.avaliacoes for insert to authenticated
  with check (pode_gerir_evento(evento_id));
create policy avaliacoes_update on public.avaliacoes for update to authenticated
  using (pode_gerir_evento(evento_id));

-- Comentários liberados aos grupos (sem identificar o jurado)
create or replace view public.comentarios_jurados_grupo as
  select f.evento_id, f.apresentacao_id, a.grupo_id,
         dense_rank() over (partition by f.evento_id order by f.avaliador_id) as jurado_numero,
         f.comentario
  from avaliacoes_fichas f
  join apresentacoes a on a.id = f.apresentacao_id
  join eventos e on e.id = f.evento_id
  where e.liberar_comentarios
    and e.resultado_publicado_em is not null
    and f.finalizada_em is not null
    and nullif(trim(f.comentario), '') is not null
    and a.grupo_id = get_minha_organizacao_id();

revoke all on public.comentarios_jurados_grupo from anon;
grant select on public.comentarios_jurados_grupo to authenticated;

-- ── Resultado publicado (retrato da classificação no momento da publicação) ─
create table if not exists public.resultados_publicados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  grupo_titulo text not null,          -- categoria · formação
  ordem_grupo integer not null,
  posicao integer,
  apresentacao_id uuid references public.apresentacoes(id) on delete set null,
  apresentacao_nome text not null,
  grupo_nome text,
  nota numeric,
  created_at timestamptz not null default now()
);
create index if not exists idx_resultados_evento on public.resultados_publicados (evento_id);

alter table public.resultados_publicados enable row level security;
drop policy if exists resultados_select on public.resultados_publicados;
create policy resultados_select on public.resultados_publicados for select to anon, authenticated
  using (exists (select 1 from eventos e where e.id = evento_id and e.resultado_publicado_em is not null)
         or eh_super_admin() or evento_da_minha_produtora(evento_id));
-- escrita só pelo servidor (service role)
