"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlugZap, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { confirmar, pedirTexto } from "@/app/_components/Dialogos";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/faturas"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

// Conexão com o Mercado Pago e "gerar agora" (a rotina também roda sozinha todo dia)
export function PainelFaturamento({ configurado, teste }: { configurado: boolean; teste: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const executar = async (acao: string) => {
    setOcupado(acao);
    setMsg(null);
    try {
      const r = await chamar({ acao });
      setMsg({ ok: true, texto: acao === "testar_mp"
        ? `Conectado à conta ${r.conta}${r.teste ? " (modo de teste)" : ""}.`
        : `Rotina executada: ${r.mensais} fatura(s) mensal(is), ${r.eventos} de evento, ${r.avisos} aviso(s) de atraso, ${r.bloqueios} bloqueio(s).` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, texto: (e as Error).message });
    }
    setOcupado(null);
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-axon-border bg-axon-panel px-5 py-3 text-sm">
      <span className={configurado ? "text-emerald-300" : "text-red-300"}>
        Mercado Pago: {configurado ? (teste ? "chave de teste" : "chave de produção") : "não configurado (MERCADOPAGO_ACCESS_TOKEN)"}
      </span>
      <span className="flex-1" />
      <button type="button" disabled={!!ocupado || !configurado} onClick={() => executar("testar_mp")} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-1.5 text-xs text-gray-200 disabled:opacity-40">
        {ocupado === "testar_mp" ? <Loader2 size={13} className="animate-spin" /> : <PlugZap size={13} />} Testar conexão
      </button>
      <button type="button" disabled={!!ocupado} onClick={() => executar("gerar_agora")} className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40">
        {ocupado === "gerar_agora" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Rodar faturamento agora
      </button>
      {msg && <p className={`basis-full text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.texto}</p>}
    </div>
  );
}

export function AcoesFatura({ id, tipo }: { id: string; tipo: "fatura" | "produtora" }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const executar = async (corpo: Record<string, unknown>) => {
    setOcupado(true);
    setErro(null);
    try { await chamar({ id, ...corpo }); router.refresh(); } catch (e) { setErro((e as Error).message); }
    setOcupado(false);
  };
  const botao = "rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40";
  if (tipo === "produtora") {
    return (
      <button type="button" disabled={ocupado} className={`${botao} text-emerald-300`}
        onClick={async () => (await confirmar({ mensagem: "Liberar o painel desta produtora por 7 dias, mesmo com fatura em atraso?", botao: "Liberar", perigo: false })) && executar({ acao: "desbloquear" })}>
        Liberar por 7 dias
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      {ocupado && <Loader2 size={13} className="animate-spin text-gray-400" />}
      <button type="button" disabled={ocupado} className={`${botao} text-emerald-300`}
        onClick={async () => { const obs = await pedirTexto({ titulo: "Baixa manual", mensagem: "Use quando o pagamento foi feito fora do Mercado Pago.", rotulo: "Como foi pago (ex.: Pix direto em 12/11)", botao: "Dar baixa" }); if (obs) await executar({ acao: "marcar_paga", observacao: obs }); }}>
        Dar baixa
      </button>
      <button type="button" disabled={ocupado} className={`${botao} text-red-300`}
        onClick={async () => { const obs = await pedirTexto({ titulo: "Cancelar fatura", rotulo: "Motivo", botao: "Cancelar fatura" }); if (obs) await executar({ acao: "cancelar", observacao: obs }); }}>
        Cancelar
      </button>
      {erro && <span className="text-xs text-red-300">{erro}</span>}
    </span>
  );
}
