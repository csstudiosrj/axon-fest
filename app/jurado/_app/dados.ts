"use client";

import { abrirBanco, gravar, gravarVarios, listar, obter, remover } from "@/lib/offline/idb";
import { apiUrl } from "@/lib/base-path";

// ── Tipos do pacote baixado ─────────────────────────────────────────────────
export interface Criterio { id: string; nome: string; nota_min: number; nota_max: number; peso: number; ordem: number | null }
export interface Apresentacao {
  id: string; nome: string; tipo: string; grupo: string; categoria: string; categoria_id: string | null;
  ordem_apresentacao: number | null; data_apresentacao: string | null; local: string | null;
}
export interface FichaServidor { a: string; j: string; notas: Record<string, number>; c: string | null; f: string | null; u: string }
export interface Pacote {
  evento: { id: string; nome: string; data_inicio: string | null; data_fim: string | null; local: string | null };
  criterios: Criterio[];
  apresentacoes: Apresentacao[];
  jurado_id: string;
  chave: string;
  fichas: FichaServidor[];
  baixado_em: string;
}

// Ficha guardada no aparelho
export interface FichaLocal {
  k: string;          // `${evento}:${apresentacao}`
  e: string;
  a: string;
  notas: Record<string, number | null>;
  c: string;
  f: string | null;   // finalizada em
  u: string;          // atualizada em
  s: string | null;   // versão (u) já confirmada pelo servidor
}

const BANCO = "arxum-jurado";

let bancoPromise: Promise<IDBDatabase> | null = null;
export function banco() {
  bancoPromise ??= abrirBanco(BANCO, 1, {
    pacotes: {},
    fichas: { keyPath: "k", indices: ["e"] },
  });
  return bancoPromise;
}

export async function listarPacotes(): Promise<Pacote[]> {
  return listar<Pacote>(await banco(), "pacotes");
}

export async function fichasDoEvento(eventoId: string): Promise<FichaLocal[]> {
  return listar<FichaLocal>(await banco(), "fichas", "e", eventoId);
}

export async function salvarFicha(f: FichaLocal) {
  await gravar(await banco(), "fichas", f);
}

// Mescla fichas do servidor nas locais: vale a versão mais nova (inclui reaberturas)
async function mesclar(eventoId: string, doServidor: FichaServidor[]) {
  const db = await banco();
  const locais = new Map((await fichasDoEvento(eventoId)).map((f) => [f.a, f]));
  const novas: FichaLocal[] = [];
  for (const s of doServidor) {
    const l = locais.get(s.a);
    if (!l || new Date(s.u).getTime() >= new Date(l.u).getTime()) {
      novas.push({ k: `${eventoId}:${s.a}`, e: eventoId, a: s.a, notas: s.notas, c: s.c ?? "", f: s.f, u: s.u, s: s.u });
    }
  }
  if (novas.length) await gravarVarios(db, "fichas", novas);
}

export async function baixarPacote(eventoId: string): Promise<Pacote> {
  const res = await fetch(apiUrl(`/api/jurado/pacote?evento=${encodeURIComponent(eventoId)}`), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Não foi possível baixar o evento.");
  const pacote = json as Pacote;
  await gravar(await banco(), "pacotes", pacote, eventoId);
  await mesclar(eventoId, pacote.fichas);
  return pacote;
}

export function pendentes(fichas: FichaLocal[]) {
  return fichas.filter((f) => f.s !== f.u);
}

export async function sincronizar(eventoId: string): Promise<{ enviadas: number; problemas: string[] }> {
  const lista = pendentes(await fichasDoEvento(eventoId));
  const res = await fetch(apiUrl("/api/jurado/sincronizar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      evento_id: eventoId,
      fichas: lista.map((f) => ({ a: f.a, notas: f.notas, c: f.c, f: f.f, u: f.u })),
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string; resultados?: { a: string; status: string; motivo?: string }[]; fichas?: FichaServidor[];
  };
  if (!res.ok) throw new Error(json.error ?? "Falha ao sincronizar.");

  const db = await banco();
  const problemas: string[] = [];
  for (const r of json.resultados ?? []) {
    const f = lista.find((x) => x.a === r.a);
    if (!f) continue;
    if (r.status === "invalida") { problemas.push(r.motivo ?? "ficha inválida"); continue; }
    await gravar(db, "fichas", { ...f, s: f.u });
  }
  await mesclar(eventoId, json.fichas ?? []);
  return { enviadas: lista.length, problemas };
}

export async function apagarTudo() {
  const db = await banco();
  for (const p of await listar<Pacote>(db, "pacotes")) {
    await remover(db, "pacotes", p.evento.id);
    for (const f of await fichasDoEvento(p.evento.id)) await remover(db, "fichas", f.k);
  }
}

export async function obterPacote(eventoId: string) {
  return obter<Pacote>(await banco(), "pacotes", eventoId);
}
