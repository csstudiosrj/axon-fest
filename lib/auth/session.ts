import "server-only";
import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface UsuarioAtual {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  produtora_id: string | null;
  organizacao_id: string | null;
  setor_pdv: string | null;
}

// Usuário autenticado + dados da tabela usuarios.
// getUser() valida o JWT no servidor do Supabase (getSession() só lê o cookie).
// Retorna null se não houver sessão válida, cadastro ou se a conta estiver inativa.
export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("usuarios")
    .select("id, email, nome, role, produtora_id, organizacao_id, setor_pdv, ativo, produtoras:produtora_id ( ativo ), grupos:organizacao_id ( ativo )")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || data.ativo === false) return null;
  // Produtora ou grupo bloqueado pelo super admin (o jurado trabalha para várias produtoras)
  const um = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  if (!["jurado", "super_admin"].includes(data.role) && um(data.produtoras)?.ativo === false) return null;
  if (um(data.grupos)?.ativo === false) return null;

  return {
    id: data.id,
    email: data.email ?? user.email ?? "",
    nome: data.nome ?? null,
    role: data.role,
    produtora_id: data.produtora_id ?? null,
    organizacao_id: data.organizacao_id ?? null,
    setor_pdv: data.setor_pdv ?? null,
  };
});
