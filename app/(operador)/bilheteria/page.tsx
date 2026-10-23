import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/session";
import { setoresPdv } from "@/lib/auth/permissoes";
import { Pdv } from "../_components/Pdv";

export const dynamic = "force-dynamic";

// O operador só abre o setor dele; a gestão (admin, financeiro) alterna entre os dois
export default async function Pagina() {
  const usuario = await getUsuarioAtual();
  const setores = setoresPdv(usuario?.role, usuario?.setor_pdv);
  if (!setores.includes("bilheteria")) redirect("/caixa");
  return <Pdv modo="bilheteria" gestao={setores.length > 1} />;
}
