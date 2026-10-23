import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { pode } from "@/lib/auth/permissoes";

type Admin = ReturnType<typeof createAdminClient>;

// Jurado designado para o evento → devolve a chave de transferência
export async function juradoDoEvento(admin: Admin, usuario: UsuarioAtual | null, eventoId: string) {
  if (!usuario || usuario.role !== "jurado" || !eventoId) return null;
  const { data } = await admin.from("evento_jurados").select("id, chave_transferencia")
    .eq("evento_id", eventoId).eq("jurado_id", usuario.id).maybeSingle();
  return data as { id: string; chave_transferencia: string } | null;
}

// Produção da produtora dona do evento (admin e produção) ou super admin.
// Mídias e apuração são telas da produção (lib/auth/permissoes.ts).
export async function equipeDoEvento(admin: Admin, usuario: UsuarioAtual | null, eventoId: string) {
  if (!usuario || !eventoId) return false;
  if (usuario.role === "super_admin") return true;
  if (!pode(usuario.role, "midias") || !usuario.produtora_id) return false;
  const { data } = await admin.from("eventos").select("produtora_id").eq("id", eventoId).maybeSingle();
  return !!data && data.produtora_id === usuario.produtora_id;
}

export { getUsuarioAtual };
