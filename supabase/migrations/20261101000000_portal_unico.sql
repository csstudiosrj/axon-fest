-- ════════════════════════════════════════════════════════════════════════════
-- Portal único ARXUM Fest
--   1. Endereço completo (CEP) em grupos, produtoras e locais
--   (as próximas seções deste arquivo: cargos, grupo, convites e super admin)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Endereço ─────────────────────────────────────────────────────────────
alter table public.grupos
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text;

alter table public.produtoras
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists estado text;

alter table public.locais_evento
  add column if not exists cep text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text;

-- Aceite do grupo ao se inscrever num festival (quando e de onde)
alter table public.inscricoes_grupo_evento
  add column if not exists aceite_em timestamptz,
  add column if not exists aceite_ip text;

-- ── 2. Cargos da produtora ──────────────────────────────────────────────────
--   admin (tudo) · produtor = Produção · financeiro · marketing · operador · jurado
--   "assistente" vira "financeiro".
alter table public.usuarios drop constraint if exists usuarios_role_check;
update public.usuarios set role = 'financeiro' where role = 'assistente';
alter table public.usuarios add constraint usuarios_role_check check (role in
  ('super_admin', 'admin', 'produtor', 'financeiro', 'marketing', 'operador', 'jurado', 'org_admin', 'org_membro'));

create or replace function public.eh_equipe() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('admin', 'produtor', 'financeiro', 'marketing', 'assistente',
                                     'produtora_admin', 'produtora_staff', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- Financeiro: pagamentos, PDV e caixa
create or replace function public.eh_financeiro() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('admin', 'financeiro', 'produtora_admin', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- Conteúdo da página pública e termos: admin, produção e marketing
create or replace function public.eh_conteudo() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('admin', 'produtor', 'marketing', 'produtora_admin', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- Caixa/bilheteria: operador, admin e financeiro
create or replace function public.eh_operador() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('operador', 'admin', 'financeiro', 'produtora_admin', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- PDV
drop policy if exists pdv_config_write on public.pdv_config;
create policy pdv_config_write on public.pdv_config for all to authenticated
  using (eh_super_admin() or (eh_financeiro() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_financeiro() and produtora_id = get_minha_produtora_id()));
drop policy if exists pdv_produtos_write on public.pdv_produtos;
create policy pdv_produtos_write on public.pdv_produtos for all to authenticated
  using (eh_super_admin() or (eh_financeiro() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_financeiro() and produtora_id = get_minha_produtora_id()));
drop policy if exists pdv_vendas_delete on public.pdv_vendas;
create policy pdv_vendas_delete on public.pdv_vendas for delete to authenticated
  using (eh_super_admin() or (eh_financeiro() and produtora_id = get_minha_produtora_id()));
drop policy if exists pdv_vendas_insert on public.pdv_vendas;
create policy pdv_vendas_insert on public.pdv_vendas for insert to authenticated
  with check (eh_operador() and produtora_id = get_minha_produtora_id());
drop policy if exists pdv_vendas_update on public.pdv_vendas;
create policy pdv_vendas_update on public.pdv_vendas for update to authenticated
  using (eh_operador() and produtora_id = get_minha_produtora_id());
drop policy if exists evento_produtos_write on public.evento_produtos;
create policy evento_produtos_write on public.evento_produtos for all to authenticated
  using (pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id)))
  with check (pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id)));

-- Termos: admin, produção e marketing
drop policy if exists termos_documentos_write on public.termos_documentos;
create policy termos_documentos_write on public.termos_documentos for all to authenticated
  using (eh_super_admin() or (eh_conteudo() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_conteudo() and produtora_id = get_minha_produtora_id()));

