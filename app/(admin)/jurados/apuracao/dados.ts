"use client";

import { abrirBanco, gravar, listar, obter, remover } from "@/lib/offline/idb";
import { apiUrl } from "@/lib/base-path";
import { descriptografarPacote, type PacoteNotas } from "@/lib/offline/transferencia";

export interface CriterioA { id: string; nome: string; nota_min: number; nota_max: number; peso: number; ordem: number | null }
export interface ApresentacaoA {
  id: string; nome: string; tipo: string; grupo: string; categoria_id: string | null; categoria: string;
  competitiva: boolean; ordem_apresentacao: number | null; data_apresentacao: string | null; local: string | null; desempate: number | null;
}
export interface FichaA { a: string; j: string; notas: Record<string, number | null>; c: string | null; f: string | null; u: string; origem?: string; pendente?: boolean }
export interface PacoteApuracao {
  evento: { id: string; nome: string; produtora_id: string | null; metodo_apuracao: string; data_inicio: string | null; data_fim: string | null; local: string | null; liberar_comentarios: boolean; resultado_publicado_em: string | null };
  criterios: CriterioA[];
  apresentacoes: ApresentacaoA[];
  jurados: { id: string; nome: string; chave: string }[];
  fichas: FichaA[];
  baixado_em: string;
}

// QR lido e ainda não confirmado pelo servidor
export interface Recebimento {
  id: string;
  evento: string;
  jurado: string;
  dados: string;          // pacote criptografado (o servidor confere de novo)
  fichas: FichaA[];       // conteúdo aberto neste aparelho (para apurar offline)
  lido_em: string;
  status: "pendente" | "enviado" | "erro";
  mensagem?: string;
}

let bancoPromise: Promise<IDBDatabase> | null = null;
function banco() {
  bancoPromise ??= abrirBanco("arxum-apuracao", 1, {
    pacotes: {},
    recebimentos: { keyPath: "id", indices: ["evento"] },
  });
  return bancoPromise;
}

export async function pacotesLocais() {
  return listar<PacoteApuracao>(await banco(), "pacotes");
}

export async function pacoteLocal(eventoId: string) {
  return obter<PacoteApuracao>(await banco(), "pacotes", eventoId);
}

export async function baixarPacote(eventoId: string): Promise<PacoteApuracao> {
  const res = await fetch(apiUrl(`/api/apuracao/pacote?evento=${encodeURIComponent(eventoId)}`), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Não foi possível baixar a apuração.");
  await gravar(await banco(), "pacotes", json, eventoId);
  return json as PacoteApuracao;
}

export async function recebimentos(eventoId: string) {
  return listar<Recebimento>(await banco(), "recebimentos", "evento", eventoId);
}

// Abre o QR com a chave do jurado guardada no aparelho e enfileira
export async function registrarRecebimento(pacote: PacoteApuracao, juradoId: string, dados: string): Promise<Recebimento> {
  const jurado = pacote.jurados.find((j) => j.id === juradoId);
  if (!jurado) throw new Error("QR de um jurado que não está designado para este evento (ou dados desatualizados).");
  let aberto: PacoteNotas;
  try {
    aberto = await descriptografarPacote(dados, jurado.chave, pacote.evento.id, juradoId);
  } catch {
    throw new Error("Não foi possível abrir as notas: QR inválido ou de outro evento.");
  }
  const rec: Recebimento = {
    id: crypto.randomUUID(),
    evento: pacote.evento.id,
    jurado: juradoId,
    dados,
    fichas: aberto.fichas.map((f) => ({
      a: f.a, j: juradoId,
      notas: Object.fromEntries(aberto.k.map((cid, i) => [cid, f.n[i] ?? null])),
      c: f.c ?? null, f: f.f, u: f.u, origem: "qr", pendente: true,
    })),
    lido_em: new Date().toISOString(),
    status: "pendente",
  };
  await gravar(await banco(), "recebimentos", rec);
  return rec;
}

export async function enviarRecebimento(rec: Recebimento): Promise<Recebimento> {
  const res = await fetch(apiUrl("/api/apuracao/importar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evento_id: rec.evento, jurado_id: rec.jurado, dados: rec.dados }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; resultados?: { status: string }[] };
  const atualizado: Recebimento = res.ok
    ? { ...rec, status: "enviado", mensagem: `${json.resultados?.filter((r) => r.status === "ok").length ?? 0} ficha(s) gravada(s)` }
    : { ...rec, status: "erro", mensagem: json.error ?? "Falha ao enviar." };
  await gravar(await banco(), "recebimentos", atualizado);
  return atualizado;
}

export async function apagarRecebimento(id: string) {
  await remover(await banco(), "recebimentos", id);
}

// Fichas do servidor + recebidas por QR ainda não enviadas (vale a mais nova)
export function fichasMescladas(pacote: PacoteApuracao, recs: Recebimento[]): FichaA[] {
  const mapa = new Map<string, FichaA>();
  for (const f of pacote.fichas) mapa.set(`${f.a}:${f.j}`, f);
  for (const r of recs) {
    if (r.status === "enviado") continue;
    for (const f of r.fichas) {
      const k = `${f.a}:${f.j}`;
      const atual = mapa.get(k);
      if (!atual || new Date(f.u) > new Date(atual.u)) mapa.set(k, f);
    }
  }
  return [...mapa.values()];
}
