-- Revisão de lançamento: participantes e vínculos com grupos só são gravados pelo
-- servidor (que aplica pessoa única por CPF/e-mail, confirmação por e-mail e termo).
-- O acesso direto pelo navegador fica só para leitura (e para o super admin).
-- Rodar no SQL Editor do Supabase ANTES do merge. Pode rodar mais de uma vez.

drop policy if exists participantes_insert on public.participantes;
create policy participantes_insert on public.participantes for insert to authenticated with check (eh_super_admin());
drop policy if exists participantes_update on public.participantes;
create policy participantes_update on public.participantes for update to authenticated using (eh_super_admin()) with check (eh_super_admin());
drop policy if exists participantes_delete on public.participantes;
create policy participantes_delete on public.participantes for delete to authenticated using (eh_super_admin());

drop policy if exists grupo_participante_insert on public.grupo_participante;
create policy grupo_participante_insert on public.grupo_participante for insert to authenticated with check (eh_super_admin());
drop policy if exists grupo_participante_update on public.grupo_participante;
create policy grupo_participante_update on public.grupo_participante for update to authenticated using (eh_super_admin()) with check (eh_super_admin());
drop policy if exists grupo_participante_delete on public.grupo_participante;
create policy grupo_participante_delete on public.grupo_participante for delete to authenticated using (eh_super_admin());
