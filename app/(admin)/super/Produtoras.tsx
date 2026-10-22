"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { NOME_FASE, type Fase } from "@/lib/planos";

export interface LinhaProdutora {
  id: string;
  nome: string;
  email: string | null;
  demonstracao: boolean;
  eventos: number;
  fase: Fase;
  ate: string | null;
  diasRestantes: number | null;
  caixaVendido: number;
  caixaTaxa: number;
  caixaIsento: boolean;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COR = {
  pro: "text-emerald-300", start: "text-axon-gold", leitura: "text-orange-300", expirado: "text-red-300",
} as const;

function Acoes({ p }: { p: LinhaProdutora }) {
  const router = useRouter();
  const [ate, setAte] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (acao: string) => {
    if (acao === "reiniciar_start" && !window.confirm(`Reiniciar o período gratuito de ${p.nome} a partir de hoje?`)) return;
    setOcupado(true);
    setErro(null);
    const res = await fetch(apiUrl("/api/super/produtoras"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, acao, ate: ate || null }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) setErro(json.error ?? "Falha.");
    setOcupado(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label={`Pro até (${p.nome})`}
        className="rounded-lg border border-axon-border bg-axon-bg px-2 py-1.5 text-xs text-white outline-none" />
      <button type="button" disabled={ocupado} onClick={() => enviar("pro")}
        className="rounded-lg border border-emerald-400/30 px-2.5 py-1.5 text-xs text-emerald-300 disabled:opacity-40">
        {p.fase === "pro" ? "Alterar Pro" : "Ativar Pro"}
      </button>
      {p.fase === "pro" && (
        <button type="button" disabled={ocupado} onClick={() => enviar("start")} className="rounded-lg border border-axon-border px-2.5 py-1.5 text-xs text-gray-300 disabled:opacity-40">Voltar ao Start</button>
      )}
      {(p.fase === "leitura" || p.fase === "expirado") && (
        <button type="button" disabled={ocupado} onClick={() => enviar("reiniciar_start")} className="rounded-lg border border-axon-border px-2.5 py-1.5 text-xs text-gray-300 disabled:opacity-40">Reiniciar Start</button>
      )}
      {ocupado && <Loader2 size={13} className="animate-spin text-gray-400" />}
      {erro && <span className="text-xs text-red-300">{erro}</span>}
    </div>
  );
}

export function Produtoras({ linhas }: { linhas: LinhaProdutora[] }) {
  const totalTaxa = linhas.reduce((s, l) => s + l.caixaTaxa, 0);
  return (
    <section className="rounded-xl border border-axon-border bg-axon-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-axon-border px-6 py-4">
        <div className="flex items-start gap-3">
          <Building2 size={18} className="mt-0.5 text-axon-gold" />
          <div>
            <h2 className="font-semibold text-white">Produtoras</h2>
            <p className="text-xs text-gray-500">Plano de cada assinante e taxa do caixa no mês atual. Deixe a data vazia para Pro sem vencimento.</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">Taxas de caixa do mês: <strong className="text-white">{brl(totalTaxa)}</strong></p>
      </div>
      {linhas.length === 0 ? (
        <p className="px-6 py-8 text-sm text-gray-400">Nenhuma produtora cadastrada.</p>
      ) : (
        <ul className="divide-y divide-axon-border">
          {linhas.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-white">
                  {p.nome} {p.demonstracao && <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">demonstração</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {p.email ?? "sem e-mail"} · {p.eventos} {p.eventos === 1 ? "evento" : "eventos"} ·{" "}
                  <span className={COR[p.fase]}>{NOME_FASE[p.fase]}</span>
                  {p.ate && ` até ${new Date(p.ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}
                  {p.diasRestantes !== null && p.fase !== "pro" && ` (${p.diasRestantes} dias)`}
                </p>
                <p className="text-xs text-gray-500">
                  Caixa no mês: {brl(p.caixaVendido)} → {p.caixaIsento ? "isento" : `taxa ${brl(p.caixaTaxa)}`}
                </p>
              </div>
              <Acoes p={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
