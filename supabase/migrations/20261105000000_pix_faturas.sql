-- Pix gerado no próprio painel (QR Code e copia e cola) para pagar as faturas do ARXUM.
-- Rodar no SQL Editor do Supabase ANTES do merge. Pode rodar mais de uma vez.
alter table public.faturas add column if not exists mp_pix_id text;
alter table public.faturas add column if not exists mp_pix_copia text;
alter table public.faturas add column if not exists mp_pix_qr text;
alter table public.faturas add column if not exists mp_pix_expira timestamptz;
