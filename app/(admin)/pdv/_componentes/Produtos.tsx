"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Eye, EyeOff, Loader2, Pencil, Plus, Ticket, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ProdutoPainel {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  tipo: "cantina" | "bilheteria";
  ativo: boolean;
  ordem: number | null;
  descricao: string | null;
  vitrine: string[]; // eventos em cuja página o produto aparece
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const SUGESTOES = { cantina: ["Bebidas", "Salgados", "Doces", "Lanches", "Lembranças"], bilheteria: ["Ingressos", "Meia-entrada", "Pacotes", "VIP"] };
const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

function Formulario({ produto, tipoInicial, eventos, produtoraId, onFechar, onSalvo }: {
  produto: ProdutoPainel | null;
  tipoInicial: ProdutoPainel["tipo"];
  eventos: { id: string; nome: string }[];
  produtoraId: string;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [f, setF] = useState({
    nome: produto?.nome ?? "",
    tipo: produto?.tipo ?? tipoInicial,
    categoria: produto?.categoria ?? "",
    preco: produto ? String(produto.preco).replace(".", ",") : "",
    descricao: produto?.descricao ?? "",
    ativo: produto?.ativo ?? true,
  });
  const [vitrine, setVitrine] = useState<Set<string>>(new Set(produto?.vitrine ?? []));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const preco = Number(f.preco.replace(/\./g, "").replace(",", "."));
    if (!f.nome.trim()) return setErro("Informe o nome.");
    if (!Number.isFinite(preco) || preco < 0) return setErro("Preço inválido.");
    setSalvando(true);
    setErro(null);
    const supabase = createClient();
    const dados = {
      nome: f.nome.trim(), tipo: f.tipo, categoria: f.categoria.trim() || "Outros", preco,
      descricao: f.descricao.trim() || null, ativo: f.ativo, produtora_id: produtoraId,
    };
    const { data, error } = produto
      ? await supabase.from("pdv_produtos").update(dados).eq("id", produto.id).select("id").single()
      : await supabase.from("pdv_produtos").insert(dados).select("id").single();
    if (error || !data) { setErro(error?.message ?? "Não foi possível salvar."); setSalvando(false); return; }

    // Vitrine: liga/desliga o produto na página pública de cada evento
    const antes = new Set(produto?.vitrine ?? []);
    for (const ev of eventos) {
      const quer = vitrine.has(ev.id);
      if (quer === antes.has(ev.id)) continue;
      const { error: vErr } = quer
        ? await supabase.from("evento_produtos").upsert({ evento_id: ev.id, produto_id: data.id, ativo_evento: true }, { onConflict: "evento_id,produto_id" })
        : await supabase.from("evento_produtos").delete().eq("evento_id", ev.id).eq("produto_id", data.id);
      if (vErr) { setErro(vErr.message); setSalvando(false); return; }
    }
    onSalvo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">{produto ? "Editar produto" : "Novo produto"}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-2">
            {(["cantina", "bilheteria"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm ${f.tipo === t ? "border-axon-gold bg-axon-gold/10 text-axon-gold" : "border-axon-border text-gray-400"}`}>
                {t === "cantina" ? <Coffee size={15} /> : <Ticket size={15} />} {t === "cantina" ? "Caixa" : "Bilheteria"}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">Nome</span>
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={120} className={`${campo} mt-1.5`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-400">Preço (R$)</span>
              <input required inputMode="decimal" value={f.preco} onChange={(e) => setF({ ...f, preco: e.target.value.replace(/[^\d,.]/g, "") })} placeholder="0,00" className={`${campo} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Categoria</span>
              <input list={`sugestoes-${f.tipo}`} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} maxLength={40} className={`${campo} mt-1.5`} />
              <datalist id={`sugestoes-${f.tipo}`}>{SUGESTOES[f.tipo].map((s) => <option key={s} value={s} />)}</datalist>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">Descrição (aparece na página do evento)</span>
            <textarea rows={2} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} maxLength={300} className={`${campo} mt-1.5 resize-y`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} className="accent-[#d4af37]" />
            Disponível para venda
          </label>
          {eventos.length > 0 && (
            <div>
              <p className="text-xs text-gray-400">Mostrar na página pública dos eventos</p>
              <div className="mt-2 space-y-1.5">
                {eventos.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 text-sm text-gray-200">
                    <input type="checkbox" checked={vitrine.has(ev.id)} className="accent-[#d4af37]"
                      onChange={(e) => { const s = new Set(vitrine); if (e.target.checked) s.add(ev.id); else s.delete(ev.id); setVitrine(s); }} />
                    {ev.nome}
                  </label>
                ))}
              </div>
            </div>
          )}
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

export function Produtos({ produtos, eventos, produtoraId, podeEditar }: {
  produtos: ProdutoPainel[];
  eventos: { id: string; nome: string }[];
  produtoraId: string;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<{ produto: ProdutoPainel | null; tipo: ProdutoPainel["tipo"] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const alternar = async (p: ProdutoPainel) => {
    const { error } = await createClient().from("pdv_produtos").update({ ativo: !p.ativo }).eq("id", p.id);
    setErro(error?.message ?? null);
    router.refresh();
  };
  const excluir = async (p: ProdutoPainel) => {
    if (!window.confirm(`Excluir “${p.nome}”? As vendas já feitas continuam no relatório. Para só tirar do caixa, use “desativar”.`)) return;
    const { error } = await createClient().from("pdv_produtos").delete().eq("id", p.id);
    setErro(error?.message ?? null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {!podeEditar && <p className="rounded-lg border border-axon-border px-4 py-3 text-sm text-gray-400">Somente a gestão da produtora altera produtos.</p>}
      {erro && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erro}</p>}
      {(["cantina", "bilheteria"] as const).map((tipo) => {
        const lista = produtos.filter((p) => p.tipo === tipo);
        return (
          <section key={tipo} className="rounded-xl border border-axon-border bg-axon-panel">
            <div className="flex items-center justify-between border-b border-axon-border px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                {tipo === "cantina" ? <Coffee size={16} className="text-axon-gold" /> : <Ticket size={16} className="text-axon-gold" />}
                {tipo === "cantina" ? "Caixa (cantina e lojinha)" : "Bilheteria"} <span className="text-sm font-normal text-gray-500">({lista.length})</span>
              </h2>
              {podeEditar && (
                <button type="button" onClick={() => setForm({ produto: null, tipo })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3 py-1.5 text-sm font-semibold text-black"><Plus size={14} /> Produto</button>
              )}
            </div>
            {lista.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">Nenhum produto. {tipo === "bilheteria" ? "Cadastre os ingressos (inteira, meia…)." : "Cadastre o que será vendido no caixa."}</p>
            ) : (
              <ul className="divide-y divide-axon-border">
                {lista.map((p) => (
                  <li key={p.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${p.ativo ? "" : "opacity-50"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{p.nome}</p>
                      <p className="text-xs text-gray-500">
                        {p.categoria || "Outros"}{p.ativo ? "" : " · desativado"}
                        {p.vitrine.length > 0 && ` · na página de ${p.vitrine.length} evento(s)`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-white">{brl(p.preco)}</span>
                    {podeEditar && (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => alternar(p)} title={p.ativo ? "Desativar" : "Ativar"} className="rounded-lg p-2 text-gray-400 hover:text-white">{p.ativo ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                        <button type="button" onClick={() => setForm({ produto: p, tipo })} title="Editar" className="rounded-lg p-2 text-gray-400 hover:text-white"><Pencil size={15} /></button>
                        <button type="button" onClick={() => excluir(p)} title="Excluir" className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {form && (
        <Formulario produto={form.produto} tipoInicial={form.tipo} eventos={eventos} produtoraId={produtoraId}
          onFechar={() => setForm(null)} onSalvo={() => { setForm(null); router.refresh(); }} />
      )}
    </div>
  );
}
