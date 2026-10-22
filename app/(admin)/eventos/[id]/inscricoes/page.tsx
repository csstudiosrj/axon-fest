import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { perfilDoEvento } from "@/lib/grupo/contexto";
import { Inscricoes, type LinhaInscricao } from "./Inscricoes";

export const dynamic = "force-dynamic";

function um<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default async function InscricoesDoEvento({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status }] = await Promise.all([params, searchParams]);
  const usuario = await getUsuarioAtual();
  if (!usuario || !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: evento } = await supabase.from("eventos")
    .select("id, nome, produtora_id, perfis_festival:perfil_id ( slug )").eq("id", id).maybeSingle();
  // Eventos públicos de outras produtoras também são legíveis: confere o dono
  if (!evento || (usuario.role !== "super_admin" && evento.produtora_id !== usuario.produtora_id)) notFound();

  const { data: aps } = await supabase.from("apresentacoes")
    .select("id, nome, tipo, valor_total, status_pagamento, ordem_apresentacao, created_at, grupos ( nome ), categorias ( nome ), apresentacao_elenco ( participante_id ), apresentacao_arquivos ( status )")
    .eq("evento_id", id)
    .order("ordem_apresentacao", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const linhas: LinhaInscricao[] = (aps ?? []).map((a) => {
    const arquivos = (a.apresentacao_arquivos ?? []) as { status: string }[];
    return {
      id: a.id as string,
      nome: a.nome as string,
      tipo: a.tipo as LinhaInscricao["tipo"],
      valor: Number(a.valor_total ?? 0),
      status: (a.status_pagamento as string | null) ?? "Pendente",
      ordem: (a.ordem_apresentacao as number | null) ?? null,
      criada: a.created_at as string,
      grupo: um(a.grupos as { nome?: string } | { nome?: string }[] | null)?.nome ?? "—",
      categoria: um(a.categorias as { nome?: string } | { nome?: string }[] | null)?.nome ?? null,
      elenco: ((a.apresentacao_elenco ?? []) as unknown[]).length,
      arquivos: { total: arquivos.length, recusados: arquivos.filter((f) => f.status === "recusado").length, analise: arquivos.filter((f) => f.status === "recebido").length },
    };
  });

  return (
    <Inscricoes evento={{ id: evento.id as string, nome: evento.nome as string }} perfilSlug={perfilDoEvento(evento).slug}
      linhas={linhas} filtroInicial={status === "pendente" ? "Pendente" : "todos"} />
  );
}
