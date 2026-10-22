import { carregarContextoGrupo, carregarElenco } from "@/lib/grupo/contexto";
import { Elenco } from "./Elenco";

export const dynamic = "force-dynamic";

export default async function PaginaElenco({ params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const { evento, perfil, grupo, usuario } = await carregarContextoGrupo(evento_id);
  const elenco = await carregarElenco(grupo.id, usuario.id);
  return <Elenco eventoId={evento.id} perfilSlug={perfil.slug} integrantes={elenco} dataEvento={evento.data_inicio} />;
}
