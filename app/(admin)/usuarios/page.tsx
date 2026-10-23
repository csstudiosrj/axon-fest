import { exigirAcesso } from "@/lib/auth/guards";
import { HIERARQUIA } from "@/lib/auth/roles";
import { carregarEquipe } from "@/lib/equipe";
import { Equipe } from "./Equipe";

export const dynamic = "force-dynamic";

export default async function PaginaUsuarios() {
  const usuario = await exigirAcesso("equipe");
  if (!usuario.produtora_id) {
    return <p className="mx-auto max-w-3xl text-sm text-gray-400">A equipe é gerenciada por produtora. Sua conta não está ligada a uma produtora; use o Super Admin.</p>;
  }
  const membros = await carregarEquipe(usuario.produtora_id, ["admin", "produtor", "financeiro", "marketing", "assistente", "operador", "produtora_admin", "produtora_staff"]);
  const atribuiveis = (HIERARQUIA[usuario.role] ?? []).filter((r) => ["produtor", "financeiro", "marketing", "operador"].includes(r));
  return <Equipe membros={membros} euId={usuario.id} atribuiveis={[...atribuiveis]} podeGerir={atribuiveis.length > 0} />;
}
