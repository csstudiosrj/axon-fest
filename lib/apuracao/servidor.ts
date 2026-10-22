import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

type Admin = ReturnType<typeof createAdminClient>;

// Ficha recebida do aparelho (sincronização online ou QR importado)
export interface FichaEntrada {
  a: string;                                  // apresentacao_id
  notas: Record<string, number | null>;       // por criterio_id
  c?: string | null;                          // comentário
  f?: string | null;                          // finalizada em (ISO) ou null
  u: string;                                  // atualizada em (ISO)
}

export type ResultadoFicha = { a: string; status: "ok" | "ignorada" | "invalida"; motivo?: string };

export interface DadosEvento {
  evento: { id: string; nome: string; produtora_id: string | null; metodo_apuracao: string; data_inicio: string | null; data_fim: string | null; local: string | null; liberar_comentarios: boolean; resultado_publicado_em: string | null };
  criterios: { id: string; nome: string; nota_min: number; nota_max: number; peso: number; ordem: number | null }[];
  apresentacoes: {
    id: string; nome: string; tipo: string; grupo: string; categoria_id: string | null; categoria: string;
    competitiva: boolean; ordem_apresentacao: number | null; data_apresentacao: string | null; local: string | null; desempate: number | null;
  }[];
}

export async function carregarDadosEvento(admin: Admin, eventoId: string): Promise<DadosEvento | null> {
  const { data: evento } = await admin
    .from("eventos")
    .select("id, nome, produtora_id, metodo_apuracao, data_inicio, data_fim, local, liberar_comentarios, resultado_publicado_em")
    .eq("id", eventoId)
    .maybeSingle();
  if (!evento) return null;

  const [{ data: criterios }, { data: apresentacoes }, { data: categorias }, { data: locais }] = await Promise.all([
    admin.from("criterios_avaliacao").select("id, nome, nota_min, nota_max, peso, ordem").eq("evento_id", eventoId).order("ordem", { nullsFirst: false }).order("nome"),
    admin.from("apresentacoes")
      .select("id, nome, tipo, grupo_id, categoria_id, ordem_apresentacao, data_apresentacao, local_id, desempate, grupos(nome)")
      .eq("evento_id", eventoId)
      .order("data_apresentacao", { nullsFirst: false })
      .order("ordem_apresentacao", { nullsFirst: false })
      .order("nome"),
    admin.from("categorias").select("id, nome, categoria_pai_id, competitiva").eq("evento_id", eventoId),
    admin.from("locais_evento").select("id, nome_local").eq("evento_id", eventoId),
  ]);

  const cats = new Map((categorias ?? []).map((c) => [c.id as string, c]));
  const rotulo = (id: string | null) => {
    const c = id ? cats.get(id) : undefined;
    if (!c) return "Sem categoria";
    const pai = c.categoria_pai_id ? cats.get(c.categoria_pai_id as string) : undefined;
    return pai ? `${pai.nome} › ${c.nome}` : (c.nome as string);
  };
  const nomeLocal = new Map((locais ?? []).map((l) => [l.id as string, l.nome_local as string]));

  return {
    evento: evento as DadosEvento["evento"],
    criterios: (criterios ?? []).map((c) => ({ ...c, nota_min: Number(c.nota_min), nota_max: Number(c.nota_max), peso: Number(c.peso) })) as DadosEvento["criterios"],
    apresentacoes: (apresentacoes ?? []).map((a) => {
      const g = a.grupos as unknown as { nome: string } | { nome: string }[] | null;
      const grupoNome = Array.isArray(g) ? g[0]?.nome : g?.nome;
      const cat = a.categoria_id ? cats.get(a.categoria_id as string) : undefined;
      return {
        id: a.id as string,
        nome: a.nome as string,
        tipo: a.tipo as string,
        grupo: grupoNome ?? "—",
        categoria_id: (a.categoria_id as string) ?? null,
        categoria: rotulo(a.categoria_id as string | null),
        competitiva: cat ? cat.competitiva !== false : true,
        ordem_apresentacao: a.ordem_apresentacao as number | null,
        data_apresentacao: a.data_apresentacao as string | null,
        local: a.local_id ? nomeLocal.get(a.local_id as string) ?? null : null,
        desempate: a.desempate as number | null,
      };
    }),
  };
}

