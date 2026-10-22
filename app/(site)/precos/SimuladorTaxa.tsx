"use client";

import { useId, useState } from "react";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SimuladorTaxa({ taxa }: { taxa: number }) {
  const [valor, setValor] = useState(150);
  const [modo, setModo] = useState<"absorver" | "repassar">("repassar");
  const id = useId();

  const tarifa = Math.round(valor * taxa) / 100;
  const inscritoPaga = modo === "repassar" ? valor + tarifa : valor;
  const voceRecebe = modo === "repassar" ? valor : valor - tarifa;

  return (
    <div className="rounded-xl border border-arx-line bg-arx-surface p-6 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-arx-slate">Simule</p>

      <label htmlFor={id} className="mt-6 block text-[14px] text-arx-frost">Valor da inscrição</label>
      <div className="mt-2 flex items-center rounded-md border border-arx-line bg-arx-obsidian focus-within:border-arx-fest/60">
        <span className="pl-4 text-[15px] text-arx-slate">R$</span>
        <input id={id} type="number" inputMode="decimal" min={0} step={10} value={Number.isFinite(valor) ? valor : 0}
          onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-3 text-[16px] tabular-nums text-white outline-none" />
      </div>

      <fieldset className="mt-5">
        <legend className="text-[14px] text-arx-frost">A taxa de {taxa}% fica com</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([["repassar", "O inscrito"], ["absorver", "O festival"]] as const).map(([v, label]) => (
            <label key={v}
              className={`cursor-pointer rounded-md border px-4 py-2.5 text-center text-[14px] transition-colors ${modo === v ? "border-arx-fest/60 bg-arx-fest/10 text-white" : "border-arx-line text-arx-mist hover:text-white"}`}>
              <input type="radio" name="modo" value={v} checked={modo === v} onChange={() => setModo(v)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <dl className="mt-7 space-y-3 border-t border-arx-line pt-6 text-[15px]">
        <div className="flex justify-between"><dt className="text-arx-mist">O inscrito paga</dt><dd className="tabular-nums text-white">{brl(inscritoPaga)}</dd></div>
        <div className="flex justify-between"><dt className="text-arx-mist">Taxa de serviço</dt><dd className="tabular-nums text-arx-mist">{brl(tarifa)}</dd></div>
        <div className="flex items-baseline justify-between pt-2"><dt className="text-arx-frost">O festival recebe</dt><dd className="text-[24px] font-medium tabular-nums text-arx-fest">{brl(voceRecebe)}</dd></div>
      </dl>
    </div>
  );
}
