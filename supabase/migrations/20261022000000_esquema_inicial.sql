-- ════════════════════════════════════════════════════════════════════════════
-- ESQUEMA INICIAL — retrato do banco de produção em 22/10/2026.
-- NÃO RODAR em produção (já existe). Serve como histórico e para recriar o
-- banco do zero (ex.: ambiente de testes). As políticas RLS antigas não foram
-- copiadas porque são substituídas pela migration de segurança seguinte.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Cadastros base ──────────────────────────────────────────────────────────

create table public.produtoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  email text,
  created_at timestamptz default now(),
  telefone text,
  logo_url text,
  ativo boolean not null default true
);

create table public.perfis_festival (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  icone text,
  descricao text,
  ativo boolean not null default true,
  ordem integer default 0,
  created_at timestamptz not null default now()
);

create table public.estilos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis_festival(id) on delete cascade,
  nome text not null,
  slug text not null,
  ativo boolean not null default true,
  ordem integer default 0,
  created_at timestamptz not null default now(),
  descricao text,
  constraint estilos_perfil_id_slug_key unique (perfil_id, slug)
);

create table public.grupos (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  responsavel text,
  telefone text,
  email text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  cidade text,
  estado text,
  documento text,
  produtora_id uuid references public.produtoras(id),
  email_contato text,
  tipo_documento text,
  origem_produtora_id uuid,
  constraint escolas_pkey primary key (id),
  constraint escolas_email_key unique (email),
  constraint grupos_documento_unique unique (documento),
  constraint grupos_tipo_documento_check check (tipo_documento = any (array['cpf','cnpj']))
);

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  role text not null,
  organizacao_id uuid,
  created_at timestamptz default now(),
  invite_token uuid default gen_random_uuid(),
  invite_usado boolean default false,
  especialidade text,
  cache_valor numeric,
  cache_status text default 'pendente'::text,
  telefone text,
  foto_url text,
  produtora_id uuid references public.produtoras(id),
  ativo boolean not null default true,
  mini_bio text,
  constraint usuarios_escola_id_fkey foreign key (organizacao_id) references public.grupos(id) on delete set null,
  constraint usuarios_role_check check (role = any (array['super_admin','admin','produtor','marketing','assistente','org_admin','org_membro','jurado']))
);

-- ── Eventos ─────────────────────────────────────────────────────────────────

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date,
  data_fim date,
  local text,
  status text default 'Em Montagem'::text,
  inscritos_count integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  descricao text,
  banner_url text,
  regulamento_url text,
  produtora_id uuid references public.produtoras(id) on delete cascade,
  perfil_id uuid references public.perfis_festival(id),
  formato text default 'competitivo'::text,
  tipo_premiacao text default 'apenas_trofeus_e_medalhas'::text,
  multilocal boolean default false,
  slug text unique,
  cor_primaria text default '#D4AF37'::text,
  cor_secundaria text default '#111111'::text,
  fonte_familia text default 'sans'::text,
  logo_url text,
  tema_escuro boolean default true,
  exibir_loja_publica boolean default false,
  instagram_handle text,
  exibir_feed_instagram boolean default false,
  termo_imagem_url text,
  autorizacao_menor_url text
);

create table public.locais_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nome_local text not null,
  endereco text,
  cidade text,
  estado text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nome text not null,
  valor_solo numeric default 0,
  valor_duo numeric default 0,
  valor_conjunto numeric default 0,
  created_at timestamptz default now(),
  genero text default 'livre'::text check (genero = any (array['masculino','feminino','misto','livre'])),
  faixa_etaria_min integer,
  faixa_etaria_max integer,
  faixa_etaria_label text,
  categoria_pai_id uuid references public.categorias(id) on delete cascade,
  estilo_id uuid references public.estilos(id),
  permite_solo boolean default true,
  permite_duo boolean default true,
  permite_conjunto boolean default true,
  min_participantes integer,
  max_participantes integer,
  tempo_apresentacao_min integer,
  tempo_apresentacao_max integer,
  observacoes text,
  cor_identificacao text,
  produtora_id uuid references public.produtoras(id),
  competitiva boolean default true,
  premio_dinheiro_1 numeric,
  premio_dinheiro_2 numeric,
  premio_dinheiro_3 numeric
);

create table public.criterios_avaliacao (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos(id) on delete cascade,
  nome text not null,
  nota_min numeric not null default 0,
  nota_max numeric not null default 10,
  ordem integer,
  created_at timestamptz default now()
);

create table public.evento_jurados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  jurado_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  cache_valor numeric,
  cache_status text default 'pendente'::text,
  especialidade text,
  constraint unique_evento_jurado unique (evento_id, jurado_id)
);

create table public.inscricoes_grupo_evento (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  data_inscricao timestamptz default now(),
  status text default 'pendente'::text,
  created_at timestamptz default now(),
  origem text default 'landing'::text,
  unique (grupo_id, evento_id)
);

-- ── Participantes e apresentações ───────────────────────────────────────────

