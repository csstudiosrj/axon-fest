import { getUsuarioAtual } from "@/lib/auth/session";
import { AppJurado } from "./_app/AppJurado";

export default async function PaginaJurado() {
  const usuario = await getUsuarioAtual();
  return <AppJurado nomeJurado={usuario?.nome || usuario?.email || "Jurado"} />;
}
