import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";

// Convites de produtoras para o jurado logado: listar pendentes e responder

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.role !== "jurado") return NextResponse.json({ convites: [] });
  const admin = createAdminClient();
  const { data } = await admin.from("produtora_jurados").select("id, criado_em, produtoras ( nome )")
    .eq("jurado_id", usuario.id).eq("status", "pendente").order("criado_em");
  return NextResponse.json({
    convites: (data ?? []).map((c) => ({ id: c.id, produtora: (Array.isArray(c.produtoras) ? c.produtoras[0] : c.produtoras)?.nome ?? "Produtora", desde: c.criado_em })),
  });
}

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.role !== "jurado") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; aceitar?: boolean };
  const admin = createAdminClient();
  const { data, error } = await admin.from("produtora_jurados")
    .update({ status: body.aceitar ? "aceito" : "recusado", respondido_em: new Date().toISOString() })
    .eq("id", body.id ?? "").eq("jurado_id", usuario.id).eq("status", "pendente").select("id");
  if (error || !data?.length) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
