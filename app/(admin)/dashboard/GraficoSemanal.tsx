"use client";

import { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";

export interface PontoSemana { rotulo: string; periodo: string; valor: number }

// Barras semanais de uma única série (sem legenda: o título nomeia a série).
// Passar o mouse/tocar mostra o valor; "Tabela" mostra os mesmos números em texto.
export function GraficoSemanal({ titulo, pontos, formatar }: {
  titulo: string;
  pontos: PontoSemana[];
  formatar: "numero" | "moeda";
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [tabela, setTabela] = useState(false);
  const fmt = (v: number) =>
    formatar === "moeda" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : v.toLocaleString("pt-BR");

  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const total = pontos.reduce((s, p) => s + p.valor, 0);
  const L = 600, A = 200, topo = 18, base = A - 26;
  const passo = L / pontos.length;
  const largura = Math.max(6, Math.min(28, passo - 8));
  const y = (v: number) => base - ((base - topo) * v) / max;

  return (
    <section className="rounded-xl border border-axon-border bg-axon-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">{titulo}</h3>
          <p className="mt-0.5 text-xs text-gray-500">Últimas {pontos.length} semanas · total {fmt(total)}</p>
        </div>
        <button type="button" onClick={() => setTabela((t) => !t)}
          className="inline-flex items-center gap-1.5 rounded-md border border-axon-border px-2 py-1 text-xs text-gray-400 hover:text-white">
          {tabela ? <BarChart3 size={12} /> : <Table2 size={12} />} {tabela ? "Gráfico" : "Tabela"}
        </button>
      </div>

      {tabela ? (
        <table className="mt-4 w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-500"><th className="py-1 font-normal">Semana</th><th className="py-1 text-right font-normal">{titulo}</th></tr></thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.periodo} className="border-t border-axon-border/60"><td className="py-1.5 text-gray-300">{p.periodo}</td><td className="py-1.5 text-right tabular-nums text-white">{fmt(p.valor)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${L} ${A}`} className="h-48 w-full" role="img" aria-label={`${titulo} por semana`} onMouseLeave={() => setAtivo(null)}>
            {[0.5, 1].map((f) => (
              <g key={f}>
                <line x1={0} x2={L} y1={y(max * f)} y2={y(max * f)} stroke="currentColor" className="text-white/[0.06]" strokeWidth={1} />
                <text x={0} y={y(max * f) - 5} className="fill-gray-500" fontSize={14}>{fmt(Math.round(max * f))}</text>
              </g>
            ))}
            <line x1={0} x2={L} y1={base} y2={base} stroke="currentColor" className="text-white/15" strokeWidth={1} />
            {pontos.map((p, i) => {
              const cx = i * passo + passo / 2;
              const h = base - y(p.valor);
              return (
                <g key={p.periodo} onMouseEnter={() => setAtivo(i)} onClick={() => setAtivo(i)}>
                  <rect x={i * passo} y={topo} width={passo} height={base - topo} fill="transparent" />
                  {p.valor > 0 && (
                    <path
                      d={`M${cx - largura / 2},${base} V${base - h + Math.min(4, h)} q0,-${Math.min(4, h)} ${Math.min(4, largura / 2)},-${Math.min(4, h)} H${cx + largura / 2 - Math.min(4, largura / 2)} q${Math.min(4, largura / 2)},0 ${Math.min(4, largura / 2)},${Math.min(4, h)} V${base} Z`}
                      className={ativo === null || ativo === i ? "fill-axon-gold" : "fill-axon-gold/40"}
                    />
                  )}
                  {((pontos.length - 1 - i) % 3 === 0 || pontos.length <= 6) && (
                    <text x={cx} y={A - 6} textAnchor="middle" fontSize={14} className="fill-gray-500">{p.rotulo}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {ativo !== null && (
            <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-xs shadow-lg"
              style={{ left: `${((ativo + 0.5) / pontos.length) * 100}%` }}>
              <p className="text-gray-400">{pontos[ativo].periodo}</p>
              <p className="font-semibold tabular-nums text-white">{fmt(pontos[ativo].valor)}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
