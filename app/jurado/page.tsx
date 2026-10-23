import { getUsuarioAtual } from "@/lib/auth/session";
import { AppJurado } from "./_app/AppJurado";
import { ConvitesJurado } from "./_app/ConvitesJurado";

export default async function PaginaJurado() {
  const usuario = await getUsuarioAtual();
  return (
    <>
      <ConvitesJurado />
      <AppJurado nomeJurado={usuario?.nome || usuario?.email || "Jurado"} />
    </>
  );
}
