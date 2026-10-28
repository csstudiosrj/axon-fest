-- Faturas do ARXUM para as produtoras (cobradas pelo Mercado Pago).
-- Mensal: mensalidade do plano + ingressos + caixa sem evento do mês anterior.
-- Por evento: inscrições pagas + caixa do evento, no dia seguinte ao fim do festival.
-- Rodar inteiro no SQL Editor do Supabase ANTES do merge. Pode rodar mais de uma vez.

create table if not exists public.faturas (
  id uuid primary key default gen_random_uuid(),
  produtora_id uuid not null references public.produtoras(id) on delete cascade,
  tipo text not null check (tipo in ('mensal', 'evento')),
  referencia text not null,                -- 'AAAA-MM' (mensal) ou id do evento
  evento_id uuid references public.eventos(id) on delete set null,
  descricao text not null,
  periodo_inicio date,
  periodo_fim date,
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  status text not null default 'aberta' check (status in ('aberta', 'paga', 'cancelada')),
  vencimento date not null,
  criada_em timestamptz not null default now(),
  paga_em timestamptz,
  forma_pagamento text,
  mp_preferencia_id text,
  mp_link text,
  mp_pagamento_id text,
  aviso_atraso_em timestamptz,
  observacao text,
  unique (produtora_id, tipo, referencia)
);
create index if not exists faturas_status_idx on public.faturas (status, vencimento);

create table if not exists public.fatura_itens (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid not null references public.faturas(id) on delete cascade,
  descricao text not null,
  quantidade integer not null default 1,
  base numeric(12, 2),                     -- valor sobre o qual a taxa foi calculada
  valor numeric(12, 2) not null
);
create index if not exists fatura_itens_fatura_idx on public.fatura_itens (fatura_id);

-- Bloqueio por falta de pagamento: tira o acesso ao painel (página pública, caixa,
-- jurados e grupos seguem funcionando) até quitar
alter table public.produtoras add column if not exists bloqueio_financeiro boolean not null default false;

-- Leitura: admin e financeiro da própria produtora, e o super admin. Gravação só pelo servidor.
alter table public.faturas enable row level security;
alter table public.fatura_itens enable row level security;
drop policy if exists faturas_select on public.faturas;
create policy faturas_select on public.faturas for select to authenticated
  using (eh_super_admin() or (produtora_id = get_minha_produtora_id() and get_meu_role() in ('admin', 'financeiro', 'produtora_admin', 'assistente')));
drop policy if exists fatura_itens_select on public.fatura_itens;
create policy fatura_itens_select on public.fatura_itens for select to authenticated
  using (exists (select 1 from public.faturas f where f.id = fatura_id
    and (eh_super_admin() or (f.produtora_id = get_minha_produtora_id() and get_meu_role() in ('admin', 'financeiro', 'produtora_admin', 'assistente')))));

-- Início da cobrança: nada antes desta data entra em fatura (não cobra retroativo)
insert into public.configuracoes_sistema (chave, valor)
select 'faturamento', jsonb_build_object('inicio', to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'), 'diasVencimento', 5, 'diasBloqueio', 3)
where not exists (select 1 from public.configuracoes_sistema where chave = 'faturamento');

-- Liberação manual pelo super admin: a rotina não bloqueia de novo até esta data
alter table public.produtoras add column if not exists liberado_ate date;

-- Cobrança de teste do super admin (confere o Mercado Pago de ponta a ponta, sem produtora)
alter table public.faturas alter column produtora_id drop not null;
alter table public.faturas drop constraint if exists faturas_tipo_check;
alter table public.faturas add constraint faturas_tipo_check check (tipo in ('mensal', 'evento', 'teste'));
