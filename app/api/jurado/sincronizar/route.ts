import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { juradoDoEvento } from "@/lib/apuracao/acesso";
import { aplicarFichas, carregarDadosEvento, carregarFichas, type FichaEntrada } from "@/lib/apuracao/servidor";

// Envia as fichas do aparelho do jurado e devolve o estado do servidor
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { evento_id?: string; fichas?: FichaEntrada[] };
  const usuario = await getUsuarioAtual();
  const admin = createAdminClient();
  if (!(await juradoDoEvento(admin, usuario, body.evento_id ?? ""))) {
    return NextResponse.json({ error: "Você não está designado para este evento." }, { status: 403 });
  }
  const dados = await carregarDadosEvento(admin, body.evento_id!);
  if (!dados) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const resultados = await aplicarFichas(admin, dados, usuario!.id, Array.isArray(body.fichas) ? body.fichas : [], "online");
  const fichas = await carregarFichas(admin, dados.evento.id, usuario!.id);
  return NextResponse.json({ resultados, fichas });
}