-- Evento: produção altera tudo; marketing só a página pública (gatilho abaixo)
drop policy if exists eventos_update on public.eventos;
create policy eventos_update on public.eventos for update to authenticated
  using (pode_gerir_evento(id) or (get_meu_role() = 'marketing' and eh_equipe() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or produtora_id = get_minha_produtora_id());

create or replace function public.proteger_evento_marketing() returns trigger
  language plpgsql set search_path = public
as $$
declare
  v_pagina constant text[] := array['descricao', 'slug', 'cor_primaria', 'cor_secundaria', 'fonte_familia', 'tema_escuro',
    'logo_url', 'banner_url', 'instagram_handle', 'exibir_feed_instagram', 'regulamento_url'];
  v_novo jsonb;
  v_velho jsonb;
  v_col text;
begin
  if current_user not in ('anon', 'authenticated') or get_meu_role() is distinct from 'marketing' then
    return new;
  end if;
  v_novo := to_jsonb(new);
  v_velho := to_jsonb(old);
  for v_col in select jsonb_object_keys(v_novo) loop
    if not (v_col = any (v_pagina)) and v_novo -> v_col is distinct from v_velho -> v_col then
      raise exception 'O marketing altera só a página pública do evento.' using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_proteger_evento_marketing on public.eventos;
create trigger trg_proteger_evento_marketing
  before update on public.eventos
  for each row execute function public.proteger_evento_marketing();

-- Apresentações pela equipe: produção organiza (programação), financeiro marca pagamento
drop policy if exists apresentacoes_insert on public.apresentacoes;
create policy apresentacoes_insert on public.apresentacoes for insert to authenticated
  with check (eh_super_admin() or pode_gerir_evento(evento_id)
              or (grupo_id = get_minha_organizacao_id() and meu_grupo_inscrito(evento_id)));
drop policy if exists apresentacoes_update on public.apresentacoes;
create policy apresentacoes_update on public.apresentacoes for update to authenticated
  using (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
         or grupo_id = get_minha_organizacao_id())
  with check (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
              or (grupo_id = get_minha_organizacao_id() and meu_grupo_inscrito(evento_id)));
drop policy if exists apresentacoes_delete on public.apresentacoes;
create policy apresentacoes_delete on public.apresentacoes for delete to authenticated
  using (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
         or grupo_id = get_minha_organizacao_id());

create or replace function public.proteger_apresentacao_equipe() returns trigger
  language plpgsql set search_path = public
as $$
declare
  v_role text := get_meu_role();
begin
  if current_user not in ('anon', 'authenticated') or not eh_equipe() or v_role in ('admin', 'produtora_admin', 'super_admin') then
    return new;
  end if;
  if v_role = 'financeiro' then
    -- só o pagamento
    if (to_jsonb(new) - 'status_pagamento') is distinct from (to_jsonb(old) - 'status_pagamento') then
      raise exception 'O financeiro altera só a situação do pagamento.' using errcode = '42501';
    end if;
  elsif new.status_pagamento is distinct from old.status_pagamento then
    raise exception 'Somente o financeiro altera a situação do pagamento.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_apresentacao_equipe on public.apresentacoes;
create trigger trg_proteger_apresentacao_equipe
  before update on public.apresentacoes
  for each row execute function public.proteger_apresentacao_equipe();

-- Quem cadastrou cada apresentação (o coreógrafo só vê as dele)
alter table public.apresentacoes add column if not exists criado_por uuid references public.usuarios(id) on delete set null;

-- Elenco e arquivos: grupo, produção e admin (financeiro e marketing só consultam)
create or replace function public.pode_editar_apresentacao(p_apresentacao uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from apresentacoes a
    where a.id = p_apresentacao
      and (eh_super_admin()
           or (eh_gestor() and evento_da_minha_produtora(a.evento_id))
           or (a.grupo_id = get_minha_organizacao_id()
               and (get_meu_role() <> 'org_membro' or a.criado_por = auth.uid())))
  );
$$;

-- O grupo se inscreve sozinho (página do festival); a produção não inscreve grupos
drop policy if exists inscricoes_insert on public.inscricoes_grupo_evento;
create policy inscricoes_insert on public.inscricoes_grupo_evento for insert to authenticated
  with check (eh_super_admin()
              or (grupo_id = get_minha_organizacao_id() and get_meu_role() = 'org_admin'
                  and exists (select 1 from eventos e where e.id = evento_id and inscricoes_abertas(e.status))));
drop policy if exists inscricoes_delete on public.inscricoes_grupo_evento;
create policy inscricoes_delete on public.inscricoes_grupo_evento for delete to authenticated
  using (eh_super_admin() or (eh_financeiro() and evento_da_minha_produtora(evento_id)));

-- ── 3. Grupo: diretor(a) e coreógrafos ──────────────────────────────────────
--   org_admin = diretor(a): vê e faz tudo do grupo.
--   org_membro = coreógrafo(a): vê e edita só as apresentações que cadastrou
--   (com elenco e arquivos delas) e cadastra integrantes no grupo.

create or replace function public.marcar_criador_apresentacao() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.criado_por := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_criador_apresentacao on public.apresentacoes;
create trigger trg_marcar_criador_apresentacao
  before insert on public.apresentacoes
  for each row execute function public.marcar_criador_apresentacao();

-- Apresentação do meu grupo que eu posso ver/alterar
create or replace function public.apresentacao_minha_no_grupo(p_grupo uuid, p_criado_por uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select p_grupo = get_minha_organizacao_id() and (get_meu_role() <> 'org_membro' or p_criado_por = auth.uid());
$$;

drop policy if exists apresentacoes_select on public.apresentacoes;
create policy apresentacoes_select on public.apresentacoes for select to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id))
         or apresentacao_minha_no_grupo(grupo_id, criado_por) or sou_jurado_do_evento(evento_id));