// Fichas + notas existentes no servidor (de um jurado ou de todos)
export async function carregarFichas(admin: Admin, eventoId: string, juradoId?: string) {
  let qf = admin.from("avaliacoes_fichas").select("apresentacao_id, avaliador_id, comentario, finalizada_em, atualizado_em, origem").eq("evento_id", eventoId);
  let qn = admin.from("avaliacoes").select("apresentacao_id, avaliador_id, criterio_id, nota").eq("evento_id", eventoId);
  if (juradoId) { qf = qf.eq("avaliador_id", juradoId); qn = qn.eq("avaliador_id", juradoId); }
  const [{ data: fichas }, { data: notas }] = await Promise.all([qf, qn]);
  const chave = (a: string, j: string) => `${a}:${j}`;
  const mapaNotas = new Map<string, Record<string, number>>();
  for (const n of notas ?? []) {
    const k = chave(n.apresentacao_id as string, n.avaliador_id as string);
    const m = mapaNotas.get(k) ?? {};
    m[n.criterio_id as string] = Number(n.nota);
    mapaNotas.set(k, m);
  }
  return (fichas ?? []).map((f) => ({
    a: f.apresentacao_id as string,
    j: f.avaliador_id as string,
    notas: mapaNotas.get(chave(f.apresentacao_id as string, f.avaliador_id as string)) ?? {},
    c: (f.comentario as string | null) ?? null,
    f: (f.finalizada_em as string | null) ?? null,
    u: f.atualizado_em as string,
    origem: f.origem as string,
  }));
}

// Grava fichas de UM jurado. Regras:
//  • ficha finalizada no servidor não muda (a produção reabre, se preciso);
//  • entre versões abertas, vale a mais recente (atualizado_em).
export async function aplicarFichas(
  admin: Admin,
  dados: DadosEvento,
  juradoId: string,
  fichas: FichaEntrada[],
  origem: "online" | "qr"
): Promise<ResultadoFicha[]> {
  const apresentacoes = new Set(dados.apresentacoes.map((a) => a.id));
  const criterios = new Map(dados.criterios.map((c) => [c.id, c]));
  const existentes = new Map((await carregarFichas(admin, dados.evento.id, juradoId)).map((f) => [f.a, f]));
  const resultados: ResultadoFicha[] = [];

  for (const f of fichas.slice(0, 1000)) {
    if (!apresentacoes.has(f.a)) { resultados.push({ a: f.a, status: "invalida", motivo: "apresentação fora do evento" }); continue; }
    const u = new Date(f.u);
    if (Number.isNaN(u.getTime()) || u.getTime() > Date.now() + 5 * 60_000) {
      resultados.push({ a: f.a, status: "invalida", motivo: "data inválida" }); continue;
    }
    const atual = existentes.get(f.a);
    // Ficha finalizada no servidor é imutável: só muda depois que a produção reabre
    if (atual?.f) { resultados.push({ a: f.a, status: "ignorada", motivo: "ficha finalizada (só a produção pode reabrir)" }); continue; }
    if (atual && new Date(atual.u).getTime() >= u.getTime()) { resultados.push({ a: f.a, status: "ignorada", motivo: "servidor já tem versão igual ou mais nova" }); continue; }

    const notas: { criterio_id: string; nota: number }[] = [];
    let valida = true;
    for (const [cid, valor] of Object.entries(f.notas ?? {})) {
      const c = criterios.get(cid);
      if (!c) { valida = false; break; }
      if (valor === null || valor === undefined) continue;
      if (typeof valor !== "number" || !Number.isFinite(valor) || valor < c.nota_min || valor > c.nota_max) { valida = false; break; }
      notas.push({ criterio_id: cid, nota: Math.round(valor * 100) / 100 });
    }
    const finalizada = f.f ? new Date(f.f) : null;
    if (finalizada && notas.length < dados.criterios.length) valida = false;
    if (!valida) { resultados.push({ a: f.a, status: "invalida", motivo: "notas fora da escala ou incompletas" }); continue; }

    const { error: erroFicha } = await admin.from("avaliacoes_fichas").upsert({
      evento_id: dados.evento.id,
      apresentacao_id: f.a,
      avaliador_id: juradoId,
      comentario: (f.c ?? "").slice(0, 4000) || null,
      finalizada_em: finalizada && !Number.isNaN(finalizada.getTime()) ? finalizada.toISOString() : null,
      origem,
      atualizado_em: u.toISOString(),
    }, { onConflict: "evento_id,apresentacao_id,avaliador_id" });
    if (erroFicha) { resultados.push({ a: f.a, status: "invalida", motivo: erroFicha.message }); continue; }

    // Substitui as notas da ficha pelas recebidas
    await admin.from("avaliacoes").delete().eq("evento_id", dados.evento.id).eq("apresentacao_id", f.a).eq("avaliador_id", juradoId);
    if (notas.length) {
      const { error: erroNotas } = await admin.from("avaliacoes").insert(notas.map((n) => ({
        evento_id: dados.evento.id,
        apresentacao_id: f.a,
        avaliador_id: juradoId,
        criterio_id: n.criterio_id,
        nota: n.nota,
        produtora_id: dados.evento.produtora_id,
        sincronizado: true,
        atualizado_em: u.toISOString(),
      })));
      if (erroNotas) { resultados.push({ a: f.a, status: "invalida", motivo: erroNotas.message }); continue; }
    }
    resultados.push({ a: f.a, status: "ok" });
  }
  return resultados;
}
