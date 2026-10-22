-- ════════════════════════════════════════════════════════════════════════════
-- Alinha o banco com o que o código já usa. Antes desta migration várias telas
-- falhavam por colunas inexistentes (PDV, vínculo de participantes, termos,
-- marketing, loja). Só ADICIONA/renomeia colunas; não apaga dados.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Cargos: inclui 'operador' (caixa/bilheteria) ────────────────────────────
alter table public.usuarios drop constraint if exists usuarios_role_check;
alter table public.usuarios add constraint usuarios_role_check check (role = any (array[
  'super_admin','admin','produtor','marketing','assistente','operador','jurado','org_admin','org_membro'
]));

-- O gatilho antigo tentava criar usuarios com o cargo inexistente 'escola_admin'
-- (sempre falhava em silêncio). O cadastro agora é feito pelas rotas do servidor.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ── PDV: configuração por produtora ─────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pdv_config' and column_name = 'chave_pix') then
    alter table public.pdv_config rename column chave_pix to pix_chave;
    alter table public.pdv_config rename column nome_recebedor to pix_nome;
    alter table public.pdv_config rename column cidade_recebedor to pix_cidade;
  end if;
end $$;
alter table public.pdv_config alter column pin_vendedor drop not null;
alter table public.pdv_config alter column pin_vendedor drop default;
alter table public.pdv_config
  add column if not exists produtora_id uuid references public.produtoras(id) on delete cascade,
  add column if not exists pin_admin text;
create unique index if not exists pdv_config_produtora_id_key on public.pdv_config (produtora_id);

-- ── PDV: vendas (uma linha por item, como o caixa envia) ────────────────────
alter table public.pdv_vendas
  add column if not exists produtora_id uuid references public.produtoras(id) on delete cascade,
  add column if not exists evento_id uuid references public.eventos(id) on delete set null,
  add column if not exists produto_id uuid,
  add column if not exists produto_nome text,
  add column if not exists quantidade integer not null default 1,
  add column if not exists preco_unitario numeric not null default 0,
  add column if not exists operador_nome text;
create index if not exists idx_pdv_vendas_produtora on public.pdv_vendas (produtora_id, created_at desc);

-- ── Vínculo participante ↔ grupo com confirmação por e-mail ─────────────────
alter table public.grupo_participante
  add column if not exists funcao text,
  add column if not exists confirmado boolean not null default false,
  add column if not exists token_confirmacao text;
create unique index if not exists grupo_participante_token_key
  on public.grupo_participante (token_confirmacao) where token_confirmacao is not null;

-- ── Participantes: assinatura do termo e responsável legal ──────────────────
alter table public.participantes
  add column if not exists nome_artistico text,
  add column if not exists responsavel_nome text,
  add column if not exists responsavel_cpf text,
  add column if not exists responsavel_parentesco text,
  add column if not exists termo_assinado_em timestamptz,
  add column if not exists termo_assinado_ip text,
  add column if not exists termo_assinado_user_agent text,
  -- quem cadastrou: permite que o grupo/produtora veja o participante logo após criá-lo
  add column if not exists criado_por uuid default auth.uid() references public.usuarios(id) on delete set null;

-- ── Apresentações: metadados do áudio ───────────────────────────────────────
alter table public.apresentacoes
  add column if not exists audio_duracao integer,
  add column if not exists audio_nome_original text;

-- ── Multi-produtora em tabelas que não tinham o vínculo ─────────────────────
-- ("not valid": não trava se houver linha antiga apontando para registro apagado)
alter table public.posts_marketing
  add column if not exists produtora_id uuid references public.produtoras(id) on delete cascade;
alter table public.pedido_itens
  add column if not exists produtora_id uuid references public.produtoras(id) on delete cascade;
alter table public.produtos
  drop constraint if exists produtos_produtora_id_fkey,
  add constraint produtos_produtora_id_fkey foreign key (produtora_id) references public.produtoras(id) on delete cascade not valid;
alter table public.termos_documentos
  drop constraint if exists termos_documentos_produtora_id_fkey,
  add constraint termos_documentos_produtora_id_fkey foreign key (produtora_id) references public.produtoras(id) on delete cascade not valid,
  drop constraint if exists termos_documentos_evento_id_fkey,
  add constraint termos_documentos_evento_id_fkey foreign key (evento_id) references public.eventos(id) on delete cascade not valid;

-- ── Termo legal padrão da produtora (usado na confirmação de participação) ──
alter table public.tenant_config add column if not exists termo_legal_texto text;
