import { carregarContextoGrupo, carregarElenco, situacaoEvento } from "@/lib/grupo/contexto";
import { carregarApresentacoes, carregarCategorias } from "@/lib/grupo/dados";
import { Apresentacoes } from "./Apresentacoes";

export const dynamic = "force-dynamic";

export default async function PaginaApresentacoes({ params, searchParams }: {
  params: Promise<{ evento_id: string }>;
  searchParams: Promise<{ nova?: string }>;
}) {
  const [{ evento_id }, { nova }] = await Promise.all([params, searchParams]);
  const { evento, perfil, grupo, usuario, diretor } = await carregarContextoGrupo(evento_id);
  const [categorias, apresentacoes, elenco] = await Promise.all([
    carregarCategorias(evento.id),
    carregarApresentacoes(evento.id, grupo.id),
    carregarElenco(grupo.id, usuario.id),
  ]);
  const situacao = situacaoEvento(evento.status);

  return (
    <Apresentacoes
      evento={{ id: evento.id, data_inicio: evento.data_inicio }}
      grupoId={grupo.id}
      perfilSlug={perfil.slug}
      categorias={categorias}
      apresentacoes={apresentacoes}
      elenco={elenco}
      podeEditar={situacao.podeEditar}
      podeEnviarArquivos={situacao.podeEnviarArquivos}
      abrirNova={nova === "1" && situacao.podeEditar}
      verValores={diretor}
    />
  );
}
