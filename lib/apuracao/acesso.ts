import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";

type Admin = ReturnType<typeof createAdminClient>;

// Jurado designado para o evento → devolve a chave de transferência
export async function juradoDoEvento(admin: Admin, usuario: UsuarioAtual | null, eventoId: string) {
  if (!usuario || usuario.role !== "jurado" || !eventoId) return null;
  const { data } = await admin.from("evento_jurados").select("id, chave_transferencia")
    .eq("evento_id", eventoId).eq("jurado_id", usuario.id).maybeSingle();
  return data as { id: string; chave_transferencia: string } | null;
}

// Equipe da produtora dona do evento (ou super admin)
export async function equipeDoEvento(admin: Admin, usuario: UsuarioAtual | null, eventoId: string, gestor = false) {
  if (!usuario || !eventoId) return false;
  if (usuario.role === "super_admin") return true;
  const roles = gestor ? ["admin", "produtor", "produtora_admin"] : ROLES_PAINEL_ADMIN;
  if (!roles.includes(usuario.role) || !usuario.produtora_id) return false;
  const { data } = await admin.from("eventos").select("produtora_id").eq("id", eventoId).maybeSingle();
  return !!data && data.produtora_id === usuario.produtora_id;
}

export { getUsuarioAtual };
