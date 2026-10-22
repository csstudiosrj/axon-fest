-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 4c — Portal do grupo
--
-- O grupo (org_admin/org_membro) grava direto no banco pelas telas do portal.
-- As políticas de RLS dizem QUAIS linhas ele pode mexer; estes gatilhos dizem
-- O QUÊ ele pode mexer:
--   • apresentações: só com inscrições abertas; valor, pagamento, ordem,
--     local, data e desempate são da produção (valor sai da categoria);
--   • elenco da apresentação: só integrantes do próprio grupo;
--   • arquivos técnicos: até o evento ser finalizado;
--   • vínculo grupo ↔ participante: o grupo não confirma sozinho (quem
--     confirma é a pessoa, pelo link do e-mail);
--   • participante: o grupo não marca termo como assinado nem altera um
--     cadastro já assinado.
-- A equipe da produtora e o super admin não passam por estas travas.
-- Rotas do servidor (service_role) também não.
-- ════════════════════════════════════════════════════════════════════════════

-- Quem está no portal do grupo (e não na equipe de uma produtora)
-- (sem security definer: current_user precisa ser o papel de quem chamou)
create or replace function public.eh_usuario_grupo() returns boolean
  language sql stable set search_path = public
as $$
  select current_user in ('anon', 'authenticated') and not eh_equipe() and not eh_super_admin();
$$;

-- ── Apresentações ───────────────────────────────────────────────────────────

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
  if v_evento.status is distinct from 'inscricoes_abertas' then
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

drop trigger if exists trg_proteger_apresentacao_grupo on public.apresentacoes;
create trigger trg_proteger_apresentacao_grupo
  before insert or update or delete on public.apresentacoes
  for each row execute function public.proteger_apresentacao_grupo();

-- ── Elenco de cada apresentação ─────────────────────────────────────────────

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

  if v_ap.status is distinct from 'inscricoes_abertas' then
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

drop trigger if exists trg_proteger_elenco_grupo on public.apresentacao_elenco;
create trigger trg_proteger_elenco_grupo
  before insert or update or delete on public.apresentacao_elenco
  for each row execute function public.proteger_elenco_grupo();

-- ── Arquivos técnicos: grupo envia até o evento ser finalizado ──────────────

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
    if v_status = 'finalizado' then
      raise exception 'O evento já foi finalizado: os arquivos não podem mais ser alterados.' using errcode = '42501';
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

drop trigger if exists trg_proteger_status_arquivo on public.apresentacao_arquivos;
create trigger trg_proteger_status_arquivo
  before insert or update or delete on public.apresentacao_arquivos
  for each row execute function public.proteger_status_arquivo();

-- ── Vínculo grupo ↔ participante ────────────────────────────────────────────

create or replace function public.proteger_vinculo_grupo() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if not eh_usuario_grupo() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.confirmado := false;
    new.status := 'ativo';
    new.token_confirmacao := gen_random_uuid()::text;
  else
    new.grupo_id := old.grupo_id;
    new.participante_id := old.participante_id;
    new.confirmado := old.confirmado;
    new.token_confirmacao := old.token_confirmacao;
    new.status := old.status;
    new.bloqueado_por_produtora := old.bloqueado_por_produtora;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_vinculo_grupo on public.grupo_participante;
create trigger trg_proteger_vinculo_grupo
  before insert or update on public.grupo_participante
  for each row execute function public.proteger_vinculo_grupo();

-- ── Participantes: assinatura e cadastro assinado são intocáveis ───────────

create or replace function public.proteger_participante_grupo() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if not eh_usuario_grupo() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.termo_assinado := false;
    new.termo_assinado_em := null;
    new.termo_assinado_ip := null;
    new.termo_assinado_user_agent := null;
    new.responsavel_nome := null;
    new.responsavel_cpf := null;
    new.responsavel_parentesco := null;
    return new;
  end if;
  if old.termo_assinado then
    raise exception 'Este cadastro já tem termo assinado e não pode ser alterado pelo grupo.' using errcode = '42501';
  end if;
  new.termo_assinado := old.termo_assinado;
  new.termo_assinado_em := old.termo_assinado_em;
  new.termo_assinado_ip := old.termo_assinado_ip;
  new.termo_assinado_user_agent := old.termo_assinado_user_agent;
  new.responsavel_nome := old.responsavel_nome;
  new.responsavel_cpf := old.responsavel_cpf;
  new.responsavel_parentesco := old.responsavel_parentesco;
  new.produtora_id := old.produtora_id;
  new.origem_produtora_id := old.origem_produtora_id;
  new.criado_por := old.criado_por;
  new.documento := old.documento;
  return new;
end;
$$;

drop trigger if exists trg_proteger_participante_grupo on public.participantes;
create trigger trg_proteger_participante_grupo
  before insert or update on public.participantes
  for each row execute function public.proteger_participante_grupo();

-- ── Privacidade: o grupo só vê dados de quem confirmou o vínculo ───────────
-- (antes, digitar o CPF de alguém já cadastrado revelava nome, nascimento e
-- e-mail da pessoa). Quem cadastrou continua vendo; a equipe da produtora não muda.
create or replace function public.pode_ver_participante(p_participante uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select eh_super_admin()
    or exists (select 1 from participantes p where p.id = p_participante
               and (p.criado_por = auth.uid()
                    or (eh_equipe() and get_minha_produtora_id() in (p.produtora_id, p.origem_produtora_id))))
    or exists (select 1 from grupo_participante gp where gp.participante_id = p_participante
               and pode_ver_grupo(gp.grupo_id)
               and (gp.confirmado or get_minha_organizacao_id() is null));
$$;

-- ── Resultado do próprio grupo ──────────────────────────────────────────────
-- Classificação publicada é pública; a nota de cada jurado nunca é exposta.
-- Os comentários continuam na view comentarios_jurados_grupo.

-- ── Dados do grupo: o responsável edita contato e endereço, não a identidade ─

create or replace function public.proteger_grupo() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if eh_usuario_grupo() then
    new.documento := old.documento;
    new.tipo_documento := old.tipo_documento;
    new.email := old.email;
    new.produtora_id := old.produtora_id;
    new.origem_produtora_id := old.origem_produtora_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_grupo on public.grupos;
create trigger trg_proteger_grupo
  before update on public.grupos
  for each row execute function public.proteger_grupo();
