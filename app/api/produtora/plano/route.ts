import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";
import { resumoPlano } from "@/lib/planos-servidor";
import type { PlanoProdutora } from "@/lib/planos";

// Plano da produtora de quem está logado + taxa do caixa no mês
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || !ROLES_PAINEL_ADMIN.includes(usuario.role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!usuario.produtora_id) return NextResponse.json({ semProdutora: true });

  const admin = createAdminClient();
  const { data } = await admin.from("produtoras").select("id, plano, plano_inicio, pro_ate").eq("id", usuario.produtora_id).maybeSingle();
  if (!data) return NextResponse.json({ semProdutora: true });
  return NextResponse.json(await resumoPlano(admin, data as PlanoProdutora & { id: string }));
}
