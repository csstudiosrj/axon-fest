import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { equipeDoEvento, getUsuarioAtual } from "@/lib/apuracao/acesso";
import { carregarDadosEvento, carregarFichas } from "@/lib/apuracao/servidor";
import { classificar, type MetodoApuracao } from "@/lib/apuracao/calculo";
import { perfilPorSlug } from "@/lib/perfis";

// Publica (ou retira) o resultado: grava o retrato da classificação atual
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { evento_id?: string; publicar?: boolean };
  const eventoId = body.evento_id ?? "";
  const usuario = await getUsuarioAtual();
  const admin = createAdminClient();
  if (!(await equipeDoEvento(admin, usuario, eventoId))) {
    return NextResponse.json({ error: "Sem permissão para este evento." }, { status: 403 });
  }

  await admin.from("resultados_publicados").delete().eq("evento_id", eventoId);

  if (!body.publicar) {
    await admin.from("eventos").update({ resultado_publicado_em: null }).eq("id", eventoId);
    return NextResponse.json({ success: true, publicado: false });
  }

  const dados = await carregarDadosEvento(admin, eventoId);
  if (!dados) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  const fichas = await carregarFichas(admin, eventoId);
  const grupos = classificar(
    dados.apresentacoes,
    fichas.map((f) => ({ apresentacao_id: f.a, avaliador_id: f.j, finalizada: !!f.f, notas: f.notas })),
    dados.criterios.map((c) => ({ id: c.id, nome: c.nome, peso: c.peso, ordem: c.ordem })),
    dados.evento.metodo_apuracao as MetodoApuracao,
    perfilPorSlug(dados.perfil).formacoes
  );

  const empates = grupos.flatMap((g) => g.linhas.filter((l) => l.empatada).map((l) => `${g.titulo}: ${l.apresentacao.nome}`));
  if (empates.length) {
    return NextResponse.json({ error: "Há empates sem desempate definido.", empates }, { status: 409 });
  }

  const linhas = grupos.flatMap((g, gi) =>
    g.linhas.filter((l) => l.nota !== null).map((l) => ({
      evento_id: eventoId,
      grupo_titulo: g.titulo,
      ordem_grupo: gi,
      posicao: l.posicao,
      apresentacao_id: l.apresentacao.id,
      apresentacao_nome: l.apresentacao.nome,
      grupo_nome: l.apresentacao.grupo,
      nota: l.nota,
    }))
  );
  if (linhas.length) {
    const { error } = await admin.from("resultados_publicados").insert(linhas);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await admin.from("eventos").update({ resultado_publicado_em: new Date().toISOString() }).eq("id", eventoId);
  return NextResponse.json({ success: true, publicado: true, total: linhas.length });
}
