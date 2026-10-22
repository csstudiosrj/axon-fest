import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import type { TablesUpdate } from "@/lib/supabase/database.types";

// Super admin muda o plano de uma produtora (até a cobrança automática existir)
export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (usuario?.role !== "super_admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; acao?: string; ate?: string | null };
  if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) return NextResponse.json({ error: "Produtora inválida." }, { status: 400 });

  let dados: TablesUpdate<"produtoras">;
  if (body.acao === "pro") {
    const ate = body.ate ? new Date(`${body.ate}T23:59:59-03:00`) : null;
    if (ate && (Number.isNaN(ate.getTime()) || ate < new Date())) return NextResponse.json({ error: "Data de validade inválida." }, { status: 400 });
    dados = { plano: "pro", pro_ate: ate?.toISOString() ?? null };
  } else if (body.acao === "start") {
    dados = { plano: "start", pro_ate: null };
  } else if (body.acao === "reiniciar_start") {
    dados = { plano: "start", pro_ate: null, plano_inicio: new Date().toISOString() };
  } else {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("produtoras").update(dados).eq("id", body.id);
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  return NextResponse.json({ success: true });
}
