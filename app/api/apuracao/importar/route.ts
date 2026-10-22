import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { equipeDoEvento, getUsuarioAtual } from "@/lib/apuracao/acesso";
import { aplicarFichas, carregarDadosEvento } from "@/lib/apuracao/servidor";
import { descriptografarPacote } from "@/lib/offline/transferencia";

// Recebe pacotes lidos por QR no aparelho do produtor. O servidor abre o pacote
// com a chave do jurado: só notas realmente geradas no aparelho dele são aceitas.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { evento_id?: string; jurado_id?: string; dados?: string };
  const { evento_id = "", jurado_id = "", dados = "" } = body;
  const usuario = await getUsuarioAtual();
  const admin = createAdminClient();
  if (!(await equipeDoEvento(admin, usuario, evento_id, true))) {
    return NextResponse.json({ error: "Sem permissão para este evento." }, { status: 403 });
  }

  const { data: designacao } = await admin.from("evento_jurados").select("chave_transferencia")
    .eq("evento_id", evento_id).eq("jurado_id", jurado_id).maybeSingle();
  if (!designacao) return NextResponse.json({ error: "Jurado não designado para este evento." }, { status: 404 });

  let pacote;
  try {
    pacote = await descriptografarPacote(dados, designacao.chave_transferencia as string, evento_id, jurado_id);
  } catch {
    return NextResponse.json({ error: "Pacote inválido ou adulterado." }, { status: 400 });
  }

  const dadosEvento = await carregarDadosEvento(admin, evento_id);
  if (!dadosEvento) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const fichas = pacote.fichas.map((f) => ({
    a: f.a,
    notas: Object.fromEntries(pacote.k.map((cid, i) => [cid, f.n[i] ?? null])),
    c: f.c ?? null,
    f: f.f,
    u: f.u,
  }));
  const resultados = await aplicarFichas(admin, dadosEvento, jurado_id, fichas, "qr");
  return NextResponse.json({ resultados });
}
