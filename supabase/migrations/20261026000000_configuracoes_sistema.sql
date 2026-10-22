-- ════════════════════════════════════════════════════════════════════════════
-- Configurações do SaaS editáveis pelo super admin (valores, taxas, prazos,
-- contatos e dados da empresa). O site e os documentos legais leem daqui.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.configuracoes_sistema (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.usuarios(id) on delete set null
);

alter table public.configuracoes_sistema enable row level security;

drop policy if exists configuracoes_select on public.configuracoes_sistema;
create policy configuracoes_select on public.configuracoes_sistema for select to anon, authenticated
  using (true);
drop policy if exists configuracoes_write on public.configuracoes_sistema;
create policy configuracoes_write on public.configuracoes_sistema for all to authenticated
  using (eh_super_admin()) with check (eh_super_admin());

-- Valores iniciais (editáveis depois no painel do super admin)
insert into public.configuracoes_sistema (chave, valor) values
  ('precos', jsonb_build_object(
    'taxaPercentual', 2,          -- % por venda online (inscrição, ingresso, loja)
    'taxaFixa', 0.99,             -- R$ por venda online
    'caixaPercentual', 2,         -- % sobre vendas do caixa do evento, em fatura mensal
    'caixaIsencaoAte', 500,       -- isento se o caixa vender menos que isso no mês (R$)
    'mesesStart', 3,
    'mesesGuarda', 3,
    'mensalidadePro', null        -- null = "Sob consulta"
  )),
  ('contato', jsonb_build_object(
    'email', 'fest@arxum.com.br',
    'whatsapp', '(21) 96711-9815'
  )),
  ('empresa', jsonb_build_object(
    'razaoSocial', '',
    'cnpj', '',
    'endereco', '',
    'foro', 'Rio de Janeiro/RJ',
    'emailPrivacidade', 'privacidade@arxum.com.br',
    'vigencia', ''
  ))
on conflict (chave) do nothing;

-- Produtora de demonstração (criada/apagada pelo super admin para testes)
alter table public.produtoras add column if not exists demonstracao boolean not null default false;
