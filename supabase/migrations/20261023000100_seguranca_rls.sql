-- ════════════════════════════════════════════════════════════════════════════
-- SEGURANÇA (RLS) — liga a proteção por linha em TODAS as tabelas e substitui
-- as políticas antigas (que estavam desligadas, duplicadas e com cargos velhos).
--
-- Regra geral:
--   • anon (sem login) só lê o que é público: eventos publicados e o que eles
--     exibem (locais, categorias, termos, loja), perfis/estilos, config visual.
--   • equipe da produtora (admin, produtor, marketing, assistente) vê e mexe
--     só nos dados da própria produtora; escrita de configuração = gestores.
--   • grupo (org_admin/org_membro) vê só o próprio grupo, seus participantes,
--     inscrições e apresentações.
--   • jurado vê os eventos para os quais foi designado e grava as próprias notas.
--   • operador usa o PDV da própria produtora.
--   • super_admin vê tudo.
--   • Rotas do servidor usam service_role, que ignora RLS (validação no código).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Funções auxiliares (security definer: leem usuarios sem cair em RLS) ──

create or replace function public.get_meu_role() returns text
  language sql stable security definer set search_path = public
as $$ select role from usuarios where id = auth.uid() and ativo; $$;

create or replace function public.get_minha_produtora_id() returns uuid
  language sql stable security definer set search_path = public
as $$ select produtora_id from usuarios where id = auth.uid() and ativo; $$;

create or replace function public.get_minha_organizacao_id() returns uuid
  language sql stable security definer set search_path = public
as $$
  select organizacao_id from usuarios
  where id = auth.uid() and ativo and role in ('org_admin', 'org_membro', 'escola_admin', 'coreografo');
$$;

create or replace function public.eh_super_admin() returns boolean
  language sql stable security definer set search_path = public
as $$ select coalesce(get_meu_role() = 'super_admin', false); $$;

