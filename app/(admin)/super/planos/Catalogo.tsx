"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

export interface ItemCatalogo {
  id: string; tipo: "plano" | "pacote"; codigo: string | null; nome: string; descricao: string | null; preco: number | null;
  periodo: "mensal" | "anual" | "unico" | "gratis"; detalhe: string | null; itens: string[]; nota: string | null;
  cta_texto: string | null; cta_link: string | null; destaque: boolean; ativo: boolean; ordem: number;
}

const PERIODOS = { mensal: "por mês", anual: "por ano", unico: "pagamento único", gratis: "grátis" };
const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Formulario({ item, tipo, onFechar, onSalvo }: { item: ItemCatalogo | null; tipo: "plano" | "pacote"; onFechar: () => void; onSalvo: () => void }) {
  const [f, setF] = useState({
    tipo: item?.tipo ?? tipo, nome: item?.nome ?? "", descricao: item?.descricao ?? "",
    preco: item?.preco === null || item?.preco === undefined ? "" : String(item.preco).replace(".", ","),
    periodo: item?.periodo ?? (tipo === "pacote" ? "unico" : "mensal"), detalhe: item?.detalhe ?? "",
    itens: (item?.itens ?? []).join("\n"), nota: item?.nota ?? "", cta_texto: item?.cta_texto ?? "", cta_link: item?.cta_link ?? "",
    destaque: item?.destaque ?? false, ativo: item?.ativo ?? true, ordem: String(item?.ordem ?? 0),
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const preco = f.periodo === "gratis" ? 0 : f.preco.trim() === "" ? null : Number(f.preco.replace(/\./g, "").replace(",", "."));
    const res = await fetch(apiUrl("/api/super/planos"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "salvar", id: item?.id, plano: { ...f, preco, itens: f.itens.split("\n"), ordem: Number(f.ordem) } }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSalvando(false);
    if (!res.ok) return setErro(json.error ?? "Falha ao salvar.");
    onSalvo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">{item ? `Editar ${f.tipo}` : f.tipo === "plano" ? "Novo plano" : "Novo pacote"}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs text-gray-400">Nome</span><input required value={f.nome} onChange={(e) => set("nome", e.target.value)} maxLength={80} className={`${campo} mt-1.5`} /></label>
            <label className="block"><span className="text-xs text-gray-400">Cobrança</span>
              <select value={f.periodo} onChange={(e) => set("periodo", e.target.value as typeof f.periodo)} className={`${campo} mt-1.5`}>
                {Object.entries(PERIODOS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </label>
            {f.periodo !== "gratis" && (
              <label className="block"><span className="text-xs text-gray-400">Preço (R$) — vazio = sob consulta</span>
                <input inputMode="decimal" value={f.preco} onChange={(e) => set("preco", e.target.value.replace(/[^\d,.]/g, ""))} placeholder="Sob consulta" className={`${campo} mt-1.5`} /></label>
            )}
            <label className="block"><span className="text-xs text-gray-400">Texto ao lado do preço</span><input value={f.detalhe} onChange={(e) => set("detalhe", e.target.value)} maxLength={80} placeholder="Ex.: por 3 meses" className={`${campo} mt-1.5`} /></label>
          </div>
          <label className="block"><span className="text-xs text-gray-400">Descrição curta</span><input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} maxLength={300} className={`${campo} mt-1.5`} /></label>
          <label className="block"><span className="text-xs text-gray-400">O que inclui (um item por linha)</span>
            <textarea rows={5} value={f.itens} onChange={(e) => set("itens", e.target.value)} className={`${campo} mt-1.5 resize-y`} /></label>
          <p className="text-[11px] text-gray-500">Use {"{taxa}"}, {"{caixa}"}, {"{isencao}"}, {"{mesesStart}"} e {"{mesesGuarda}"} para mostrar os valores atuais das taxas.</p>
          <label className="block"><span className="text-xs text-gray-400">Observação (rodapé do cartão)</span><input value={f.nota} onChange={(e) => set("nota", e.target.value)} maxLength={400} className={`${campo} mt-1.5`} /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-xs text-gray-400">Texto do botão</span><input value={f.cta_texto} onChange={(e) => set("cta_texto", e.target.value)} maxLength={40} placeholder="Ex.: Contratar" className={`${campo} mt-1.5`} /></label>
            <label className="block"><span className="text-xs text-gray-400">Link do botão</span><input value={f.cta_link} onChange={(e) => set("cta_link", e.target.value)} placeholder="/contato?assunto=pro" className={`${campo} mt-1.5`} /></label>
            <label className="block"><span className="text-xs text-gray-400">Ordem</span><input inputMode="numeric" value={f.ordem} onChange={(e) => set("ordem", e.target.value.replace(/\D/g, ""))} className={`${campo} mt-1.5`} /></label>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-gray-200">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.ativo} onChange={(e) => set("ativo", e.target.checked)} className="accent-[#d4af37]" /> Mostrar no site</label>
            {f.tipo === "plano" && <label className="flex items-center gap-2"><input type="checkbox" checked={f.destaque} onChange={(e) => set("destaque", e.target.checked)} className="accent-[#d4af37]" /> Destacar</label>}
          </div>
          {item?.codigo && <p className="text-xs text-amber-300">Este é o plano {item.codigo === "start" ? "Start" : "Pro"}: ele também controla o acesso das produtoras (período gratuito / assinatura).</p>}
          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300">Cancelar</button>
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando && <Loader2 size={15} className="animate-spin" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export function Catalogo({ itens }: { itens: ItemCatalogo[] }) {
  const router = useRouter();
  const [form, setForm] = useState<{ item: ItemCatalogo | null; tipo: "plano" | "pacote" } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const excluir = async (i: ItemCatalogo) => {
    if (!window.confirm(`Excluir “${i.nome}”?`)) return;
    const res = await fetch(apiUrl("/api/super/planos"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "excluir", id: i.id }) });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setErro(res.ok ? null : json.error ?? "Falha.");
    router.refresh();
  };

  const preco = (i: ItemCatalogo) => i.periodo === "gratis" || i.preco === 0 ? "Grátis" : i.preco === null ? "Sob consulta" : `${brl(i.preco)} ${PERIODOS[i.periodo]}`;

  return (
    <div className="space-y-4">
      {erro && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
      {(["plano", "pacote"] as const).map((tipo) => {
        const lista = itens.filter((i) => i.tipo === tipo);
        return (
          <section key={tipo} className="rounded-xl border border-axon-border bg-axon-panel">
            <div className="flex items-center justify-between border-b border-axon-border px-5 py-3.5">
              <h3 className="flex items-center gap-2 font-semibold text-white">{tipo === "plano" ? <Star size={16} className="text-axon-gold" /> : <Package size={16} className="text-axon-gold" />} {tipo === "plano" ? "Planos" : "Pacotes avulsos"}</h3>
              <button type="button" onClick={() => setForm({ item: null, tipo })} className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3 py-1.5 text-sm font-semibold text-black"><Plus size={14} /> {tipo === "plano" ? "Plano" : "Pacote"}</button>
            </div>
            {lista.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">{tipo === "plano" ? "Nenhum plano." : "Nenhum pacote. Ex.: suporte no dia do evento, evento extra, treinamento da equipe."}</p>
            ) : (
              <ul className="divide-y divide-axon-border">
                {lista.map((i) => (
                  <li key={i.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${i.ativo ? "" : "opacity-50"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{i.nome} {i.destaque && <span className="ml-1 text-xs text-axon-gold">destaque</span>} {!i.ativo && <span className="ml-1 text-xs text-gray-500">oculto</span>}</p>
                      <p className="text-xs text-gray-400">{preco(i)}{i.detalhe ? ` · ${i.detalhe}` : ""} · {i.itens.length} item(ns)</p>
                    </div>
                    <button type="button" onClick={() => setForm({ item: i, tipo })} title="Editar" className="rounded-lg p-2 text-gray-400 hover:text-white"><Pencil size={14} /></button>
                    {!i.codigo && <button type="button" onClick={() => excluir(i)} title="Excluir" className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {form && <Formulario item={form.item} tipo={form.tipo} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); router.refresh(); }} />}
    </div>
  );
}
