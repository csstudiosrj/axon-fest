"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Loader2, Mail, Phone, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { idadeEm } from "@/lib/documentos";
import { maiuscula, nomeFuncao, perfilPorSlug } from "@/lib/perfis";
import { Aviso, Cartao, brl, campo } from "../_ui";
import { confirmar } from "@/app/_components/Dialogos";

export interface GrupoInscrito {
  inscricaoId: string;
  id: string;
  nome: string;
  responsavel: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  origem: string | null;
  apresentacoes: {
    id: string; nome: string; tipo: "solo" | "duo" | "conjunto" | "grupo"; valor: number; pagamento: string; ordem: number | null;
    categoria: string | null; pessoas: number; arquivos: { total: number; recusados: number };
  }[];
  elenco: { vinculoId: string; nome: string; nascimento: string | null; funcao: string | null; confirmado: boolean; termo: boolean; token: string | null }[];
}

const SITUACOES = ["Pendente", "Pago", "Isento"] as const;
const corPagamento = (s: string) =>
  s === "Pago" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
  : s === "Isento" ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
  : "border-axon-gold/30 bg-axon-gold/10 text-axon-gold";
const telefone = (t: string | null) => (t ? t.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3") : null);

// Financeiro (e admin): valores e pagamentos. Marketing: só a lista, sem valores.
// Os grupos se inscrevem sozinhos pela página do festival; a produção não inscreve grupos.
export function Inscricoes({ eventoNome, perfilSlug, grupos, podePagar, verValores, filtroInicial }: {
  eventoNome: string;
  perfilSlug: string;
  grupos: GrupoInscrito[];
  podePagar: boolean;
  verValores: boolean;
  filtroInicial: string;
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const T = perfil.termos;
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState(filtroInicial);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [pagamentos, setPagamentos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const pag = (a: GrupoInscrito["apresentacoes"][number]) => pagamentos[a.id] ?? a.pagamento;

  const todas = grupos.flatMap((g) => g.apresentacoes);
  const soma = (s: string) => todas.filter((a) => pag(a) === s).reduce((t, a) => t + a.valor, 0);
  const visiveis = useMemo(() => grupos.filter((g) =>
    (!busca || `${g.nome} ${g.responsavel ?? ""} ${g.cidade ?? ""} ${g.apresentacoes.map((a) => a.nome).join(" ")}`.toLowerCase().includes(busca.toLowerCase())) &&
    (filtro === "todos" || g.apresentacoes.some((a) => (pagamentos[a.id] ?? a.pagamento) === filtro))
  ), [grupos, busca, filtro, pagamentos]);

  const alternar = (id: string) => setAbertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const mudarPagamento = async (id: string, valor: string) => {
    setSalvando(id);
    const { error } = await createClient().from("apresentacoes").update({ status_pagamento: valor }).eq("id", id);
    if (error) setAviso({ tipo: "erro", texto: error.message });
    else setPagamentos((p) => ({ ...p, [id]: valor }));
    setSalvando(null);
  };

  const excluirApresentacao = async (id: string, nome: string) => {
    if (!(await confirmar(`Excluir “${nome}”? A vaga fica livre para outra inscrição.`))) return;
    const { error } = await createClient().from("apresentacoes").delete().eq("id", id);
    setAviso(error ? { tipo: "erro", texto: error.message } : { tipo: "ok", texto: "Inscrição excluída. A vaga foi liberada." });
    router.refresh();
  };

  const reenviar = async (token: string) => {
    const res = await fetch(apiUrl("/api/enviar-confirmacao-vinculo"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setAviso(res.ok ? { tipo: "ok", texto: "Convite reenviado." } : { tipo: "erro", texto: "Não foi possível reenviar agora." });
  };

  const removerInscricao = async (g: GrupoInscrito) => {
    if (g.apresentacoes.length) return setAviso({ tipo: "erro", texto: `${g.nome} tem ${T.apresentacao.plural} inscritas. Exclua-as antes (o grupo pode fazer isso no portal enquanto as inscrições estão abertas).` });
    if (!(await confirmar(`Remover ${g.nome} deste evento?`))) return;
    const { error } = await createClient().from("inscricoes_grupo_evento").delete().eq("id", g.inscricaoId);
    setAviso(error ? { tipo: "erro", texto: error.message } : { tipo: "ok", texto: "Inscrição removida." });
    router.refresh();
  };

  const exportar = () => {
    const linhas = [["Ordem", maiuscula(T.grupo.singular), "Responsável", "E-mail", "Telefone", maiuscula(T.apresentacao.singular), "Categoria", "Formação", "Pessoas", ...(verValores ? ["Valor", "Pagamento"] : [])],
      ...grupos.flatMap((g) => g.apresentacoes.map((a) => [a.ordem ?? "", g.nome, g.responsavel ?? "", g.email ?? "", g.telefone ?? "", a.nome, a.categoria ?? "", perfil.formacoes[a.tipo], a.pessoas, ...(verValores ? [a.valor.toFixed(2).replace(".", ","), pag(a)] : [])]))];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    el.download = `inscricoes_${eventoNome.replace(/[^\w]+/g, "_")}.csv`;
    el.click();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { t: maiuscula(T.grupo.plural), v: String(grupos.length), ver: true },
          { t: maiuscula(T.apresentacao.plural), v: String(todas.length), ver: true },
          { t: "Recebido", v: brl(soma("Pago")), ver: verValores },
          { t: "A receber", v: brl(soma("Pendente")), ver: verValores },
          { t: "Isentas", v: String(todas.filter((a) => pag(a) === "Isento").length), ver: verValores },
        ].filter((k) => k.ver).map((k) => (
          <div key={k.t} className="rounded-xl border border-axon-border bg-axon-panel p-4">
            <p className="text-xs text-gray-400">{k.t}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-white">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Buscar ${T.grupo.singular}, responsável ou ${T.apresentacao.singular}`} className={`${campo} min-w-[220px] max-w-sm flex-1`} />
        {verValores && ["todos", ...SITUACOES].map((s) => (
          <button key={s} type="button" onClick={() => setFiltro(s)} className={`rounded-full px-3 py-1 text-xs ${filtro === s ? "bg-axon-gold/15 text-axon-gold" : "text-gray-400 hover:text-white"}`}>
            {s === "todos" ? "Todos" : `Com pagamento ${s.toLowerCase()}`}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={exportar} disabled={!todas.length} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 disabled:opacity-40"><Download size={14} /> Planilha</button>
        </div>
      </div>

      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {visiveis.length === 0 ? (
        <Cartao><p className="px-5 py-10 text-center text-sm text-gray-400">{grupos.length ? "Nada neste filtro." : `Nenhum(a) ${T.grupo.singular} inscrito(a) ainda. Divulgue o link de inscrição (botão no topo): os ${T.grupo.plural} se inscrevem por ele.`}</p></Cartao>
      ) : (
        <div className="space-y-3">
          {visiveis.map((g) => {
            const aberto = abertos.has(g.id);
            const total = g.apresentacoes.reduce((s, a) => s + a.valor, 0);
            const pendente = g.apresentacoes.filter((a) => pag(a) === "Pendente").reduce((s, a) => s + a.valor, 0);
            const semTermo = g.elenco.filter((p) => !p.confirmado || !p.termo).length;
            return (
              <section key={g.id} className="rounded-xl border border-axon-border bg-axon-panel">
                <button type="button" onClick={() => alternar(g.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{g.nome}</p>
                    <p className="text-xs text-gray-400">
                      {g.responsavel ?? "—"}{g.cidade ? ` · ${g.cidade}` : ""} · {g.apresentacoes.length} {g.apresentacoes.length === 1 ? T.apresentacao.singular : T.apresentacao.plural} · {g.elenco.length} no {T.elenco}
                      {semTermo ? <span className="text-axon-gold"> · {semTermo} sem termo</span> : null}
                    </p>
                  </div>
                  {verValores && <span className="text-sm tabular-nums text-white">{brl(total)}</span>}
                  {verValores && pendente > 0 && <span className="rounded-full border border-axon-gold/30 bg-axon-gold/10 px-2 py-0.5 text-[11px] text-axon-gold">{brl(pendente)} pendente</span>}
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${aberto ? "rotate-180" : ""}`} />
                </button>

                {aberto && (
                  <div className="space-y-4 border-t border-axon-border px-5 py-4">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
                      {g.email && <a href={`mailto:${g.email}`} className="inline-flex items-center gap-1 hover:text-white"><Mail size={12} /> {g.email}</a>}
                      {g.telefone && <a href={`https://wa.me/55${g.telefone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white"><Phone size={12} /> {telefone(g.telefone)}</a>}
                      <span>Inscrição {g.origem === "producao" ? "feita pela produção" : "pela página do festival"}</span>
                    </div>

                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{maiuscula(T.apresentacao.plural)}</p>
                      {g.apresentacoes.length === 0 ? <p className="text-sm text-gray-500">Nenhuma ainda.</p> : (
                        <ul className="divide-y divide-axon-border/60 rounded-lg border border-axon-border">
                          {g.apresentacoes.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-white">{a.nome}</p>
                                <p className="text-xs text-gray-500">{a.categoria ?? "Sem categoria"} · {perfil.formacoes[a.tipo]} · {a.pessoas} {a.pessoas === 1 ? "pessoa" : "pessoas"}{a.arquivos.recusados ? <span className="text-red-300"> · {a.arquivos.recusados} arquivo(s) recusado(s)</span> : null}</p>
                              </div>
                              {verValores && <span className="tabular-nums text-gray-200">{brl(a.valor)}</span>}
                              {verValores && (
                                <span className="flex items-center gap-1">
                                  {salvando === a.id && <Loader2 size={13} className="animate-spin text-gray-400" />}
                                  <select aria-label={`Pagamento de ${a.nome}`} value={pag(a)} disabled={!podePagar || salvando === a.id} onChange={(e) => mudarPagamento(a.id, e.target.value)}
                                    className={`rounded-full border px-2.5 py-1 text-xs outline-none ${corPagamento(pag(a))}`}>
                                    {SITUACOES.map((s) => <option key={s} value={s} className="bg-axon-panel text-white">{s}</option>)}
                                  </select>
                                  {podePagar && pag(a) === "Pendente" && (
                                    <button type="button" onClick={() => excluirApresentacao(a.id, a.nome)} title="Excluir (libera a vaga)" className="rounded p-1 text-gray-500 hover:text-red-300"><Trash2 size={13} /></button>
                                  )}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{maiuscula(T.elenco)}</p>
                      {g.elenco.length === 0 ? <p className="text-sm text-gray-500">Ninguém cadastrado.</p> : (
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {g.elenco.map((p) => {
                            const idade = idadeEm(p.nascimento);
                            return (
                              <li key={p.vinculoId} className="flex items-center justify-between gap-2 rounded-lg border border-axon-border px-3 py-2 text-sm">
                                <span className="min-w-0">
                                  <span className="block truncate text-white">{p.nome}</span>
                                  <span className="text-xs text-gray-500">{nomeFuncao(perfil, p.funcao) || "—"}{idade !== null ? ` · ${idade} anos` : ""}</span>
                                </span>
                                {p.confirmado && p.termo ? <span className="text-[11px] text-emerald-300">Termo assinado</span>
                                  : p.token ? <button type="button" onClick={() => reenviar(p.token!)} className="shrink-0 text-[11px] text-axon-gold hover:underline">{p.confirmado ? "Termo pendente · reenviar" : "Não confirmou · reenviar"}</button>
                                  : <span className="text-[11px] text-axon-gold">{p.confirmado ? "Termo pendente" : "Não confirmou"}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {podePagar && (
                      <button type="button" onClick={() => removerInscricao(g)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-300">
                        <Trash2 size={12} /> Remover do evento
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      {verValores && <p className="text-xs text-gray-500">O pagamento online pela plataforma ainda não está ativo: por enquanto, combine com os {T.grupo.plural} e marque aqui.</p>}
    </div>
  );
}
