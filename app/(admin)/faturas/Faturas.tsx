"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock, CreditCard, Loader2, Receipt } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

export interface FaturaLinha {
  id: string;
  descricao: string;
  valor: number;
  status: "aberta" | "paga" | "cancelada";
  vencimento: string;
  criadaEm: string;
  pagaEm: string | null;
  forma: string | null;
  periodo: [string | null, string | null];
  itens: { descricao: string; valor: number }[];
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("pt-BR");
const hoje = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

export function Faturas({ faturas, bloqueado, diasBloqueio, retorno, modoTeste }: {
  faturas: FaturaLinha[]; bloqueado: boolean; diasBloqueio: number; retorno: string | null; modoTeste: boolean;
}) {
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(faturas.find((f) => f.status === "aberta")?.id ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const emAberto = faturas.filter((f) => f.status === "aberta");
  const totalAberto = emAberto.reduce((s, f) => s + f.valor, 0);

  const pagar = async (id: string) => {
    setErro(null);
    setAbrindo(id);
    const res = await fetch(apiUrl("/api/faturas"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "pagar", id }) });
    const json = (await res.json().catch(() => ({}))) as { link?: string; error?: string };
    setAbrindo(null);
    if (!res.ok || !json.link) return setErro(json.error ?? "Não foi possível abrir o pagamento.");
    window.location.assign(json.link);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Faturas do ARXUM</h1>
        <p className="mt-1 text-sm text-gray-400">
          Mensalidade do plano e taxas de uso. Ingressos são cobrados todo mês; inscrições e caixa, no dia seguinte ao fim de cada evento.
          A fatura vence 5 dias após gerada; sem pagamento, o painel é suspenso {diasBloqueio} dias após o vencimento.
        </p>
      </div>

      {modoTeste && <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Modo de teste do Mercado Pago: os pagamentos não são reais.</p>}
      {bloqueado && (
        <p className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          <strong className="text-white">Painel suspenso por fatura em atraso.</strong> Pague abaixo: a confirmação chega em instantes e o painel volta na hora.
          A página pública dos eventos, o caixa, os jurados e os grupos continuam funcionando.
        </p>
      )}
      {retorno === "approved" && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Pagamento aprovado. A baixa aparece aqui em instantes (atualize a página).</p>}
      {(retorno === "pending" || retorno === "in_process") && <p className="rounded-lg border border-axon-gold/30 bg-axon-gold/10 px-4 py-3 text-sm text-axon-gold">Pagamento em processamento (boleto pode levar até 3 dias úteis). A baixa é automática.</p>}
      {erro && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erro}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-axon-border bg-axon-panel p-4">
          <p className="text-xs text-gray-400">Em aberto</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${totalAberto ? "text-white" : "text-gray-500"}`}>{brl(totalAberto)}</p>
        </div>
        <div className="rounded-xl border border-axon-border bg-axon-panel p-4">
          <p className="text-xs text-gray-400">Faturas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{faturas.length}</p>
        </div>
      </div>

      {faturas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-12 text-center text-sm text-gray-400">
          <Receipt size={22} className="mx-auto mb-2 text-gray-500" /> Nenhuma fatura ainda.
        </p>
      ) : (
        <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
          {faturas.map((f) => {
            const vencida = f.status === "aberta" && f.vencimento < hoje();
            return (
              <li key={f.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <button type="button" onClick={() => setAberta(aberta === f.id ? null : f.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown size={15} className={`shrink-0 text-gray-500 transition-transform ${aberta === f.id ? "rotate-180" : ""}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{f.descricao}</span>
                      <span className="block text-xs text-gray-500">
                        {f.status === "paga" ? `Paga em ${data(f.pagaEm!)}${f.forma ? ` · ${f.forma}` : ""}` : f.status === "cancelada" ? "Cancelada" : `Vence em ${data(f.vencimento)}`}
                      </span>
                    </span>
                  </button>
                  <span className="text-sm font-semibold tabular-nums text-white">{brl(f.valor)}</span>
                  {f.status === "paga" && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 px-2.5 py-0.5 text-xs text-emerald-300"><CheckCircle2 size={12} /> Paga</span>}
                  {f.status === "cancelada" && <span className="rounded-full border border-axon-border px-2.5 py-0.5 text-xs text-gray-400">Cancelada</span>}
                  {f.status === "aberta" && (
                    <>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${vencida ? "border-red-400/40 text-red-300" : "border-axon-gold/30 text-axon-gold"}`}><Clock size={12} /> {vencida ? "Vencida" : "Em aberto"}</span>
                      <button type="button" onClick={() => pagar(f.id)} disabled={abrindo !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50">
                        {abrindo === f.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />} Pagar
                      </button>
                    </>
                  )}
                </div>
                {aberta === f.id && (
                  <ul className="space-y-1 border-t border-axon-border bg-axon-bg/40 px-5 py-3 text-xs">
                    {f.periodo[0] && <li className="text-gray-500">Período: {data(f.periodo[0])}{f.periodo[1] && f.periodo[1] !== f.periodo[0] ? ` a ${data(f.periodo[1])}` : ""}</li>}
                    {f.itens.map((i) => (
                      <li key={i.descricao} className="flex justify-between gap-4 text-gray-300"><span>{i.descricao}</span><span className="tabular-nums">{brl(i.valor)}</span></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-gray-500">Pagamento por Pix, boleto ou cartão, pelo Mercado Pago. A baixa é automática.</p>
    </div>
  );
}
