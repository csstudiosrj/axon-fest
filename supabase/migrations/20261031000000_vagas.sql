-- ════════════════════════════════════════════════════════════════════════════
-- Vagas: o produtor define o máximo de apresentações
--   • eventos.vagas_total   → máximo de apresentações no evento inteiro;
--   • categorias.vagas      → máximo na categoria (na principal, conta junto
--                             as subcategorias dela).
-- Em branco = sem limite. Inscrições de qualquer situação de pagamento ocupam
-- vaga; para liberar, a produção exclui a apresentação.
-- A trava vale para os grupos; a produção pode encaixar além do limite.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.eventos add column if not exists vagas_total integer;
alter table public.categorias add column if not exists vagas integer;

alter table public.eventos drop constraint if exists eventos_vagas_total_check;
alter table public.eventos add constraint eventos_vagas_total_check check (vagas_total is null or vagas_total > 0);
alter table public.categorias drop constraint if exists categorias_vagas_check;
alter table public.categorias add constraint categorias_vagas_check check (vagas is null or vagas > 0);

-- Ocupação do evento: { "total": n, "categorias": { "<id>": n } }
-- (a categoria principal soma as subcategorias). Só números, sem dados de grupos.
create or replace function public.ocupacao_evento(p_evento uuid) returns jsonb
  language sql stable security definer set search_path = public
as $$
  select case
    when not (evento_publico(p_evento) or eh_super_admin()
              or exists (select 1 from eventos e where e.id = p_evento and eh_equipe() and e.produtora_id = get_minha_produtora_id()))
      then null
    else jsonb_build_object(
      'total', (select count(*) from apresentacoes a where a.evento_id = p_evento),
      'categorias', coalesce((
        select jsonb_object_agg(c.id, (
          select count(*) from apresentacoes a join categorias f on f.id = a.categoria_id
          where a.evento_id = p_evento and (f.id = c.id or f.categoria_pai_id = c.id)))
        from categorias c where c.evento_id = p_evento), '{}'::jsonb))
  end;
$$;

grant execute on function public.ocupacao_evento(uuid) to anon, authenticated;

-- Confere as vagas antes de gravar uma apresentação (chamada pelo gatilho).
-- security definer: o grupo não enxerga as apresentações dos outros grupos.
create or replace function public.checar_vagas(p_evento uuid, p_categoria uuid, p_apresentacao uuid, p_nova boolean) returns void
  language plpgsql security definer set search_path = public
as $$
declare
  v_total integer;
  v_cat record;
begin
  -- uma inscrição por vez por evento, para duas não ocuparem a última vaga juntas
  perform pg_advisory_xact_lock(hashtextextended('vagas:' || p_evento::text, 0));

  if p_nova then
    select vagas_total into v_total from eventos where id = p_evento;
    if v_total is not null and (select count(*) from apresentacoes where evento_id = p_evento and id is distinct from p_apresentacao) >= v_total then
      raise exception 'As vagas deste festival estão esgotadas.' using errcode = '23514';
    end if;
  end if;

  for v_cat in
    select c.id, c.nome, c.vagas from categorias c
    where c.vagas is not null
      and (c.id = p_categoria or c.id = (select categoria_pai_id from categorias where id = p_categoria))
  loop
    if (select count(*) from apresentacoes a join categorias f on f.id = a.categoria_id
        where a.evento_id = p_evento and a.id is distinct from p_apresentacao
          and (f.id = v_cat.id or f.categoria_pai_id = v_cat.id)) >= v_cat.vagas then
      raise exception 'As vagas da categoria "%" estão esgotadas.', v_cat.nome using errcode = '23514';
    end if;
  end loop;
end;
$$;

revoke execute on function public.checar_vagas(uuid, uuid, uuid, boolean) from public, anon;
grant execute on function public.checar_vagas(uuid, uuid, uuid, boolean) to authenticated;

-- Gatilho do grupo (mesma regra de antes + vagas)
create or replace function public.proteger_apresentacao_grupo() returns trigger
  language plpgsql set search_path = public
as $$
declare
  v_evento record;
  v_cat record;
  v_ref public.apresentacoes;
begin
  if not eh_usuario_grupo() then
    return coalesce(new, old);
  end if;

  v_ref := coalesce(new, old);
  select id, status, produtora_id into v_evento from eventos where id = v_ref.evento_id;
  if v_evento.id is null then
    raise exception 'Evento não encontrado.' using errcode = '42501';
  end if;
  if not coalesce(inscricoes_abertas(v_evento.status), false) then
    raise exception 'As inscrições deste evento estão fechadas. Fale com a produção para fazer alterações.' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    if coalesce(old.status_pagamento, 'Pendente') <> 'Pendente' then
      raise exception 'Esta inscrição já foi paga. Fale com a produção para cancelá-la.' using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.evento_id is distinct from old.evento_id or new.grupo_id is distinct from old.grupo_id then
      raise exception 'Não é possível mover a apresentação para outro evento ou grupo.' using errcode = '42501';
    end if;
    -- Campos da produção: mantém o valor atual
    new.produtora_id := old.produtora_id;
    new.status_pagamento := old.status_pagamento;
    new.ordem_apresentacao := old.ordem_apresentacao;
    new.desempate := old.desempate;
    new.local_id := old.local_id;
    new.data_apresentacao := old.data_apresentacao;
    new.status_audio := old.status_audio;
    if coalesce(old.status_pagamento, 'Pendente') <> 'Pendente'
       and (new.categoria_id is distinct from old.categoria_id or new.tipo is distinct from old.tipo) then
      raise exception 'Esta inscrição já foi paga. Fale com a produção para mudar a categoria ou a formação.' using errcode = '42501';
    end if;
  else
    new.produtora_id := v_evento.produtora_id;
    new.status_pagamento := 'Pendente';
    new.ordem_apresentacao := null;
    new.desempate := null;
    new.local_id := null;
    new.data_apresentacao := null;
    new.status_audio := 'Pendente';
  end if;

  -- Categoria do próprio evento, aceitando a formação escolhida
  select * into v_cat from categorias where id = new.categoria_id and evento_id = new.evento_id;
  if v_cat.id is null then
    raise exception 'Escolha uma categoria deste evento.' using errcode = '23514';
  end if;
  if exists (select 1 from categorias c where c.categoria_pai_id = v_cat.id) then
    raise exception 'Escolha uma subcategoria de "%".', v_cat.nome using errcode = '23514';
  end if;
  if (new.tipo = 'solo' and v_cat.permite_solo is false)
     or (new.tipo = 'duo' and v_cat.permite_duo is false)
     or (new.tipo in ('conjunto', 'grupo') and v_cat.permite_conjunto is false) then
    raise exception 'A categoria "%" não aceita esta formação.', v_cat.nome using errcode = '23514';
  end if;

  -- Vagas: na inscrição nova e quando a apresentação muda de categoria
  if tg_op = 'INSERT' or new.categoria_id is distinct from old.categoria_id then
    perform checar_vagas(new.evento_id, new.categoria_id, new.id, tg_op = 'INSERT');
  end if;

  new.categoria_id_old := coalesce(nullif(new.categoria_id_old, ''), new.categoria_id::text);
  new.valor_total := coalesce(case new.tipo
    when 'solo' then v_cat.valor_solo
    when 'duo' then v_cat.valor_duo
    else v_cat.valor_conjunto
  end, 0);
  return new;
end;
$$;

notify pgrst, 'reload schema';