create table public.participantes (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  data_nascimento date not null,
  documento text,
  termo_assinado boolean default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  estilo_id uuid references public.estilos(id) on delete set null,
  produtora_id uuid references public.produtoras(id),
  festival_id uuid,
  status_disponibilidade text default 'disponivel'::text,
  confirmado_vinculo boolean default false,
  email_contato text,
  tipo_documento text,
  origem_produtora_id uuid,
  funcao text,
  constraint bailarinos_pkey primary key (id),
  constraint bailarinos_cpf_key unique (documento),
  constraint participantes_tipo_documento_check check (tipo_documento = any (array['cpf','cnpj']))
);

create table public.grupo_participante (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete cascade,
  data_vinculo timestamptz default now(),
  status text default 'ativo'::text,
  bloqueado_por_produtora uuid,
  unique (grupo_id, participante_id)
);

create table public.participacoes_participante_grupo_evento (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.participantes(id) on delete cascade,
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  data_vinculo timestamptz default now(),
  confirmado boolean default false,
  status_disponibilidade text default 'disponivel'::text,
  token_confirmacao text unique,
  constraint participacoes_participante_gr_participante_id_grupo_id_even_key unique (participante_id, grupo_id, evento_id)
);
create index idx_participacoes_participante on public.participacoes_participante_grupo_evento (participante_id);
create index idx_participacoes_grupo on public.participacoes_participante_grupo_evento (grupo_id);
create index idx_participacoes_evento on public.participacoes_participante_grupo_evento (evento_id);
create index idx_participacoes_token on public.participacoes_participante_grupo_evento (token_confirmacao);

create table public.participantes_bloqueados (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid references public.participantes(id) on delete cascade,
  produtora_id uuid not null,
  criado_em timestamptz not null default timezone('utc'::text, now()),
  unique (participante_id, produtora_id)
);

create table public.apresentacoes (
  id uuid not null default gen_random_uuid(),
  evento_id uuid,
  grupo_id uuid,
  nome text not null,
  categoria_id_old text not null,
  tipo text not null,
  quantidade_bailarinos integer default 1,
  valor_total numeric default 0.00,
  status_pagamento text default 'Pendente'::text,
  arquivo_audio text,
  status_audio text default 'Pendente'::text,
  ordem_apresentacao integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  observacoes text,
  arquivo_mapa_luz text,
  categoria_id uuid,
  produtora_id uuid references public.produtoras(id),
  local_id uuid,
  data_apresentacao date,
  constraint coreografias_pkey primary key (id),
  constraint coreografias_evento_id_fkey foreign key (evento_id) references public.eventos(id) on delete cascade,
  constraint coreografias_escola_id_fkey foreign key (grupo_id) references public.grupos(id) on delete cascade,
  constraint apresentacoes_local_id_fkey foreign key (local_id) references public.locais_evento(id) on delete set null,
  constraint apresentacoes_categoria_id_fkey foreign key (categoria_id) references public.categorias(id) on delete set null,
  constraint apresentacoes_tipo_check check (tipo = any (array['solo','duo','conjunto','grupo']))
);

create table public.apresentacao_elenco (
  apresentacao_id uuid not null,
  participante_id uuid not null,
  constraint coreografia_elenco_pkey primary key (apresentacao_id, participante_id),
  constraint coreografia_elenco_coreografia_id_fkey foreign key (apresentacao_id) references public.apresentacoes(id) on delete cascade,
  constraint coreografia_elenco_bailarino_id_fkey foreign key (participante_id) references public.participantes(id) on delete cascade
);

create table public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid,
  apresentacao_id uuid,
  avaliador_id uuid,
  criterio_id uuid references public.criterios_avaliacao(id),
  nota numeric not null,
  sincronizado boolean default false,
  created_at timestamptz default now(),
  produtora_id uuid references public.produtoras(id),
  constraint avaliacoes_evento_id_fkey foreign key (evento_id) references public.eventos(id),
  constraint avaliacoes_coreografia_id_fkey foreign key (apresentacao_id) references public.apresentacoes(id),
  constraint avaliacoes_jurado_id_fkey foreign key (avaliador_id) references public.usuarios(id),
  constraint avaliacoes_unique unique (evento_id, apresentacao_id, avaliador_id, criterio_id)
);

-- ── PDV, loja e marketing ───────────────────────────────────────────────────

create table public.pdv_config (
  id uuid primary key default gen_random_uuid(),
  pin_vendedor text not null default '1234'::text,
  chave_pix text,
  nome_recebedor text,
  cidade_recebedor text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.pdv_produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric not null default 0,
  categoria text,
  tipo text not null default 'cantina'::text,
  estoque integer,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  ordem integer default 0,
  evento_id uuid references public.eventos(id) on delete cascade,
  descricao text,
  produtora_id uuid references public.produtoras(id)
);

