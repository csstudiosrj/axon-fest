-- Apaga TODOS os eventos e o que depende deles (categorias, apresentações,
-- inscrições, notas, jurados do evento, produtos do evento...).
-- Use só enquanto o sistema não tem clientes reais.

-- 1) Conferir antes o que será apagado:
select id, nome, status, created_at from public.eventos order by created_at;

-- 2) Apagar (rode este bloco depois de conferir):
begin;
delete from public.avaliacoes where evento_id is not null;   -- notas não apagam em cascata
delete from public.eventos;
commit;
