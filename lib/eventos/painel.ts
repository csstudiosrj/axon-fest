import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, type UsuarioAtual } from "@/lib/auth/session";
import { perfilPorSlug, type Perfil } from "@/lib/perfis";
import type { Tables } from "@/lib/supabase/database.types";

// Evento visto pela equipe da produtora (abas de /eventos/[id]).
// Eventos públicos de outras produtoras também são legíveis pelo RLS:
// por isso conferimos o dono aqui.

export type EventoPainel = Tables<"eventos">;

export interface ContextoEvento {
  usuario: UsuarioAtual;
  evento: EventoPainel;
  perfil: Perfil;
  podeGerir: boolean; // admin/produtor: altera configuração; demais cargos só consultam
}

const GESTORES = ["admin", "produtor", "produtora_admin", "super_admin"];
const UUID = /^[0-9a-f-]{36}$/i;

export async function carregarEvento(id: string): Promise<ContextoEvento> {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("eventos").select("*, perfis_festival:perfil_id ( slug )").eq("id", id).maybeSingle();
  if (!data) notFound();
  if (usuario.role !== "super_admin" && data.produtora_id !== usuario.produtora_id) notFound();
  const { perfis_festival, ...evento } = data;
  const pf = perfis_festival as { slug?: string } | { slug?: string }[] | null;
  return {
    usuario,
    evento: evento as EventoPainel,
    perfil: perfilPorSlug(Array.isArray(pf) ? pf[0]?.slug : pf?.slug),
    podeGerir: GESTORES.includes(usuario.role),
  };
}
