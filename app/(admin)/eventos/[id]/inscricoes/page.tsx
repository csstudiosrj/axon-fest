import { createClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { Inscricoes, type GrupoInscrito } from "./Inscricoes";

export const dynamic = "force-dynamic";

function um<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default async function PaginaInscricoes({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status }] = await Promise.all([params, searchParams]);
  const { evento, perfil, podeGerir } = await carregarEvento(id);
  const supabase = await createClient();

  const [{ data: inscricoes }, { data: aps }] = await Promise.all([
    supabase.from("inscricoes_grupo_evento")
      .select("id, grupo_id, created_at, origem, grupos ( id, nome, responsavel, email, email_contato, telefone, cidade, estado )")
      .eq("evento_id", evento.id).order("created_at"),
    supabase.from("apresentacoes")
      .select("id, nome, tipo, grupo_id, valor_total, status_pagamento, ordem_apresentacao, categorias ( nome ), apresentacao_elenco ( participante_id ), apresentacao_arquivos ( status )")
      .eq("evento_id", evento.id).order("created_at"),
  ]);
  const gids = (inscricoes ?? []).map((i) => i.grupo_id);
  const { data: vinculos } = gids.length
    ? await supabase.from("grupo_participante")
        .select("id, grupo_id, funcao, confirmado, token_confirmacao, participantes ( id, nome, data_nascimento, termo_assinado )")
        .in("grupo_id", gids).eq("status", "ativo")
    : { data: [] };

  const grupos: GrupoInscrito[] = (inscricoes ?? []).map((i) => {
    const g = um(i.grupos);
    return {
      inscricaoId: i.id,
      id: i.grupo_id,
      nome: g?.nome ?? "—",
      responsavel: g?.responsavel ?? null,
      email: g?.email_contato || g?.email || null,
      telefone: g?.telefone ?? null,
      cidade: [g?.cidade, g?.estado].filter(Boolean).join("/") || null,
      origem: i.origem,
      apresentacoes: (aps ?? []).filter((a) => a.grupo_id === i.grupo_id).map((a) => ({
        id: a.id, nome: a.nome, tipo: a.tipo as "solo" | "duo" | "conjunto" | "grupo", valor: Number(a.valor_total ?? 0),
        pagamento: a.status_pagamento ?? "Pendente", ordem: a.ordem_apresentacao, categoria: um(a.categorias)?.nome ?? null,
        pessoas: (a.apresentacao_elenco ?? []).length,
        arquivos: { total: (a.apresentacao_arquivos ?? []).length, recusados: (a.apresentacao_arquivos ?? []).filter((f) => f.status === "recusado").length },
      })),
      elenco: (vinculos ?? []).filter((v) => v.grupo_id === i.grupo_id).map((v) => {
        const p = um(v.participantes);
        return { vinculoId: v.id, nome: p?.nome ?? "—", nascimento: p?.data_nascimento ?? null, funcao: v.funcao, confirmado: v.confirmado, termo: !!p?.termo_assinado, token: v.confirmado ? null : v.token_confirmacao };
      }),
    };
  });

  return <Inscricoes eventoId={evento.id} eventoNome={evento.nome} perfilSlug={perfil.slug} grupos={grupos} podeGerir={podeGerir} filtroInicial={status === "Pendente" ? "Pendente" : "todos"} />;
}
