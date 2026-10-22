"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

export interface LinhaVenda {
  id: string;
  venda_id: string;
  produto_nome: string;
  quantidade: number;
  total: number;
  forma: string;
  operador: string;
  evento_id: string | null;
  created_at: string;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NOME_FORMA: Record<string, string> = { dinheiro: "Dinheiro", pix: "PIX", cartao: "Cartão" };
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const campo = "rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white outline-none focus:border-axon-gold";

function somarPor(vendas: LinhaVenda[], chave: (v: LinhaVenda) => string) {
  const m = new Map<string, { qtd: number; total: number }>();
  for (const v of vendas) {
    const k = chave(v);
    const a = m.get(k) ?? { qtd: 0, total: 0 };
    m.set(k, { qtd: a.qtd + v.quantidade, total: a.total + v.total });
  }
  return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
}

function Tabela({ titulo, linhas }: { titulo: string; linhas: [string, { qtd: number; total: number }][] }) {
  return (
    <section className="rounded-xl border border-axon-border bg-axon-panel">
      <h3 className="border-b border-axon-border px-4 py-3 text-sm font-medium text-white">{titulo}</h3>
      {linhas.length === 0 ? <p className="px-4 py-4 text-sm text-gray-500">Sem vendas.</p> : (
        <table className="w-full text-sm">
          <tbody>
            {linhas.map(([k, v]) => (
              <tr key={k} className="border-t border-axon-border/60 first:border-0">
                <td className="px-4 py-2 text-gray-300">{k}</td>
                <td className="px-2 py-2 text-right tabular-nums text-gray-400">{v.qtd}</td>
                <td className="px-4 py-2 text-right tabular-nums text-white">{brl(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function Vendas({ vendas, eventos, filtros }: {
  vendas: LinhaVenda[];
  eventos: { id: string; nome: string }[];
  filtros: { evento: string; de: string; ate: string };
}) {
  const router = useRouter();
  const [f, setF] = useState(filtros);
  const nomeEvento = (id: string | null) => (id ? eventos.find((e) => e.id === id)?.nome ?? "—" : "Avulsa");

  const aplicar = () => {
    const q = new URLSearchParams({ aba: "vendas", de: f.de, ate: f.ate, ...(f.evento ? { evento: f.evento } : {}) });
    router.push(`/pdv?${q}`);
  };

  const total = vendas.reduce((s, v) => s + v.total, 0);
  const atendimentos = useMemo(() => {
    const m = new Map<string, { quando: string; itens: string[]; total: number; forma: string; operador: string; evento: string | null }>();
    for (const v of vendas) {
      const a = m.get(v.venda_id) ?? { quando: v.created_at, itens: [], total: 0, forma: v.forma, operador: v.operador, evento: v.evento_id };
      a.itens.push(`${v.quantidade}× ${v.produto_nome}`);
      a.total += v.total;
      m.set(v.venda_id, a);
    }
    return [...m.values()];
  }, [vendas]);

  const exportar = () => {
    const linhas = [["Data", "Evento", "Produto", "Quantidade", "Total", "Pagamento", "Operador"],
      ...vendas.map((v) => [dataHora(v.created_at), nomeEvento(v.evento_id), v.produto_nome, v.quantidade, v.total.toFixed(2).replace(".", ","), NOME_FORMA[v.forma] ?? v.forma, v.operador])];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `vendas_${filtros.de}_a_${filtros.ate}.csv`;
    a.click();
  };


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-gray-400">Evento<br />
          <select value={f.evento} onChange={(e) => setF({ ...f, evento: e.target.value })} className={`${campo} mt-1 min-w-[200px]`}>
            <option value="">Todos</option>
            <option value="avulsa">Vendas avulsas (sem evento)</option>
            {eventos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400">De<br /><input type="date" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} className={`${campo} mt-1`} style={{ colorScheme: "dark" }} /></label>
        <label className="text-xs text-gray-400">Até<br /><input type="date" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} className={`${campo} mt-1`} style={{ colorScheme: "dark" }} /></label>
        <button type="button" onClick={aplicar} className="rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black">Filtrar</button>
        <button type="button" onClick={exportar} disabled={!vendas.length} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 disabled:opacity-40"><Download size={14} /> Planilha</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { t: "Total vendido", v: brl(total) },
          { t: "Atendimentos", v: String(atendimentos.length) },
          { t: "Ticket médio", v: brl(atendimentos.length ? total / atendimentos.length : 0) },
          { t: "Itens", v: String(vendas.reduce((s, v) => s + v.quantidade, 0)) },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border border-axon-border bg-axon-panel p-4">
            <p className="text-xs text-gray-400">{k.t}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-white">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Tabela titulo="Por forma de pagamento" linhas={somarPor(vendas, (v) => NOME_FORMA[v.forma] ?? v.forma)} />
        <Tabela titulo="Por produto" linhas={somarPor(vendas, (v) => v.produto_nome)} />
        <Tabela titulo="Por operador" linhas={somarPor(vendas, (v) => v.operador)} />
      </div>

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h3 className="border-b border-axon-border px-4 py-3 text-sm font-medium text-white">Atendimentos{atendimentos.length > 200 ? " (200 mais recentes)" : ""}</h3>
        {atendimentos.length === 0 ? <p className="px-4 py-6 text-sm text-gray-500">Nenhuma venda no período.</p> : (
          <ul className="divide-y divide-axon-border">
            {atendimentos.slice(0, 200).map((a, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-28 shrink-0 text-xs text-gray-500">{dataHora(a.quando)}</span>
                <span className="min-w-0 flex-1 truncate text-gray-200">{a.itens.join(", ")}</span>
                <span className="text-xs text-gray-500">{nomeEvento(a.evento)} · {a.operador} · {NOME_FORMA[a.forma] ?? a.forma}</span>
                <span className="w-24 text-right font-semibold tabular-nums text-white">{brl(a.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
