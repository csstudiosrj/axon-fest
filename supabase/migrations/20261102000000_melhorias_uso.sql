-- Melhorias de uso (out/2026): tempo em minutos e segundos, vagas ocultas, PDV, assinaturas,
-- check-in e certificados. Rodar inteiro no SQL Editor do Supabase ANTES do merge.

-- ── 1. Tempo de apresentação em segundos (antes só minutos inteiros) ──
alter table public.categorias add column if not exists tempo_min_segundos integer check (tempo_min_segundos >= 0);
alter table public.categorias add column if not exists tempo_max_segundos integer check (tempo_max_segundos >= 0);
update public.categorias set tempo_min_segundos = tempo_apresentacao_min * 60 where tempo_min_segundos is null and tempo_apresentacao_min is not null;
update public.categorias set tempo_max_segundos = tempo_apresentacao_max * 60 where tempo_max_segundos is null and tempo_apresentacao_max is not null;

-- ── 2. Pessoa única: integrante ligado à conta (jurado, equipe, diretor) quando é a mesma pessoa ──
alter table public.participantes add column if not exists usuario_id uuid references public.usuarios(id) on delete set null;
create unique index if not exists participantes_usuario_unico on public.participantes (usuario_id) where usuario_id is not null;
create index if not exists participantes_email_idx on public.participantes (lower(email_contato));

-- ── 3. Quantidade de vagas é da produtora: só aparece para grupos/público se ela quiser ──
alter table public.eventos add column if not exists mostrar_vagas boolean not null default false;

-- ── 4. PDV: setor do produto do caixa (cantina ou lojinha) e setor do operador ──
alter table public.pdv_produtos add column if not exists setor text check (setor in ('cantina', 'lojinha'));
update public.pdv_produtos set setor = 'cantina' where tipo = 'cantina' and setor is null;

-- Operador trabalha num setor só: caixa (cantina e lojinha) OU bilheteria
alter table public.usuarios add column if not exists setor_pdv text check (setor_pdv in ('caixa', 'bilheteria'));
update public.usuarios set setor_pdv = 'caixa' where role = 'operador' and setor_pdv is null;
