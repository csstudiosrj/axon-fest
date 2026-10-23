"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

// Plano da produtora: o Pro (com ou sem validade) libera o acesso pago; o plano do
// catálogo registra qual oferta comercial ela contratou
export function PlanoProdutora({ id, nome, plano, proAte, planoCatalogo, catalogo }: {
  id: string; nome: string; plano: string; proAte: string | null; planoCatalogo: string | null; catalogo: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [ate, setAte] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (corpo: Record<string, unknown>) => {
    if (corpo.acao === "start" && !window.confirm(`Voltar ${nome} ao plano Start?`)) return;
    setOcupado(true);
    setErro(null);
    const res = await fetch(apiUrl("/api/super/produtoras"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...corpo }) });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) setErro(json.error ?? "Falha.");
    setOcupado(false);
    router.refresh();
  };
  const pro = plano === "pro";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-axon-border pt-3 text-xs">
      <span className={pro ? "text-emerald-300" : "text-axon-gold"}>
        Acesso: {pro ? `Pro${proAte ? ` até ${new Date(proAte).toLocaleDateString("pt-BR")}` : " sem vencimento"}` : "Start (gratuito)"}
      </span>
      <select aria-label={`Plano comercial de ${nome}`} defaultValue="" onChange={(e) => e.target.value && enviar({ acao: "plano_catalogo", plano_catalogo_id: e.target.value === "-" ? null : e.target.value })}
        className="rounded-lg border border-axon-border bg-axon-bg px-2 py-1.5 text-white">
        <option value="">{planoCatalogo ? `Plano: ${planoCatalogo}` : "Definir plano do catálogo"}</option>
        {catalogo.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        {planoCatalogo && <option value="-">— sem plano do catálogo</option>}
      </select>
      <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} aria-label={`Pro até (${nome})`} className="rounded-lg border border-axon-border bg-axon-bg px-2 py-1.5 text-white" />
      <button type="button" disabled={ocupado} onClick={() => enviar({ acao: "pro", ate: ate || null })} className="rounded-lg border border-emerald-400/30 px-2.5 py-1.5 text-emerald-300 disabled:opacity-40">
        {pro ? "Alterar Pro" : "Ativar Pro"}
      </button>
      {pro && <button type="button" disabled={ocupado} onClick={() => enviar({ acao: "start" })} className="rounded-lg border border-axon-border px-2.5 py-1.5 text-gray-300 disabled:opacity-40">Voltar ao Start</button>}
      {!pro && <button type="button" disabled={ocupado} onClick={() => window.confirm(`Reiniciar o período gratuito de ${nome} a partir de hoje?`) && enviar({ acao: "reiniciar_start" })} className="rounded-lg border border-axon-border px-2.5 py-1.5 text-gray-300 disabled:opacity-40">Reiniciar Start</button>}
      {ocupado && <Loader2 size={13} className="animate-spin text-gray-400" />}
      {erro && <span className="text-red-300">{erro}</span>}
    </div>
  );
}
