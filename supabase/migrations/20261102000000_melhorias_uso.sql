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

-- ── 5. Assinatura eletrônica dos documentos do evento (uso de imagem, autorização de menores) ──
-- Gravação só pelo servidor (service role); a equipe da produtora lê.
create table if not exists public.assinaturas_documentos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.termos_documentos(id) on delete cascade,
  versao integer not null,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete cascade,
  assinante_nome text not null,
  assinante_cpf text not null,
  assinante_papel text not null check (assinante_papel in ('participante', 'responsavel')),
  parentesco text,
  conteudo_hash text not null,
  ip text,
  user_agent text,
  assinado_em timestamptz not null default now(),
  unique (documento_id, participante_id, versao)
);
alter table public.assinaturas_documentos enable row level security;
drop policy if exists assinaturas_documentos_select on public.assinaturas_documentos;
create policy assinaturas_documentos_select on public.assinaturas_documentos for select to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id)));

-- Link de assinatura enviado por e-mail (vale 30 dias)
create table if not exists public.pedidos_assinatura (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  participante_id uuid not null references public.participantes(id) on delete cascade,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '30 days'
);
alter table public.pedidos_assinatura enable row level security;

-- ── 6. Check-in por apresentação (a produção marca quem se apresentou) ──
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  apresentacao_id uuid not null references public.apresentacoes(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete cascade,
  feito_por uuid references public.usuarios(id) on delete set null,
  feito_em timestamptz not null default now(),
  unique (apresentacao_id, participante_id)
);
create index if not exists checkins_evento_idx on public.checkins (evento_id);
alter table public.checkins enable row level security;
drop policy if exists checkins_select on public.checkins;
create policy checkins_select on public.checkins for select to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id)));

-- ── 7. Certificados: modelo editável por evento e um certificado por pessoa e apresentação ──
create table if not exists public.certificado_modelos (
  evento_id uuid primary key references public.eventos(id) on delete cascade,
  liberado boolean not null default false,
  titulo text not null default 'Certificado de Participação',
  texto text not null,
  cor text not null default '#C5A059',
  fundo_url text,
  assinaturas jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.certificado_modelos enable row level security;
drop policy if exists certificado_modelos_select on public.certificado_modelos;
create policy certificado_modelos_select on public.certificado_modelos for select to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id)));

create table if not exists public.certificados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  apresentacao_id uuid not null references public.apresentacoes(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete cascade,
  emitido_em timestamptz not null default now(),
  unique (apresentacao_id, participante_id)
);
alter table public.certificados enable row level security;
drop policy if exists certificados_select on public.certificados;
create policy certificados_select on public.certificados for select to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id)));
