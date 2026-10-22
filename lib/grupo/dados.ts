import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ArquivoEnviado {
  id: string;
  tipo: string;
  url: string;
  nome: string | null;
  tamanho: number | null;
  mime: string | null;
  status: "recebido" | "aprovado" | "recusado";
  observacao: string | null;
  updated_at: string;
}

export interface ApresentacaoGrupo {
  id: string;
  nome: string;
  tipo: "solo" | "duo" | "conjunto" | "grupo";
  categoria_id: string | null;
  observacoes: string | null;
  valor_total: number;
  status_pagamento: string | null;
  ordem_apresentacao: number | null;
  data_apresentacao: string | null;
  elenco: string[];              // participante_id
  arquivos: ArquivoEnviado[];
}

export interface CategoriaEvento {
  id: string;
  nome: string;
  pai_id: string | null;
  pai_nome: string | null;
  valor_solo: number;
  valor_duo: number;
  valor_conjunto: number;
  permite_solo: boolean;
  permite_duo: boolean;
  permite_conjunto: boolean;
  min_participantes: number | null;
  max_participantes: number | null;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  faixa_etaria_label: string | null;
  tempo_apresentacao_min: number | null;
  tempo_apresentacao_max: number | null;
  observacoes: string | null;
}

// Apresentações do grupo no evento, com elenco e arquivos (leitura com RLS)
export async function carregarApresentacoes(eventoId: string, grupoId: string): Promise<ApresentacaoGrupo[]> {
  const supabase = await createClient();
  const { data: aps } = await supabase
    .from("apresentacoes")
    .select("id, nome, tipo, categoria_id, observacoes, valor_total, status_pagamento, ordem_apresentacao, data_apresentacao, created_at")
    .eq("evento_id", eventoId).eq("grupo_id", grupoId)
    .order("created_at", { ascending: true });
  const ids = (aps ?? []).map((a) => a.id as string);
  if (ids.length === 0) return [];

  const [{ data: elenco }, { data: arquivos }] = await Promise.all([
    supabase.from("apresentacao_elenco").select("apresentacao_id, participante_id").in("apresentacao_id", ids),
    supabase.from("apresentacao_arquivos").select("id, apresentacao_id, tipo, url, nome, tamanho, mime, status, observacao, updated_at").in("apresentacao_id", ids),
  ]);

  return (aps ?? []).map((a) => ({
    id: a.id as string,
    nome: a.nome as string,
    tipo: a.tipo as ApresentacaoGrupo["tipo"],
    categoria_id: (a.categoria_id as string | null) ?? null,
    observacoes: (a.observacoes as string | null) ?? null,
    valor_total: Number(a.valor_total ?? 0),
    status_pagamento: (a.status_pagamento as string | null) ?? null,
    ordem_apresentacao: (a.ordem_apresentacao as number | null) ?? null,
    data_apresentacao: (a.data_apresentacao as string | null) ?? null,
    elenco: (elenco ?? []).filter((e) => e.apresentacao_id === a.id).map((e) => e.participante_id as string),
    arquivos: (arquivos ?? []).filter((f) => f.apresentacao_id === a.id).map((f) => ({
      id: f.id as string,
      tipo: f.tipo as string,
      url: f.url as string,
      nome: (f.nome as string | null) ?? null,
      tamanho: (f.tamanho as number | null) ?? null,
      mime: (f.mime as string | null) ?? null,
      status: f.status as ArquivoEnviado["status"],
      observacao: (f.observacao as string | null) ?? null,
      updated_at: f.updated_at as string,
    })),
  }));
}

// Categorias em que o grupo pode se inscrever: as "folhas" da árvore
export async function carregarCategorias(eventoId: string): Promise<CategoriaEvento[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("*").eq("evento_id", eventoId).order("nome");
  const todas = data ?? [];
  const nomePorId = new Map(todas.map((c) => [c.id as string, c.nome as string]));
  const temFilhas = new Set(todas.map((c) => c.categoria_pai_id as string | null).filter(Boolean));
  return todas
    .filter((c) => !temFilhas.has(c.id as string))
    .map((c) => ({
      id: c.id as string,
      nome: c.nome as string,
      pai_id: (c.categoria_pai_id as string | null) ?? null,
      pai_nome: c.categoria_pai_id ? nomePorId.get(c.categoria_pai_id as string) ?? null : null,
      valor_solo: Number(c.valor_solo ?? 0),
      valor_duo: Number(c.valor_duo ?? 0),
      valor_conjunto: Number(c.valor_conjunto ?? 0),
      permite_solo: c.permite_solo !== false,
      permite_duo: c.permite_duo !== false,
      permite_conjunto: c.permite_conjunto !== false,
      min_participantes: (c.min_participantes as number | null) ?? null,
      max_participantes: (c.max_participantes as number | null) ?? null,
      faixa_etaria_min: (c.faixa_etaria_min as number | null) ?? null,
      faixa_etaria_max: (c.faixa_etaria_max as number | null) ?? null,
      faixa_etaria_label: (c.faixa_etaria_label as string | null) ?? null,
      tempo_apresentacao_min: (c.tempo_apresentacao_min as number | null) ?? null,
      tempo_apresentacao_max: (c.tempo_apresentacao_max as number | null) ?? null,
      observacoes: (c.observacoes as string | null) ?? null,
    }))
    .sort((a, b) => `${a.pai_nome ?? ""} ${a.nome}`.localeCompare(`${b.pai_nome ?? ""} ${b.nome}`, "pt-BR"));
}

export const pago = (status: string | null) => !!status && status.toLowerCase() !== "pendente";
