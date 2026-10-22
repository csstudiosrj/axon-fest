"use client";

// Caixa sem internet: pacote (produtos, eventos, PIX) e vendas ficam no
// aparelho; as vendas seguem para o servidor quando houver conexão.

import { apiUrl } from "@/lib/base-path";
import { abrirBanco, gravar, gravarVarios, listar, obter, remover, type Lojas } from "@/lib/offline/idb";

export interface ProdutoPdv { id: string; nome: string; preco: number; categoria: string; tipo: "cantina" | "bilheteria" }
export interface PacotePdv {
  usuario: { id: string; nome: string };
  produtora: { id: string; nome: string };
  pix: { chave: string; nome: string; cidade: string } | null;
  produtos: ProdutoPdv[];
  eventos: { id: string; nome: string; data_inicio: string | null }[];
  baixado_em: string;
}
export interface ItemVendido {
  id: string;
  venda_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  forma_pagamento: "dinheiro" | "pix" | "cartao";
  evento_id: string | null;
  created_at: string;
  usuario_id: string;
  enviado: 0 | 1;
}

const LOJAS: Lojas = { pacote: {}, vendas: { keyPath: "id", indices: ["enviado", "usuario_id"] }, sessao: {} };
const banco = () => abrirBanco("arxum-pdv", 1, LOJAS);

export async function baixarPacote(): Promise<PacotePdv> {
  const r = await fetch(apiUrl("/api/operador/pacote"), { cache: "no-store" });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((json as { error?: string }).error ?? "Não foi possível carregar o caixa.");
  await gravar(await banco(), "pacote", json, "atual");
  return json as PacotePdv;
}

export async function pacoteLocal() {
  return obter<PacotePdv>(await banco(), "pacote", "atual");
}

export async function registrarVenda(itens: ItemVendido[]) {
  await gravarVarios(await banco(), "vendas", itens);
}

export async function vendasDoAparelho(usuarioId: string) {
  return listar<ItemVendido>(await banco(), "vendas", "usuario_id", usuarioId);
}

// Envia o que falta; devolve quantos itens ainda ficaram pendentes
export async function enviarPendentes(usuarioId: string): Promise<number> {
  const db = await banco();
  const pendentes = (await listar<ItemVendido>(db, "vendas", "enviado", 0)).filter((v) => v.usuario_id === usuarioId);
  if (!pendentes.length) return 0;
  const r = await fetch(apiUrl("/api/operador/vendas"), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itens: pendentes.map((v) => ({
        id: v.id, venda_id: v.venda_id, produto_id: v.produto_id, produto_nome: v.produto_nome, quantidade: v.quantidade,
        preco_unitario: v.preco_unitario, forma_pagamento: v.forma_pagamento, evento_id: v.evento_id, created_at: v.created_at,
      })),
    }),
  });
  if (!r.ok) return pendentes.length;
  const { aceitos = [], recusados = [] } = (await r.json()) as { aceitos?: string[]; recusados?: string[] };
  const feitos = new Set([...aceitos, ...recusados]);
  await gravarVarios(db, "vendas", pendentes.filter((v) => feitos.has(v.id)).map((v) => ({ ...v, enviado: 1 as const })));
  return pendentes.length - feitos.size;
}

// PIN validado neste aparelho (vale por algumas horas, também sem internet)
const VALIDADE_PIN_MS = 18 * 60 * 60 * 1000;

export async function marcarPinValidado(usuarioId: string) {
  await gravar(await banco(), "sessao", { usuarioId, ate: Date.now() + VALIDADE_PIN_MS }, "pin");
}

export async function pinValidoNoAparelho(usuarioId: string | null) {
  const s = await obter<{ usuarioId: string; ate: number }>(await banco(), "sessao", "pin").catch(() => undefined);
  return !!s && s.ate > Date.now() && (!usuarioId || s.usuarioId === usuarioId);
}

export async function bloquearCaixa() {
  await remover(await banco(), "sessao", "pin");
}

// Itens antigos já enviados saem do aparelho depois de 30 dias
export async function limparAntigos() {
  const db = await banco();
  const limite = Date.now() - 30 * 86400000;
  for (const v of await listar<ItemVendido>(db, "vendas", "enviado", 1)) {
    if (Date.parse(v.created_at) < limite) await remover(db, "vendas", v.id);
  }
}