-- Equipe da produtora (painel admin)
create or replace function public.eh_equipe() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('admin', 'produtor', 'marketing', 'assistente',
                                     'produtora_admin', 'produtora_staff', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- Quem pode alterar configuração de eventos, PDV e da produtora
create or replace function public.eh_gestor() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('admin', 'produtor', 'produtora_admin', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

create or replace function public.eh_operador() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(get_meu_role() in ('operador', 'admin', 'produtor', 'produtora_admin', 'super_admin'), false)
     and get_minha_produtora_id() is not null;
$$;

-- Evento visível ao público (fora de rascunho)
create or replace function public.evento_publico(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from eventos
    where id = p_evento and status is not null and status not in ('Em Montagem', 'rascunho')
  );
$$;

create or replace function public.evento_da_minha_produtora(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from eventos
    where id = p_evento and produtora_id = get_minha_produtora_id()
  ) and eh_equipe();
$$;

create or replace function public.pode_gerir_evento(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$ select eh_super_admin() or (eh_gestor() and evento_da_minha_produtora(p_evento)); $$;

create or replace function public.sou_jurado_do_evento(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (select 1 from evento_jurados where evento_id = p_evento and jurado_id = auth.uid())
     and get_meu_role() = 'jurado';
$$;

create or replace function public.meu_grupo_inscrito(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from inscricoes_grupo_evento
    where evento_id = p_evento and grupo_id = get_minha_organizacao_id()
  );
$$;

create or replace function public.pode_ver_evento(p_evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select evento_publico(p_evento)
      or eh_super_admin()
      or evento_da_minha_produtora(p_evento)
      or sou_jurado_do_evento(p_evento)
      or meu_grupo_inscrito(p_evento);
$$;

-- Grupo que a equipe da produtora pode ver: inscrito em evento dela ou criado por ela
create or replace function public.grupo_da_minha_produtora(p_grupo uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select eh_equipe() and (
    exists (
      select 1 from grupos g
      where g.id = p_grupo
        and get_minha_produtora_id() in (g.produtora_id, g.origem_produtora_id)
    )
    or exists (
      select 1 from inscricoes_grupo_evento i
      join eventos e on e.id = i.evento_id
      where i.grupo_id = p_grupo and e.produtora_id = get_minha_produtora_id()
    )
  );
$$;

create or replace function public.pode_ver_grupo(p_grupo uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select p_grupo = get_minha_organizacao_id() or eh_super_admin() or grupo_da_minha_produtora(p_grupo);
$$;

create or replace function public.pode_ver_participante(p_participante uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select eh_super_admin()
    or exists (select 1 from participantes p where p.id = p_participante
               and (p.criado_por = auth.uid()
                    or (eh_equipe() and get_minha_produtora_id() in (p.produtora_id, p.origem_produtora_id))))
    or exists (select 1 from grupo_participante gp where gp.participante_id = p_participante
               and pode_ver_grupo(gp.grupo_id));
$$;

create or replace function public.pode_editar_apresentacao(p_apresentacao uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from apresentacoes a
    where a.id = p_apresentacao
      and (eh_super_admin()
           or (eh_equipe() and evento_da_minha_produtora(a.evento_id))
           or a.grupo_id = get_minha_organizacao_id())
  );
$$;

-- Busca pública de grupo por CPF/CNPJ na inscrição: devolve só o necessário
-- (antes a tabela grupos inteira ficava legível sem login).
create or replace function public.grupo_por_documento(p_documento text)
  returns table (id uuid, nome text, email_mascarado text)
  language sql stable security definer set search_path = public
as $$
  select g.id, g.nome,
         regexp_replace(g.email, '^(.)[^@]*(@.*)$', '\1***\2') as email_mascarado
  from grupos g
  where g.documento = regexp_replace(coalesce(p_documento, ''), '\D', '', 'g')
    and length(regexp_replace(coalesce(p_documento, ''), '\D', '', 'g')) in (11, 14)
  limit 1;
$$;

revoke all on function public.grupo_por_documento(text) from public;
grant execute on function public.grupo_por_documento(text) to anon, authenticated;

-- Jurados exibidos na página pública do evento (sem cachê, e-mail ou telefone)
create or replace view public.jurados_publicos as
  select ej.evento_id, u.id as jurado_id, u.nome, u.foto_url,
         coalesce(ej.especialidade, u.especialidade) as especialidade, u.mini_bio
  from evento_jurados ej
  join usuarios u on u.id = ej.jurado_id
  join eventos e on e.id = ej.evento_id
  where e.status is not null and e.status not in ('Em Montagem', 'rascunho');

grant select on public.jurados_publicos to anon, authenticated;

-- ── 2. Remove todas as políticas antigas do schema public ───────────────────

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ── 3. Liga RLS em todas as tabelas ─────────────────────────────────────────

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- ── 4. Políticas ────────────────────────────────────────────────────────────

-- produtoras
create policy produtoras_select on public.produtoras for select to authenticated
  using (eh_super_admin() or id = get_minha_produtora_id());
create policy produtoras_update on public.produtoras for update to authenticated
  using (eh_super_admin() or (id = get_minha_produtora_id() and get_meu_role() in ('admin', 'produtora_admin')));
create policy produtoras_insert on public.produtoras for insert to authenticated
  with check (eh_super_admin());
create policy produtoras_delete on public.produtoras for delete to authenticated
  using (eh_super_admin());

-- usuarios (cadastro, cargo e vínculo só pelo servidor — ver gatilho proteger_colunas_usuarios)
create policy usuarios_select on public.usuarios for select to authenticated
  using (id = auth.uid() or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy usuarios_update on public.usuarios for update to authenticated
  using (id = auth.uid() or eh_super_admin()
         or (get_meu_role() in ('admin', 'produtora_admin') and produtora_id = get_minha_produtora_id()));

-- eventos
-- (checagens "inline" além da função: o INSERT ... RETURNING precisa enxergar a linha nova)
create policy eventos_select on public.eventos for select to anon, authenticated
  using ((eh_equipe() and produtora_id = get_minha_produtora_id()) or pode_ver_evento(id));
create policy eventos_insert on public.eventos for insert to authenticated
  with check (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));
create policy eventos_update on public.eventos for update to authenticated
  using (pode_gerir_evento(id))
  with check (eh_super_admin() or produtora_id = get_minha_produtora_id());
create policy eventos_delete on public.eventos for delete to authenticated
  using (pode_gerir_evento(id));

-- tabelas filhas do evento: leitura acompanha o evento, escrita é dos gestores
do $$
declare t text;
begin
  foreach t in array array['categorias', 'locais_evento', 'criterios_avaliacao'] loop
    execute format('create policy %1$s_select on public.%1$s for select to anon, authenticated using (pode_ver_evento(evento_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (pode_gerir_evento(evento_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (pode_gerir_evento(evento_id)) with check (pode_gerir_evento(evento_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (pode_gerir_evento(evento_id))', t);
  end loop;
end $$;

-- evento_jurados (o público usa a view jurados_publicos)
create policy evento_jurados_select on public.evento_jurados for select to authenticated
  using (jurado_id = auth.uid() or eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy evento_jurados_insert on public.evento_jurados for insert to authenticated
  with check (pode_gerir_evento(evento_id));
create policy evento_jurados_update on public.evento_jurados for update to authenticated
  using (pode_gerir_evento(evento_id)) with check (pode_gerir_evento(evento_id));
create policy evento_jurados_delete on public.evento_jurados for delete to authenticated
  using (pode_gerir_evento(evento_id));

-- inscrições de grupos em eventos
create policy inscricoes_select on public.inscricoes_grupo_evento for select to authenticated
  using (grupo_id = get_minha_organizacao_id() or eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy inscricoes_insert on public.inscricoes_grupo_evento for insert to authenticated
  with check ((grupo_id = get_minha_organizacao_id() and evento_publico(evento_id))
              or eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy inscricoes_update on public.inscricoes_grupo_evento for update to authenticated
  using (eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy inscricoes_delete on public.inscricoes_grupo_evento for delete to authenticated
  using (eh_super_admin() or evento_da_minha_produtora(evento_id));

-- grupos (criação pelo servidor: /api/grupo/cadastro)
create policy grupos_select on public.grupos for select to authenticated
  using (pode_ver_grupo(id));
create policy grupos_update on public.grupos for update to authenticated
  using (eh_super_admin() or (id = get_minha_organizacao_id() and get_meu_role() in ('org_admin', 'escola_admin')));
create policy grupos_delete on public.grupos for delete to authenticated
  using (eh_super_admin());

-- vínculos participante ↔ grupo
create policy grupo_participante_select on public.grupo_participante for select to authenticated
  using (pode_ver_grupo(grupo_id));
create policy grupo_participante_insert on public.grupo_participante for insert to authenticated
  with check (pode_ver_grupo(grupo_id));
create policy grupo_participante_update on public.grupo_participante for update to authenticated
  using (pode_ver_grupo(grupo_id)) with check (pode_ver_grupo(grupo_id));
create policy grupo_participante_delete on public.grupo_participante for delete to authenticated
  using (pode_ver_grupo(grupo_id));

create policy participacoes_select on public.participacoes_participante_grupo_evento for select to authenticated
  using (pode_ver_grupo(grupo_id) or evento_da_minha_produtora(evento_id));
create policy participacoes_insert on public.participacoes_participante_grupo_evento for insert to authenticated
  with check (pode_ver_grupo(grupo_id));
create policy participacoes_update on public.participacoes_participante_grupo_evento for update to authenticated
  using (pode_ver_grupo(grupo_id) or evento_da_minha_produtora(evento_id));
create policy participacoes_delete on public.participacoes_participante_grupo_evento for delete to authenticated
  using (pode_ver_grupo(grupo_id));

-- participantes (dados pessoais: nunca públicos)
create policy participantes_select on public.participantes for select to authenticated
  using (criado_por = auth.uid()
         or (eh_equipe() and get_minha_produtora_id() in (produtora_id, origem_produtora_id))
         or pode_ver_participante(id));
create policy participantes_insert on public.participantes for insert to authenticated
  with check ((eh_equipe() or get_minha_organizacao_id() is not null or eh_super_admin())
              and coalesce(criado_por, auth.uid()) = auth.uid());
create policy participantes_update on public.participantes for update to authenticated
  using (criado_por = auth.uid() or pode_ver_participante(id));
create policy participantes_delete on public.participantes for delete to authenticated
  using (eh_super_admin() or criado_por = auth.uid());

create policy participantes_bloqueados_all on public.participantes_bloqueados for all to authenticated
  using (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));

-- apresentações e elenco
create policy apresentacoes_select on public.apresentacoes for select to authenticated
  using (eh_super_admin()
         or (eh_equipe() and evento_da_minha_produtora(evento_id))
         or grupo_id = get_minha_organizacao_id()
         or sou_jurado_do_evento(evento_id));
create policy apresentacoes_insert on public.apresentacoes for insert to authenticated
  with check (eh_super_admin()
              or (eh_equipe() and evento_da_minha_produtora(evento_id))
              or (grupo_id = get_minha_organizacao_id() and meu_grupo_inscrito(evento_id)));
create policy apresentacoes_update on public.apresentacoes for update to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id))
         or grupo_id = get_minha_organizacao_id())
  with check (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id))
              or (grupo_id = get_minha_organizacao_id() and meu_grupo_inscrito(evento_id)));
create policy apresentacoes_delete on public.apresentacoes for delete to authenticated
  using (eh_super_admin() or (eh_equipe() and evento_da_minha_produtora(evento_id))
         or grupo_id = get_minha_organizacao_id());

create policy apresentacao_elenco_select on public.apresentacao_elenco for select to authenticated
  using (pode_editar_apresentacao(apresentacao_id)
         or exists (select 1 from apresentacoes a where a.id = apresentacao_id and sou_jurado_do_evento(a.evento_id)));
create policy apresentacao_elenco_write on public.apresentacao_elenco for all to authenticated
  using (pode_editar_apresentacao(apresentacao_id)) with check (pode_editar_apresentacao(apresentacao_id));

-- avaliações: jurado grava só as próprias notas, em evento para o qual foi designado
create policy avaliacoes_select on public.avaliacoes for select to authenticated
  using (avaliador_id = auth.uid() or eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy avaliacoes_insert on public.avaliacoes for insert to authenticated
  with check ((avaliador_id = auth.uid() and sou_jurado_do_evento(evento_id)) or pode_gerir_evento(evento_id));
create policy avaliacoes_update on public.avaliacoes for update to authenticated
  using ((avaliador_id = auth.uid() and sou_jurado_do_evento(evento_id)) or pode_gerir_evento(evento_id));
create policy avaliacoes_delete on public.avaliacoes for delete to authenticated
  using (pode_gerir_evento(evento_id));

-- PDV
create policy pdv_config_select on public.pdv_config for select to authenticated
  using (eh_super_admin() or ((eh_equipe() or eh_operador()) and produtora_id = get_minha_produtora_id()));
create policy pdv_config_write on public.pdv_config for all to authenticated
  using (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));

create policy pdv_produtos_select on public.pdv_produtos for select to anon, authenticated
  using (eh_super_admin()
         or ((eh_equipe() or eh_operador()) and produtora_id = get_minha_produtora_id())
         or (ativo and exists (select 1 from evento_produtos ep
                               where ep.produto_id = pdv_produtos.id and ep.ativo_evento
                                 and evento_publico(ep.evento_id))));
create policy pdv_produtos_write on public.pdv_produtos for all to authenticated
  using (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));

create policy evento_produtos_select on public.evento_produtos for select to anon, authenticated
  using ((ativo_evento and evento_publico(evento_id)) or eh_super_admin() or evento_da_minha_produtora(evento_id));
create policy evento_produtos_write on public.evento_produtos for all to authenticated
  using (pode_gerir_evento(evento_id)) with check (pode_gerir_evento(evento_id));

create policy pdv_vendas_select on public.pdv_vendas for select to authenticated
  using (eh_super_admin() or ((eh_equipe() or eh_operador()) and produtora_id = get_minha_produtora_id()));
create policy pdv_vendas_insert on public.pdv_vendas for insert to authenticated
  with check ((eh_equipe() or eh_operador()) and produtora_id = get_minha_produtora_id());
create policy pdv_vendas_update on public.pdv_vendas for update to authenticated
  using ((eh_equipe() or eh_operador()) and produtora_id = get_minha_produtora_id());
create policy pdv_vendas_delete on public.pdv_vendas for delete to authenticated
  using (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));

-- Loja (produtos vendidos aos grupos)
create policy produtos_select on public.produtos for select to anon, authenticated
  using ((ativo and exibir_loja_publica) or eh_super_admin()
         or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy produtos_write on public.produtos for all to authenticated
  using (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));

create policy produto_variacoes_select on public.produto_variacoes for select to anon, authenticated
  using (true);
create policy produto_variacoes_write on public.produto_variacoes for all to authenticated
  using (eh_super_admin() or exists (select 1 from produtos p where p.id = produto_id
                                     and eh_equipe() and p.produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or exists (select 1 from produtos p where p.id = produto_id
                                          and eh_equipe() and p.produtora_id = get_minha_produtora_id()));

create policy pedido_itens_select on public.pedido_itens for select to authenticated
  using (escola_id = get_minha_organizacao_id() or eh_super_admin()
         or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy pedido_itens_insert on public.pedido_itens for insert to authenticated
  with check (escola_id = get_minha_organizacao_id()
              or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy pedido_itens_update on public.pedido_itens for update to authenticated
  using ((escola_id = get_minha_organizacao_id() and status = 'pendente')
         or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy pedido_itens_delete on public.pedido_itens for delete to authenticated
  using ((escola_id = get_minha_organizacao_id() and status = 'pendente')
         or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));

-- Catálogos do sistema: leitura livre, escrita só do super admin
create policy perfis_festival_select on public.perfis_festival for select to anon, authenticated using (true);
create policy perfis_festival_write on public.perfis_festival for all to authenticated
  using (eh_super_admin()) with check (eh_super_admin());
create policy estilos_select on public.estilos for select to anon, authenticated using (true);
create policy estilos_write on public.estilos for all to authenticated
  using (eh_super_admin()) with check (eh_super_admin());

-- Configuração da produtora (nomes, cores, termos de exibição): leitura livre
create policy tenant_config_select on public.tenant_config for select to anon, authenticated using (true);
create policy tenant_config_write on public.tenant_config for all to authenticated
  using (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));
create policy tenant_estilos_select on public.tenant_estilos_ativos for select to anon, authenticated using (true);
create policy tenant_estilos_write on public.tenant_estilos_ativos for all to authenticated
  using (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_gestor() and produtora_id = get_minha_produtora_id()));

-- Termos e contratos
create policy termos_documentos_select on public.termos_documentos for select to anon, authenticated
  using ((ativo and (exibir_publico or (evento_id is not null and evento_publico(evento_id))))
         or eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));
create policy termos_documentos_write on public.termos_documentos for all to authenticated
  using (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));

create policy termos_aceites_select on public.termos_aceites for select to authenticated
  using (usuario_id = auth.uid() or eh_super_admin()
         or exists (select 1 from termos_documentos d where d.id = documento_id
                    and eh_equipe() and d.produtora_id = get_minha_produtora_id()));
create policy termos_aceites_insert on public.termos_aceites for insert to authenticated
  with check (usuario_id = auth.uid());

-- Marketing
create policy posts_marketing_all on public.posts_marketing for all to authenticated
  using (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()))
  with check (eh_super_admin() or (eh_equipe() and produtora_id = get_minha_produtora_id()));
