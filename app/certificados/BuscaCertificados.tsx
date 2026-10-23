"use client";

import { useState } from "react";
import { Award, Download, Loader2, Search } from "lucide-react";
import { apiUrl, BASE_PATH } from "@/lib/base-path";
import { mascaraCpf } from "@/lib/mascaras";
import { Direitos } from "@/app/_components/Direitos";

interface Item { codigo: string; evento: string; apresentacao: string; data: string | null }

const campo = "w-full rounded-xl border border-axon-border bg-axon-bg px-4 py-3 text-sm text-white outline-none focus:border-axon-gold";

// Página pública: a pessoa informa CPF e nascimento e baixa um certificado por apresentação
export function BuscaCertificados() {
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lista, setLista] = useState<Item[] | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setBuscando(true);
    const res = await fetch(apiUrl("/api/certificados"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "buscar", cpf, nascimento }) });
    const json = (await res.json().catch(() => ({}))) as { certificados?: Item[]; error?: string };
    setBuscando(false);
    if (!res.ok) return setErro(json.error ?? "Não foi possível buscar agora.");
    setLista(json.certificados ?? []);
  };

  return (
    <main className="min-h-screen bg-axon-bg px-4 py-12 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2 text-center">
          <Award size={36} className="mx-auto text-axon-gold" />
          <h1 className="text-2xl font-bold">Certificados de participação</h1>
          <p className="text-sm text-gray-400">Informe seu CPF e sua data de nascimento. Aparece um certificado para cada apresentação em que você fez check-in, quando o festival liberar.</p>
        </header>
        <form onSubmit={buscar} className="space-y-4 rounded-2xl border border-axon-border bg-axon-panel p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5"><span className="text-xs text-gray-400">CPF</span>
              <input required inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="000.000.000-00" className={campo} /></label>
            <label className="block space-y-1.5"><span className="text-xs text-gray-400">Data de nascimento</span>
              <input required type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} className={campo} /></label>
          </div>
          {erro && <p className="text-sm text-red-300">{erro}</p>}
          <button type="submit" disabled={buscando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-axon-gold py-3 text-sm font-bold text-black disabled:opacity-50">
            {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Buscar certificados
          </button>
          <p className="text-center text-xs text-gray-500">Menores de idade: use o CPF do(a) participante, o mesmo cadastrado pelo grupo.</p>
        </form>
        {lista && (lista.length === 0 ? (
          <p className="rounded-xl border border-axon-border bg-axon-panel p-5 text-center text-sm text-gray-300">
            Nenhum certificado disponível. Confira os dados ou aguarde o festival liberar (os certificados dependem do check-in feito pela produção).
          </p>
        ) : (
          <ul className="divide-y divide-axon-border rounded-2xl border border-axon-border bg-axon-panel">
            {lista.map((c) => (
              <li key={c.codigo} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.apresentacao}</p>
                  <p className="text-xs text-gray-500">{c.evento}{c.data ? ` · ${new Date(`${c.data}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</p>
                </div>
                <a href={`${BASE_PATH}/certificado/${c.codigo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-axon-gold/40 px-3 py-2 text-xs font-semibold text-axon-gold">
                  <Download size={14} /> Abrir
                </a>
              </li>
            ))}
          </ul>
        ))}
        <Direitos className="text-center text-xs text-gray-600" />
      </div>
    </main>
  );
}
