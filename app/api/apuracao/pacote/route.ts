import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { equipeDoEvento, getUsuarioAtual } from "@/lib/apuracao/acesso";
import { carregarDadosEvento, carregarFichas } from "@/lib/apuracao/servidor";

// Dados da apuração para o aparelho do produtor (inclui as chaves dos jurados,
// necessárias para abrir os QR codes sem internet). Só gestores do evento.
export async function GET(req: NextRequest) {
  const eventoId = req.nextUrl.searchParams.get("evento") ?? "";
  const usuario = await getUsuarioAtual();
  const admin = createAdminClient();
  if (!(await equipeDoEvento(admin, usuario, eventoId, true))) {
    return NextResponse.json({ error: "Sem permissão para este evento." }, { status: 403 });
  }
  const dados = await carregarDadosEvento(admin, eventoId);
  if (!dados) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const { data: jurados } = await admin
    .from("evento_jurados")
    .select("jurado_id, chave_transferencia, usuarios(nome, email)")
    .eq("evento_id", eventoId);

  return NextResponse.json(
    {
      ...dados,
      jurados: (jurados ?? []).map((j) => {
        const u = (Array.isArray(j.usuarios) ? j.usuarios[0] : j.usuarios) as { nome: string | null; email: string } | null;
        return { id: j.jurado_id as string, nome: u?.nome || u?.email || "Jurado", chave: j.chave_transferencia as string };
      }),
      fichas: await carregarFichas(admin, eventoId),
      baixado_em: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