create table public.pdv_vendas (
  id uuid primary key default gen_random_uuid(),
  operador_id uuid references public.usuarios(id) on delete set null,
  itens jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  forma_pagamento text not null,
  sincronizado boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.evento_produtos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  produto_id uuid not null references public.pdv_produtos(id) on delete cascade,
  preco_evento numeric,
  estoque_evento integer,
  ativo_evento boolean default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint unique_evento_produto unique (evento_id, produto_id)
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric not null default 0,
  estoque integer,
  tem_variacao boolean not null default false,
  ativo boolean not null default true,
  mostrar_checkout boolean not null default false,
  created_at timestamptz not null default now(),
  imagem_url text,
  exibir_imagem boolean default false,
  exibir_loja_publica boolean default true,
  produtora_id uuid
);

create table public.produto_variacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  nome text not null,
  estoque integer,
  created_at timestamptz not null default now()
);

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.grupos(id) on delete cascade,
  coreografia_id uuid references public.apresentacoes(id) on delete set null,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  variacao_id uuid references public.produto_variacoes(id) on delete set null,
  quantidade integer not null default 1,
  preco_unitario numeric not null default 0,
  status text not null default 'pendente'::text,
  created_at timestamptz not null default now()
);

create table public.posts_marketing (
  id uuid primary key default gen_random_uuid(),
  legenda text not null,
  imagem_url text,
  agendado_para timestamptz not null,
  status text not null default 'agendado'::text,
  plataforma text not null default 'Instagram'::text,
  publicado_em timestamptz,
  erro text,
  created_at timestamptz not null default now()
);

-- ── Configuração da produtora e termos ──────────────────────────────────────

create table public.tenant_config (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references public.perfis_festival(id),
  nome_organizacao text,
  configurado_em timestamptz,
  termo_inscricao text default 'Inscrição'::text,
  termo_participante text default 'Bailarino'::text,
  termo_grupo text default 'Escola'::text,
  updated_at timestamptz not null default now(),
  termo_apresentacao text,
  organizacao_id uuid,
  produtora_id uuid references public.produtoras(id),
  logo_url text,
  cor_primaria text default '#C5A059'::text,
  nome_exibicao text,
  termo_grupo_plural text,
  termo_participante_plural text,
  termo_apresentacao_plural text,
  termo_evento text,
  constraint tenant_config_escola_id_fkey foreign key (organizacao_id) references public.usuarios(id) on delete cascade
);
create unique index tenant_config_escola_id_key on public.tenant_config (organizacao_id);

create table public.tenant_estilos_ativos (
  id uuid primary key default gen_random_uuid(),
  estilo_id uuid not null references public.estilos(id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  organizacao_id uuid,
  produtora_id uuid not null references public.produtoras(id) on delete cascade,
  constraint tenant_estilos_ativos_escola_id_fkey foreign key (organizacao_id) references public.usuarios(id) on delete cascade,
  constraint tenant_estilos_ativos_produtora_estilo_key unique (produtora_id, estilo_id)
);
create unique index tenant_estilos_ativos_escola_estilo_key on public.tenant_estilos_ativos (organizacao_id, estilo_id);

create table public.termos_documentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  titulo text not null,
  conteudo text not null default ''::text,
  versao integer not null default 1,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  evento_id uuid,
  produtora_id uuid,
  exibir_publico boolean default false,
  formato text default 'html'::text,
  arquivo_url text
);

create table public.termos_aceites (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.termos_documentos(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  bailarino_id uuid references public.participantes(id) on delete set null,
  nome_assinante text,
  email_assinante text,
  ip_address text,
  user_agent text,
  tipo_assinante text not null,
  aceito_em timestamptz not null default now()
);

-- ── Funções auxiliares e gatilhos existentes ────────────────────────────────

create or replace function public.get_meu_role() returns text
  language sql stable security definer
as $$ select role from usuarios where id = auth.uid(); $$;

create or replace function public.get_minha_organizacao_id() returns uuid
  language sql stable security definer
as $$ select organizacao_id from usuarios where id = auth.uid(); $$;

create or replace function public.get_minha_produtora_id() returns uuid
  language sql stable security definer
as $$ select produtora_id from usuarios where id = auth.uid(); $$;

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer
as $$
begin
  insert into public.usuarios (id, email, role) values (new.id, new.email, 'escola_admin');
  return new;
exception when others then
  raise log 'Erro ao inserir na tabela usuarios: %', sqlerrm;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Proteção de cargo/vínculo criada na Etapa 1 (docs/seguranca/etapa-1.sql)
create or replace function public.proteger_colunas_usuarios() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return coalesce(new, old);
  end if;
  if tg_op = 'INSERT' then
    raise exception 'Cadastro de usuários só pelo servidor.' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (
       new.role is distinct from old.role
    or new.produtora_id is distinct from old.produtora_id
    or new.organizacao_id is distinct from old.organizacao_id
    or new.ativo is distinct from old.ativo
    or new.id is distinct from old.id
  ) then
    raise exception 'Alteração de cargo/vínculo só pelo servidor.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trg_proteger_colunas_usuarios
  before insert or update on public.usuarios
  for each row execute function public.proteger_colunas_usuarios();

-- ── Storage ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('axon-assets', 'axon-assets', true),
  ('marketing', 'marketing', true)
on conflict (id) do nothing;
