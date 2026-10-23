import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { registrar } from "@/lib/super/registro";

// Super admin muda o plano de uma produtora (até a cobrança automática existir)
export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (usuario?.role !== "super_admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; acao?: string; ate?: string | null; plano_catalogo_id?: string | null };
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
  } else if (body.acao === "plano_catalogo") {
    dados = { plano_catalogo_id: body.plano_catalogo_id || null };
  } else {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: p, error } = await admin.from("produtoras").update(dados).eq("id", body.id).select("nome").single();
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  await registrar(admin, usuario.id, "Alterou plano da produtora", { tipo: "produtora", id: body.id, nome: p?.nome }, { acao: body.acao, ate: body.ate ?? null, plano_catalogo_id: body.plano_catalogo_id ?? null });
  return NextResponse.json({ success: true });
}
