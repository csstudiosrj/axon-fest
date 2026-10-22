import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { juradoDoEvento } from "@/lib/apuracao/acesso";
import { carregarDadosEvento, carregarFichas } from "@/lib/apuracao/servidor";

// Tudo o que o jurado precisa para avaliar sem internet
export async function GET(req: NextRequest) {
  const eventoId = req.nextUrl.searchParams.get("evento") ?? "";
  const usuario = await getUsuarioAtual();
  const admin = createAdminClient();
  const designacao = await juradoDoEvento(admin, usuario, eventoId);
  if (!designacao) return NextResponse.json({ error: "Você não está designado para este evento." }, { status: 403 });

  const dados = await carregarDadosEvento(admin, eventoId);
  if (!dados) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  const fichas = await carregarFichas(admin, eventoId, usuario!.id);

  return NextResponse.json(
    {
      evento: { id: dados.evento.id, nome: dados.evento.nome, data_inicio: dados.evento.data_inicio, data_fim: dados.evento.data_fim, local: dados.evento.local },
      criterios: dados.criterios,
      apresentacoes: dados.apresentacoes.map((a) => ({
        id: a.id, nome: a.nome, tipo: a.tipo, grupo: a.grupo, categoria: a.categoria, categoria_id: a.categoria_id,
        ordem_apresentacao: a.ordem_apresentacao, data_apresentacao: a.data_apresentacao, local: a.local,
      })),
      jurado_id: usuario!.id,
      chave: designacao.chave_transferencia,
      fichas,
      baixado_em: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
