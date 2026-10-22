-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 5 — Status do evento unificados (lista em lib/eventos/status.ts)
--
-- • "Inscrições prorrogadas" passa a contar como inscrições abertas para os
--   grupos (antes o grupo ficava travado como se estivessem fechadas).
-- • Evento cancelado também trava o envio de arquivos.
-- • Novos valores fora da lista são recusados (os antigos ficam como estão).
-- ════════════════════════════════════════════════════════════════════════════

update public.eventos set status = 'Em Montagem' where status is null or status = 'rascunho';

alter table public.eventos drop constraint if exists eventos_status_check;
alter table public.eventos add constraint eventos_status_check check (status in (
  'Em Montagem', 'inscricoes_abertas', 'inscricoes_prorrogadas', 'inscricoes_encerradas',
  'em_andamento', 'adiado', 'finalizado', 'cancelado'
)) not valid;

create or replace function public.inscricoes_abertas(p_status text) returns boolean
  language sql immutable
as $$ select p_status in ('inscricoes_abertas', 'inscricoes_prorrogadas'); $$;

-- Grupo só se inscreve em evento com inscrições abertas (antes: qualquer evento público)
drop policy if exists inscricoes_insert on public.inscricoes_grupo_evento;
create policy inscricoes_insert on public.inscricoes_grupo_evento for insert to authenticated
  with check ((grupo_id = get_minha_organizacao_id()
               and exists (select 1 from eventos e where e.id = evento_id and inscricoes_abertas(e.status)))
              or eh_super_admin() or evento_da_minha_produtora(evento_id));

-- Travas do portal do grupo usam a mesma regra

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

  new.categoria_id_old := coalesce(nullif(new.categoria_id_old, ''), new.categoria_id::text);
  new.valor_total := coalesce(case new.tipo
    when 'solo' then v_cat.valor_solo
    when 'duo' then v_cat.valor_duo
    else v_cat.valor_conjunto
  end, 0);
  return new;
end;
$$;

create or replace function public.proteger_elenco_grupo() returns trigger
  language plpgsql set search_path = public
as $$
declare
  v_ap record;
  v_ref public.apresentacao_elenco;
begin
  if not eh_usuario_grupo() then
    return coalesce(new, old);
  end if;

  v_ref := coalesce(new, old);
  select a.grupo_id, e.status into v_ap
  from apresentacoes a join eventos e on e.id = a.evento_id
  where a.id = v_ref.apresentacao_id;

  if not coalesce(inscricoes_abertas(v_ap.status), false) then
    raise exception 'As inscrições deste evento estão fechadas. Fale com a produção para alterar o elenco.' using errcode = '42501';
  end if;
  if tg_op <> 'DELETE' and not exists (
    select 1 from grupo_participante gp
    where gp.grupo_id = v_ap.grupo_id and gp.participante_id = new.participante_id
      and coalesce(gp.status, 'ativo') = 'ativo'
  ) then
    raise exception 'Só integrantes do grupo podem entrar no elenco.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.proteger_status_arquivo() returns trigger
  language plpgsql set search_path = public
as $$
declare
  v_status text;
  v_apresentacao uuid;
begin
  if current_user in ('anon', 'authenticated') and not eh_equipe() then
    if tg_op = 'DELETE' then v_apresentacao := old.apresentacao_id; else v_apresentacao := new.apresentacao_id; end if;
    select e.status into v_status
    from apresentacoes a join eventos e on e.id = a.evento_id
    where a.id = v_apresentacao;
    if v_status in ('finalizado', 'cancelado') then
      raise exception 'O evento foi finalizado ou cancelado: os arquivos não podem mais ser alterados.' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
      return old;
    elsif tg_op = 'INSERT' then
      new.status := 'recebido';
      new.observacao := null;
    elsif new.url is distinct from old.url then
      new.status := 'recebido';
      new.observacao := null;
    elsif new.status is distinct from old.status or new.observacao is distinct from old.observacao then
      raise exception 'Somente a produção altera o status do arquivo.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Todo evento precisa de endereço público (/e/<slug>); os antigos sem slug ganham um
update public.eventos set slug = 'evento-' || left(id::text, 8) where slug is null or trim(slug) = '';
