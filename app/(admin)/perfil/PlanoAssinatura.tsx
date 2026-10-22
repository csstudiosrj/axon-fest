"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, MessageCircle } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { NOME_FASE } from "@/lib/planos";
import type { ResumoPlano } from "@/lib/planos-servidor";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }) : "—");

const COR_FASE = {
  pro: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  start: "border-axon-gold/30 bg-axon-gold/10 text-axon-gold",
  leitura: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  expirado: "border-red-400/30 bg-red-400/10 text-red-300",
} as const;

export function PlanoAssinatura() {
  const [r, setR] = useState<ResumoPlano | { semProdutora: true } | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/produtora/plano"))
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setR)
      .catch(() => setErro(true));
  }, []);

  return (
    <div className="rounded-2xl border border-axon-border bg-axon-panel p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">Plano & Assinatura</h2>
        {r && "fase" in r && <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${COR_FASE[r.fase]}`}>{NOME_FASE[r.fase]}</span>}
      </div>

      {!r && !erro && <p className="mt-4 flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Carregando…</p>}
      {erro && <p className="mt-4 text-sm text-red-300">Não foi possível carregar o plano agora.</p>}
      {r && "semProdutora" in r && <p className="mt-4 text-sm text-gray-400">Sua conta não está ligada a uma produtora.</p>}

      {r && "fase" in r && (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-gray-300">
            {r.fase === "pro" && (r.ate ? <>Assinatura Pro ativa até <strong className="text-white">{data(r.ate)}</strong>. Todos os dados ficam guardados.</> : "Assinatura Pro ativa. Todos os dados ficam guardados.")}
            {r.fase === "start" && <>Plano gratuito até <strong className="text-white">{data(r.ate)}</strong> ({r.diasRestantes} dias). Depois, a conta fica {r.precos.mesesGuarda} meses em modo leitura e, sem assinatura do Pro, os dados são apagados.</>}
            {r.fase === "leitura" && <>O período gratuito terminou. A conta está em modo leitura até <strong className="text-white">{data(r.ate)}</strong> ({r.diasRestantes} dias). Assine o Pro para continuar usando e manter os dados.</>}
            {r.fase === "expirado" && <>O prazo do modo leitura terminou em {data(r.fimLeitura)}. Fale com a ARXUM para recuperar a conta.</>}
          </p>

          <div className="rounded-xl border border-axon-border bg-axon-bg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Caixa deste mês</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-white">{brl(r.caixa.vendido)}</p>
                <p className="text-xs text-gray-400">vendidos no caixa (dinheiro, maquininha e PIX direto)</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${r.caixa.isento ? "text-emerald-300" : "text-white"}`}>{r.caixa.isento ? "Isento" : brl(r.caixa.taxa)}</p>
                <p className="text-xs text-gray-400">
                  {r.caixa.percentual}% na fatura mensal · isento abaixo de {brl(r.caixa.isencaoAte)}
                </p>
              </div>
            </div>
          </div>

          {r.fase !== "pro" && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-axon-border pt-4">
              <p className="text-gray-300">
                Pro: {r.precos.mensalidadePro ? <strong className="text-white">{brl(r.precos.mensalidadePro)}/mês</strong> : "valor sob consulta"}
              </p>
              <div className="flex gap-2">
                <a href={r.contato.whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3.5 py-2 text-sm font-semibold text-black"><MessageCircle size={14} /> Assinar o Pro</a>
                <a href={`mailto:${r.contato.email}?subject=Assinatura%20Pro`} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3.5 py-2 text-sm text-gray-200"><Mail size={14} /> E-mail</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