drop policy if exists apresentacoes_update on public.apresentacoes;
create policy apresentacoes_update on public.apresentacoes for update to authenticated
  using (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
         or apresentacao_minha_no_grupo(grupo_id, criado_por))
  with check (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
              or (apresentacao_minha_no_grupo(grupo_id, criado_por) and meu_grupo_inscrito(evento_id)));
drop policy if exists apresentacoes_delete on public.apresentacoes;
create policy apresentacoes_delete on public.apresentacoes for delete to authenticated
  using (eh_super_admin() or pode_gerir_evento(evento_id) or (eh_financeiro() and evento_da_minha_produtora(evento_id))
         or apresentacao_minha_no_grupo(grupo_id, criado_por));

-- Origem de cada pessoa no ARXUM Fest: produtora e grupo por onde chegou
alter table public.participantes add column if not exists origem_grupo_id uuid references public.grupos(id) on delete set null;

-- ── 4. Jurado único no ARXUM Fest ───────────────────────────────────────────
-- Um jurado pode trabalhar para várias produtoras. A produtora convida; se a
-- pessoa já tem conta, o vínculo nasce "pendente" e só vale depois do aceite.
-- usuarios.produtora_id do jurado = produtora por onde ele chegou (origem).
create table if not exists public.produtora_jurados (
  id uuid primary key default gen_random_uuid(),
  produtora_id uuid not null references public.produtoras(id) on delete cascade,
  jurado_id uuid not null references public.usuarios(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado')),
  convidado_por uuid references public.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  unique (produtora_id, jurado_id)
);
alter table public.produtora_jurados enable row level security;

insert into public.produtora_jurados (produtora_id, jurado_id, status, respondido_em)
  select produtora_id, id, 'aceito', now() from public.usuarios
  where role = 'jurado' and produtora_id is not null
on conflict (produtora_id, jurado_id) do nothing;

-- Leitura: equipe da produtora, o próprio jurado e o super admin. Escrita só pelo servidor.
drop policy if exists produtora_jurados_select on public.produtora_jurados;
create policy produtora_jurados_select on public.produtora_jurados for select to authenticated
  using (jurado_id = auth.uid() or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));

