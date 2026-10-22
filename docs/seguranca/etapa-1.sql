-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 1 — Segurança. Rodar no Supabase → SQL Editor.
-- Parte A é só leitura (diagnóstico). Parte B cria a proteção da tabela usuarios.
-- ════════════════════════════════════════════════════════════════════════════

-- ── PARTE A — Diagnóstico (copie o resultado e me envie) ────────────────────

-- A1. Tabelas do schema public com RLS ligado/desligado
select c.relname as tabela, c.relrowsecurity as rls_ligado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 2, 1;

-- A2. Políticas existentes nas tabelas sensíveis
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('usuarios', 'pdv_config', 'pdv_vendas', 'grupos', 'grupo_participante',
                    'participantes', 'inscricoes_grupo_evento', 'tenant_config', 'organizacoes')
order by tablename, policyname;

-- A3. Contas com cargos fora da lista oficial (para migrar ou descartar)
select role, count(*) from public.usuarios
where role not in ('super_admin','admin','produtor','marketing','assistente',
                   'operador','jurado','org_admin','org_membro')
group by role;

-- A4. Quantos super_admin existem (deve ser só você)
select id, email, produtora_id from public.usuarios where role = 'super_admin';


-- ── PARTE B — Proteção da tabela usuarios ───────────────────────────────────
-- O navegador (roles anon/authenticated) não pode mais:
--   • inserir linhas em usuarios (o cadastro agora é feito pelas rotas do servidor);
--   • alterar role, produtora_id, organizacao_id ou ativo.
-- Rotas do servidor usam service_role e o SQL Editor usa postgres: não são afetados.
-- Edição de nome, telefone, foto e mini bio continua funcionando.

create or replace function public.proteger_colunas_usuarios()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Cadastro de usuários só pelo servidor.' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
       new.role           is distinct from old.role
    or new.produtora_id   is distinct from old.produtora_id
    or new.organizacao_id is distinct from old.organizacao_id
    or new.ativo          is distinct from old.ativo
    or new.id             is distinct from old.id
  ) then
    raise exception 'Alteração de cargo/vínculo só pelo servidor.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_colunas_usuarios on public.usuarios;
create trigger trg_proteger_colunas_usuarios
  before insert or update on public.usuarios
  for each row execute function public.proteger_colunas_usuarios();

-- Teste rápido (deve falhar com "Alteração de cargo/vínculo só pelo servidor."):
--   set local role authenticated;
--   update public.usuarios set role = 'super_admin' where id = '<algum id>';
--   reset role;
