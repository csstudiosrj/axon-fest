import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { apagarDemonstracao, criarDemonstracao } from "@/lib/demo/demonstracao";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (usuario?.role !== "super_admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const { acao } = (await req.json().catch(() => ({}))) as { acao?: string };
  const admin = createAdminClient();
  try {
    if (acao === "criar") return NextResponse.json({ success: true, ...(await criarDemonstracao(admin)) });
    if (acao === "apagar") return NextResponse.json({ success: true, ...(await apagarDemonstracao(admin)) });
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    console.error("[api/super/demonstracao]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha na demonstração." }, { status: 500 });
  }
}
