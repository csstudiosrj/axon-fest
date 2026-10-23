"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold disabled:opacity-60";

export function ConfigPdv({ inicial, podeEditar }: {
  inicial: { chave: string; nome: string; cidade: string; pinDefinido: boolean };
  podeEditar: boolean;
}) {
  const [f, setF] = useState({ chave: inicial.chave, nome: inicial.nome, cidade: inicial.cidade, pin: "", confirmar: "" });
  const [pinDefinido, setPinDefinido] = useState(inicial.pinDefinido);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: k === "pin" || k === "confirmar" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value });

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (f.pin && f.pin !== f.confirmar) return setMsg({ ok: false, texto: "Os PINs não conferem." });
    if (!pinDefinido && !f.pin) return setMsg({ ok: false, texto: "Defina um PIN: sem ele o caixa não abre." });
    setSalvando(true);
    const res = await fetch(apiUrl("/api/pdv/config"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pix_chave: f.chave, pix_nome: f.nome, pix_cidade: f.cidade, pin: f.pin }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSalvando(false);
    if (!res.ok) return setMsg({ ok: false, texto: json.error ?? "Falha ao salvar." });
    if (f.pin) setPinDefinido(true);
    setF({ ...f, pin: "", confirmar: "" });
    setMsg({ ok: true, texto: "Salvo. Os caixas recebem os dados novos na próxima vez que abrirem com internet." });
  };

  return (
    <form onSubmit={salvar} className="max-w-2xl space-y-5">
      <section className="space-y-4 rounded-xl border border-axon-border bg-axon-panel p-5">
        <div>
          <h2 className="font-semibold text-white">PIX</h2>
          <p className="mt-1 text-xs text-gray-400">O caixa gera o QR Code com o valor da compra. O dinheiro vai direto para esta conta.</p>
        </div>
        <label className="block"><span className="text-xs text-gray-400">Chave PIX</span>
          <input value={f.chave} onChange={set("chave")} disabled={!podeEditar} maxLength={77} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" className={`${campo} mt-1.5`} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-xs text-gray-400">Nome do recebedor</span>
            <input value={f.nome} onChange={set("nome")} disabled={!podeEditar} maxLength={200} placeholder="Como está no banco" className={`${campo} mt-1.5`} /></label>
          <label className="block"><span className="text-xs text-gray-400">Cidade do recebedor</span>
            <input value={f.cidade} onChange={set("cidade")} disabled={!podeEditar} maxLength={100} className={`${campo} mt-1.5`} /></label>
        </div>
        <p className="text-xs text-gray-500">
          Nome e cidade fazem parte do QR Code Pix (regra do Banco Central). Pode digitar o nome completo: se for longo, o sistema abrevia só dentro do código.
          Na hora de pagar, o cliente vê no banco o nome oficial do dono da chave.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-axon-border bg-axon-panel p-5">
        <div>
          <h2 className="font-semibold text-white">PIN do caixa</h2>
          <p className="mt-1 text-xs text-gray-400">
            Pedido ao abrir o caixa e a bilheteria (validado com internet e lembrado no aparelho por 18 horas). {pinDefinido ? "Já existe um PIN definido; preencha só para trocar." : "Ainda não há PIN definido."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-xs text-gray-400">{pinDefinido ? "Novo PIN" : "PIN"} (4 a 6 números)</span>
            <input type="password" inputMode="numeric" autoComplete="new-password" value={f.pin} onChange={set("pin")} disabled={!podeEditar} className={`${campo} mt-1.5`} /></label>
          <label className="block"><span className="text-xs text-gray-400">Confirmar PIN</span>
            <input type="password" inputMode="numeric" autoComplete="new-password" value={f.confirmar} onChange={set("confirmar")} disabled={!podeEditar} className={`${campo} mt-1.5`} /></label>
        </div>
        <p className="text-xs text-gray-500">Operadores são convidados em Equipe, como “Operador de caixa” ou “Operador de bilheteria”. Eles entram por arxum.com.br/fest/operador.</p>
      </section>

      {podeEditar ? (
        <div className="flex items-center justify-between gap-4">
          <p className={`text-sm ${msg?.ok ? "text-emerald-300" : "text-red-300"}`}>{msg?.texto}</p>
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Somente a gestão da produtora altera PIX e PIN.</p>
      )}
    </form>
  );
}
