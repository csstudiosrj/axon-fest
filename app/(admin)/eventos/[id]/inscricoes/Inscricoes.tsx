"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileAudio, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maiuscula, perfilPorSlug } from "@/lib/perfis";

export interface LinhaInscricao {
  id: string;
  nome: string;
  tipo: "solo" | "duo" | "conjunto" | "grupo";
  valor: number;
  status: string;
  ordem: number | null;
  criada: string;
  grupo: string;
  categoria: string | null;
  elenco: number;
  arquivos: { total: number; recusados: number; analise: number };
}

const SITUACOES = ["Pendente", "Pago", "Isento"] as const;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cor = (s: string) =>
  s === "Pago" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
  : s === "Isento" ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
  : "border-axon-gold/30 bg-axon-gold/10 text-axon-gold";

export function Inscricoes({ evento, perfilSlug, linhas, filtroInicial }: {
  evento: { id: string; nome: string };
  perfilSlug: string;
  linhas: LinhaInscricao[];
  filtroInicial: string;
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const T = perfil.termos;
  const [filtro, setFiltro] = useState(filtroInicial);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [situacoes, setSituacoes] = useState<Record<string, string>>({});
  const situacao = (l: LinhaInscricao) => situacoes[l.id] ?? l.status;

  const visiveis = linhas.filter((l) =>
    (filtro === "todos" || situacao(l) === filtro) &&
    (!busca || `${l.nome} ${l.grupo} ${l.categoria ?? ""}`.toLowerCase().includes(busca.toLowerCase()))
  );
  const soma = (s: string) => linhas.filter((l) => situacao(l) === s).reduce((t, l) => t + l.valor, 0);

  const mudar = async (l: LinhaInscricao, nova: string) => {
    setSalvando(l.id);
    setErro(null);
    const { error } = await createClient().from("apresentacoes").update({ status_pagamento: nova }).eq("id", l.id);
    if (error) setErro(error.message);
    else setSituacoes((s) => ({ ...s, [l.id]: nova }));
    setSalvando(null);
    router.refresh();
  };

  const exportar = () => {
    const cab = ["Ordem", maiuscula(T.apresentacao.singular), maiuscula(T.grupo.singular), "Categoria", "Formação", "Pessoas", "Valor", "Pagamento"];
    const linhasCsv = linhas.map((l) => [l.ordem ?? "", l.nome, l.grupo, l.categoria ?? "", perfil.formacoes[l.tipo], l.elenco, l.valor.toFixed(2).replace(".", ","), situacao(l)]);
    const csv = [cab, ...linhasCsv].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `inscricoes_${evento.nome.replace(/[^\w]+/g, "_")}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <Link href={`/eventos/${evento.id}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white"><ArrowLeft size={13} /> {evento.nome}</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Inscrições e pagamentos</h1>
            <p className="mt-1 text-sm text-gray-400">{maiuscula(T.apresentacao.plural)} {T.apresentacao.genero === "f" ? "inscritas" : "inscritos"} {T.grupo.genero === "f" ? "pelas" : "pelos"} {T.grupo.plural}. Marque aqui o que já foi pago.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/midias?evento=${evento.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:text-white"><FileAudio size={14} /> Mídias</Link>
            <button type="button" onClick={exportar} disabled={!linhas.length} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:text-white disabled:opacity-40"><Download size={14} /> Planilha</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { t: "Inscrições", v: String(linhas.length), c: "text-white" },
          { t: "Recebido", v: brl(soma("Pago")), c: "text-emerald-300" },
          { t: "A receber", v: brl(soma("Pendente")), c: "text-axon-gold" },
          { t: "Isentas", v: String(linhas.filter((l) => situacao(l) === "Isento").length), c: "text-sky-300" },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border border-axon-border bg-axon-panel p-4">
            <p className="text-xs text-gray-400">{k.t}</p>
            <p className={`mt-1 text-xl font-semibold ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Buscar ${T.apresentacao.singular}, ${T.grupo.singular} ou categoria`}
          className="min-w-0 flex-1 rounded-lg border border-axon-border bg-axon-panel px-3 py-2 text-sm text-white outline-none focus:border-axon-gold sm:max-w-sm" />
        {["todos", ...SITUACOES].map((s) => (
          <button key={s} type="button" onClick={() => setFiltro(s)}
            className={`rounded-full px-3 py-1 text-xs ${filtro === s ? "bg-axon-gold/15 text-axon-gold" : "text-gray-400 hover:text-white"}`}>
            {s === "todos" ? "Todas" : s}
          </button>
        ))}
      </div>

      {erro && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erro}</p>}

      <div className="overflow-hidden rounded-xl border border-axon-border bg-axon-panel">
        {visiveis.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">{linhas.length ? "Nada neste filtro." : "Nenhuma inscrição ainda."}</p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {visiveis.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                <span className="hidden w-8 shrink-0 text-xs text-gray-500 sm:block">{l.ordem ?? "—"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{l.nome}</p>
                  <p className="text-xs text-gray-400">{l.grupo} · {l.categoria ?? "Sem categoria"} · {perfil.formacoes[l.tipo]} · {l.elenco} {l.elenco === 1 ? "pessoa" : "pessoas"}</p>
                  {(l.arquivos.recusados > 0 || l.arquivos.analise > 0) && (
                    <p className="mt-0.5 text-xs">
                      {l.arquivos.analise > 0 && <span className="text-sky-300">{l.arquivos.analise} arquivo(s) em análise </span>}
                      {l.arquivos.recusados > 0 && <span className="text-red-300">{l.arquivos.recusados} recusado(s)</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm font-semibold tabular-nums text-white">{brl(l.valor)}</span>
                  <div className="flex items-center gap-1.5">
                    {salvando === l.id && <Loader2 size={13} className="animate-spin text-gray-400" />}
                    <select aria-label={`Pagamento de ${l.nome}`} value={situacao(l)} disabled={salvando === l.id} onChange={(e) => mudar(l, e.target.value)}
                      className={`rounded-full border px-3 py-1 text-xs outline-none ${cor(situacao(l))}`}>
                      {SITUACOES.map((s) => <option key={s} value={s} className="bg-axon-panel text-white">{s}</option>)}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-gray-500">O pagamento online pela plataforma ainda não está ativo: por enquanto, combine o pagamento com os grupos e marque aqui.</p>
    </div>
  );
}
