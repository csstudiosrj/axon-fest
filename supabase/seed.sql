-- Catálogo do sistema (tipos de festival e estilos). Usado ao recriar o banco
-- do zero (supabase db reset). Em produção esses dados já existem.
insert into public.perfis_festival (slug, nome, ordem) values
  ('danca', 'Dança', 1),
  ('teatro', 'Teatro', 2),
  ('musica', 'Música', 3),
  ('talentos_estudantil', 'Talentos Estudantil', 4),
  ('circo', 'Circo & Artes Físicas', 5),
  ('multidisciplinar', 'Multidisciplinar', 6)
on conflict (slug) do nothing;

insert into public.estilos (perfil_id, nome, slug, ordem)
select p.id, e.nome, e.slug, e.ordem
from (values
  ('danca', 'Jazz', 'jazz', 1), ('danca', 'Ballet Clássico', 'ballet-classico', 2), ('danca', 'Dança Contemporânea', 'danca-contemporanea', 3),
  ('danca', 'Hip Hop', 'hip-hop', 4), ('danca', 'Sapateado', 'sapateado', 5), ('danca', 'Dança Livre', 'danca-livre', 6),
  ('musica', 'Canto Solo', 'canto-solo', 1), ('musica', 'Banda', 'banda', 2), ('musica', 'Coral', 'coral', 3), ('musica', 'Instrumento', 'instrumento', 4),
  ('teatro', 'Comédia', 'comedia', 1), ('teatro', 'Drama', 'drama', 2), ('teatro', 'Musical', 'musical', 3), ('teatro', 'Monólogo', 'monologo', 4),
  ('circo', 'Acrobacia de Solo', 'acrobacia-solo', 1), ('circo', 'Acrobacia Aérea', 'acrobacia-aerea', 2), ('circo', 'Malabarismo', 'malabarismo', 3),
  ('talentos_estudantil', 'Dança', 'danca', 1), ('talentos_estudantil', 'Música / Canto', 'musica-canto', 2), ('talentos_estudantil', 'Teatro', 'teatro', 3),
  ('multidisciplinar', 'Dança + Música', 'danca-musica', 1), ('multidisciplinar', 'Performance Total', 'performance-total', 2)
) as e(perfil, nome, slug, ordem)
join public.perfis_festival p on p.slug = e.perfil
on conflict (perfil_id, slug) do nothing;
