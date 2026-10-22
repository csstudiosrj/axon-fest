"use client";

// Mídias da produção: conferência dos arquivos técnicos e cópia no aparelho
// para tocar trilhas e abrir riders/mapas sem internet (teatros e ginásios).

import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { abrirBanco, gravar, listar, obter, remover, type Lojas } from "@/lib/offline/idb";

export interface ArquivoMidia {
  id: string;
  tipo: string;
  url: string;
  nome: string | null;
  mime: string | null;
  tamanho: number | null;
  status: "recebido" | "aprovado" | "recusado";
  observacao: string | null;
  updated_at: string;
}

export interface ItemMidia {
  apresentacao_id: string;
  ordem: number | null;
  nome: string;
  grupo: string;
  categoria: string | null;
  tipo: "solo" | "duo" | "conjunto" | "grupo";
  arquivos: ArquivoMidia[];
}

export interface PacoteMidias {
  evento: { id: string; nome: string; perfil: string | null; data_inicio: string | null };
  atualizadoEm: string;
  itens: ItemMidia[];
}

interface ArquivoGuardado {
  chave: string;        // id do arquivo + data da última troca
  evento: string;
  blob: Blob;
}

const LOJAS: Lojas = {
  pacotes: {},
  arquivos: { keyPath: "chave", indices: ["evento"] },
};

const banco = () => abrirBanco("arxum-midias", 1, LOJAS);
const chaveDe = (a: ArquivoMidia) => `${a.id}:${a.updated_at}`;

function um<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

// ── Servidor → aparelho ─────────────────────────────────────────────────────

export async function buscarPacote(eventoId: string): Promise<PacoteMidias> {
  const supabase = createClient();
  const [{ data: evento, error: e1 }, { data: aps, error: e2 }] = await Promise.all([
    supabase.from("eventos").select("id, nome, data_inicio, perfis_festival:perfil_id ( slug )").eq("id", eventoId).single(),
    supabase.from("apresentacoes")
      .select("id, nome, tipo, ordem_apresentacao, created_at, grupos ( nome ), categorias ( nome )")
      .eq("evento_id", eventoId)
      .order("ordem_apresentacao", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);
  if (e1 || !evento) throw new Error("Evento não encontrado.");
  if (e2) throw new Error(e2.message);

  const ids = (aps ?? []).map((a) => a.id as string);
  const { data: arquivos, error: e3 } = ids.length
    ? await supabase.from("apresentacao_arquivos")
        .select("id, apresentacao_id, tipo, url, nome, mime, tamanho, status, observacao, updated_at")
        .in("apresentacao_id", ids)
    : { data: [], error: null };
  if (e3) throw new Error(e3.message);

  const pacote: PacoteMidias = {
    evento: {
      id: evento.id as string,
      nome: evento.nome as string,
      perfil: um(evento.perfis_festival as { slug?: string } | { slug?: string }[] | null)?.slug ?? null,
      data_inicio: (evento.data_inicio as string | null) ?? null,
    },
    atualizadoEm: new Date().toISOString(),
    itens: (aps ?? []).map((a) => ({
      apresentacao_id: a.id as string,
      ordem: (a.ordem_apresentacao as number | null) ?? null,
      nome: a.nome as string,
      grupo: um(a.grupos as { nome?: string } | { nome?: string }[] | null)?.nome ?? "—",
      categoria: um(a.categorias as { nome?: string } | { nome?: string }[] | null)?.nome ?? null,
      tipo: a.tipo as ItemMidia["tipo"],
      arquivos: (arquivos ?? []).filter((f) => f.apresentacao_id === a.id).map((f) => ({
        id: f.id as string,
        tipo: f.tipo as string,
        url: f.url as string,
        nome: (f.nome as string | null) ?? null,
        mime: (f.mime as string | null) ?? null,
        tamanho: (f.tamanho as number | null) ?? null,
        status: f.status as ArquivoMidia["status"],
        observacao: (f.observacao as string | null) ?? null,
        updated_at: f.updated_at as string,
      })),
    })),
  };
  return pacote;
}

// ── Aparelho ────────────────────────────────────────────────────────────────

export async function pacoteLocal(eventoId: string) {
  return obter<PacoteMidias>(await banco(), "pacotes", eventoId);
}

export async function pacotesLocais() {
  return listar<PacoteMidias>(await banco(), "pacotes");
}

// Arquivos deste evento já guardados (chave → true)
export async function guardados(eventoId: string): Promise<Set<string>> {
  const lista = await listar<ArquivoGuardado>(await banco(), "arquivos", "evento", eventoId);
  return new Set(lista.map((a) => a.chave));
}

export async function blobLocal(a: ArquivoMidia): Promise<Blob | null> {
  return (await obter<ArquivoGuardado>(await banco(), "arquivos", chaveDe(a)))?.blob ?? null;
}

// Baixa o arquivo: direto do armazenamento; se o navegador bloquear, pelo servidor
async function baixarArquivo(a: ArquivoMidia): Promise<Blob> {
  try {
    const r = await fetch(a.url, { mode: "cors", credentials: "omit" });
    if (r.ok) return await r.blob();
  } catch {
    // segue para o servidor
  }
  const r = await fetch(apiUrl(`/api/midias/arquivo?id=${encodeURIComponent(a.id)}`));
  if (!r.ok) throw new Error(`Não foi possível baixar ${a.nome ?? "um arquivo"}.`);
  return r.blob();
}

// Guarda o pacote e todos os arquivos (exceto recusados) no aparelho
export async function prepararAparelho(
  pacote: PacoteMidias,
  progresso: (feitos: number, total: number) => void
): Promise<{ falhas: string[] }> {
  const db = await banco();
  if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);

  const desejados = pacote.itens.flatMap((i) => i.arquivos).filter((a) => a.status !== "recusado");
  const jaTem = await guardados(pacote.evento.id);
  const chaves = new Set(desejados.map(chaveDe));
  const falhas: string[] = [];

  let feitos = 0;
  progresso(0, desejados.length);
  for (const a of desejados) {
    if (!jaTem.has(chaveDe(a))) {
      try {
        const blob = await baixarArquivo(a);
        await gravar<ArquivoGuardado>(db, "arquivos", { chave: chaveDe(a), evento: pacote.evento.id, blob });
      } catch (e) {
        falhas.push(e instanceof Error ? e.message : String(e));
      }
    }
    progresso(++feitos, desejados.length);
  }

  // Remove versões antigas e arquivos que saíram do evento
  for (const chave of jaTem) if (!chaves.has(chave)) await remover(db, "arquivos", chave);
  await gravar(db, "pacotes", pacote, pacote.evento.id);
  return { falhas };
}

export async function apagarDoAparelho(eventoId: string) {
  const db = await banco();
  for (const chave of await guardados(eventoId)) await remover(db, "arquivos", chave);
  await remover(db, "pacotes", eventoId);
}

export async function espacoUsado(eventoId: string): Promise<number> {
  const lista = await listar<ArquivoGuardado>(await banco(), "arquivos", "evento", eventoId);
  return lista.reduce((s, a) => s + a.blob.size, 0);
}
