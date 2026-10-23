import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

type Admin = ReturnType<typeof createAdminClient>;

// Registro das ações do super admin (aparece em Super Admin → Registro de ações)
export async function registrar(admin: Admin, atorId: string, acao: string, alvo: { tipo: string; id?: string | null; nome?: string | null }, detalhes?: Record<string, unknown>) {
  await admin.from("registro_super").insert({
    ator_id: atorId, acao, alvo_tipo: alvo.tipo, alvo_id: alvo.id ?? null, alvo_nome: alvo.nome ?? null, detalhes: (detalhes ?? null) as Json,
  });
}
