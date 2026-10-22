-- ════════════════════════════════════════════════════════════════════════════
-- ETAPA 5b — Caixa e bilheteria (PDV)
--
-- • O PIN do PDV deixa de ser legível pelo navegador (operador ou painel):
--   só o servidor o confere (/api/operador/pin). O painel apenas grava.
-- • Cada venda ganha um identificador do atendimento (venda_id), que agrupa
--   os itens de um mesmo cupom.
-- • As vendas do caixa entram pelo servidor (/api/operador/vendas).
-- ════════════════════════════════════════════════════════════════════════════

revoke select on public.pdv_config from anon, authenticated;
grant select (id, produtora_id, pix_chave, pix_nome, pix_cidade, criado_em, atualizado_em)
  on public.pdv_config to authenticated;

alter table public.pdv_vendas add column if not exists venda_id uuid;
create index if not exists idx_pdv_vendas_venda on public.pdv_vendas (venda_id);
create index if not exists idx_pdv_vendas_evento on public.pdv_vendas (evento_id, created_at desc);

-- Tipos aceitos no catálogo do PDV (a demonstração antiga usava "loja")
update public.pdv_produtos set tipo = 'cantina' where tipo not in ('cantina', 'bilheteria');
alter table public.pdv_produtos drop constraint if exists pdv_produtos_tipo_check;
alter table public.pdv_produtos add constraint pdv_produtos_tipo_check check (tipo in ('cantina', 'bilheteria'));
