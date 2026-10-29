"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, QrCode, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/faturas"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as { error?: string; copia?: string; qr?: string | null; expira?: string; status?: string };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

// Pix da fatura no próprio painel: QR Code + copia e cola. Confere o pagamento
// a cada poucos segundos e avisa quando cair (a baixa é automática).
export function PagamentoPix({ faturaId, titulo, valor, onFechar, onPago }: {
  faturaId: string; titulo: string; valor: number; onFechar: () => void; onPago: () => void;
}) {
  const [pix, setPix] = useState<{ copia: string; qr: string | null; expira: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    chamar({ acao: "pix", id: faturaId }).then(
      (r) => setPix({ copia: r.copia!, qr: r.qr ?? null, expira: r.expira! }),
      (e: Error) => setErro(e.message),
    );
  }, [faturaId]);

  // Acompanha o pagamento enquanto a janela está aberta
  useEffect(() => {
    if (!pix || pago) return;
    const t = setInterval(() => {
      chamar({ acao: "situacao", id: faturaId }).then((r) => { if (r.status === "paga") { setPago(true); onPago(); } }, () => {});
    }, 4000);
    return () => clearInterval(t);
  }, [pix, pago, faturaId, onPago]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={onFechar}>
      <div role="dialog" aria-label="Pagar com Pix" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-2xl border border-axon-border bg-axon-panel p-6 text-center">
        <div className="flex items-start justify-between gap-3 text-left">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-white"><QrCode size={18} className="text-axon-gold" /> Pagar com Pix</h2>
            <p className="mt-0.5 text-xs text-gray-400">{titulo}</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-3xl font-bold text-axon-gold">{valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        {pago ? (
          <div className="space-y-2 py-6">
            <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
            <p className="font-semibold text-emerald-200">Pagamento confirmado</p>
            <p className="text-xs text-gray-400">A fatura já está quitada.</p>
          </div>
        ) : erro ? (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{erro}</p>
        ) : !pix ? (
          <Loader2 className="mx-auto my-16 animate-spin text-axon-gold" />
        ) : (
          <>
            {pix.qr
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code Pix" width={240} height={240} className="mx-auto rounded-xl bg-white p-2" />
              : null}
            <button type="button" onClick={() => { void navigator.clipboard.writeText(pix.copia); setCopiado(true); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black">
              {copiado ? <Check size={16} /> : <Copy size={16} />} {copiado ? "Código copiado" : "Copiar código Pix (copia e cola)"}
            </button>
            <p className="flex items-center justify-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Aguardando o pagamento… a confirmação aparece aqui sozinha.</p>
            <p className="text-[11px] text-gray-500">Válido até {new Date(pix.expira).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Depois disso, abra de novo para gerar outro.</p>
          </>
        )}
      </div>
    </div>
  );
}