create or replace function public.jurado_da_minha_produtora(p_usuario uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select eh_equipe() and exists (
    select 1 from produtora_jurados pj
    where pj.jurado_id = p_usuario and pj.produtora_id = get_minha_produtora_id() and pj.status = 'aceito'
  );
$$;

drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios for select to authenticated
  using (id = auth.uid() or eh_super_admin()
         or (eh_equipe() and produtora_id = get_minha_produtora_id())
         or jurado_da_minha_produtora(id));

-- Só escala no evento quem aceitou trabalhar com a produtora do evento
create or replace function public.conferir_jurado_aceito() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if not exists (
    select 1 from produtora_jurados pj join eventos e on e.produtora_id = pj.produtora_id
    where e.id = new.evento_id and pj.jurado_id = new.jurado_id and pj.status = 'aceito'
  ) then
    raise exception 'Este jurado ainda não aceitou trabalhar com a sua produtora.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_conferir_jurado_aceito on public.evento_jurados;
create trigger trg_conferir_jurado_aceito
  before insert or update of jurado_id, evento_id on public.evento_jurados
  for each row execute function public.conferir_jurado_aceito();

-- ── 5. Super admin: bloqueios, catálogo de planos e registro de ações ──────
alter table public.grupos add column if not exists ativo boolean not null default true;

-- Produtora ou grupo bloqueado: as contas dele deixam de ter acesso
-- (o jurado não é bloqueado pela produtora de origem: ele trabalha para várias)
create or replace function public.get_meu_role() returns text
  language sql stable security definer set search_path = public
as $$
  select u.role from usuarios u
  left join produtoras p on p.id = u.produtora_id
  left join grupos g on g.id = u.organizacao_id
  where u.id = auth.uid() and u.ativo
    and (u.role in ('jurado', 'super_admin') or coalesce(p.ativo, true))
    and coalesce(g.ativo, true);
$$;

-- Página pública some quando a produtora está bloqueada
create or replace function public.evento_publico(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from eventos e join produtoras p on p.id = e.produtora_id
    where e.id = p_evento and e.status is not null and e.status not in ('Em Montagem', 'rascunho') and p.ativo
  );
$$;

-- Catálogo comercial (site /precos): planos e pacotes avulsos.
-- Nos textos, {taxa} {caixa} {isencao} {mesesStart} {mesesGuarda} viram os valores atuais.
create table if not exists public.planos_catalogo (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'plano' check (tipo in ('plano', 'pacote')),
  codigo text check (codigo in ('start', 'pro')),
  nome text not null,
  descricao text,
  preco numeric(10, 2),               -- null = sob consulta; 0 = grátis
  periodo text not null default 'mensal' check (periodo in ('mensal', 'anual', 'unico', 'gratis')),
  detalhe text,                        -- ex.: "por 3 meses"
  itens text[] not null default '{}',
  nota text,
  cta_texto text,
  cta_link text,
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.planos_catalogo enable row level security;
drop policy if exists planos_catalogo_select on public.planos_catalogo;
create policy planos_catalogo_select on public.planos_catalogo for select to anon, authenticated using (ativo or eh_super_admin());
drop policy if exists planos_catalogo_write on public.planos_catalogo;
create policy planos_catalogo_write on public.planos_catalogo for all to authenticated using (eh_super_admin()) with check (eh_super_admin());

insert into public.planos_catalogo (tipo, codigo, nome, descricao, preco, periodo, detalhe, itens, nota, cta_texto, cta_link, destaque, ordem)
select * from (values
  ('plano', 'start', 'Start', 'Para tirar a primeira edição do papel sem custo fixo.', 0::numeric, 'gratis', 'por {mesesStart} meses',
   array['Todos os módulos liberados', 'Eventos, equipe e jurados sem limite', 'Página pública com a sua marca',
         'Caixa no celular: {caixa} em fatura mensal, isento abaixo de {isencao}/mês', 'Taxa de {taxa} por venda feita pelo sistema'],
   'Após {mesesStart} meses, a conta fica em modo leitura por mais {mesesGuarda} meses para você assinar o Pro. Depois disso, os dados são apagados.',
   'Começar grátis', '/criar-conta', false, 1),
  ('plano', 'pro', 'Pro', 'Para festivais que voltam todo ano e precisam do histórico.', null::numeric, 'mensal', 'assinatura mensal',
   array['Tudo do Start, sem prazo', 'Dados e histórico de todas as edições guardados', 'Grupos e participantes reaproveitados a cada ano',
         'Atendimento prioritário', 'Taxa de {taxa} por venda feita pelo sistema'],
   'Sem fidelidade: cancele quando quiser.', 'Falar sobre o Pro', '/contato?assunto=pro', true, 2)
) as v(tipo, codigo, nome, descricao, preco, periodo, detalhe, itens, nota, cta_texto, cta_link, destaque, ordem)
where not exists (select 1 from public.planos_catalogo);

-- O Pro herda a mensalidade já configurada
update public.planos_catalogo pc set preco = (c.valor ->> 'mensalidadePro')::numeric, detalhe = 'por mês'
from public.configuracoes_sistema c
where pc.codigo = 'pro' and pc.preco is null and c.chave = 'precos' and (c.valor ->> 'mensalidadePro') is not null;

-- Plano comercial de cada produtora (o Pro/Start continua controlando o acesso)
alter table public.produtoras add column if not exists plano_catalogo_id uuid references public.planos_catalogo(id) on delete set null;

-- Registro do que o super admin fez (bloqueios, trocas de e-mail, acessos como outro usuário…)
create table if not exists public.registro_super (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid references public.usuarios(id) on delete set null,
  acao text not null,
  alvo_tipo text,
  alvo_id uuid,
  alvo_nome text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);
alter table public.registro_super enable row level security;
drop policy if exists registro_super_select on public.registro_super;
create policy registro_super_select on public.registro_super for select to authenticated using (eh_super_admin());
