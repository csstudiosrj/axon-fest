"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

export interface PessoaGrupo { id: string; nome: string | null; email: string; diretor: boolean; ativo: boolean; pendente: boolean }

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/grupo/usuarios"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
}

export function EquipeGrupo({ pessoas, euId }: { pessoas: PessoaGrupo[]; euId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ nome: "", email: "" });
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const executar = async (chave: string, corpo: Record<string, unknown>, sucesso: string) => {
    setOcupado(chave);
    setAviso(null);
    try {
      await chamar(corpo);
      setAviso({ ok: true, texto: sucesso });
      if (corpo.acao === "convidar") setF({ nome: "", email: "" });
      router.refresh();
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    }
    setOcupado(null);
  };

  return (
    <div className="space-y-6">
      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>{aviso.texto}</p>}
      <form onSubmit={(e) => { e.preventDefault(); executar("novo", { acao: "convidar", ...f }, `Convite enviado para ${f.email}.`); }}
        className="rounded-xl border border-axon-border bg-axon-panel p-5">
        <h3 className="font-semibold text-white">Adicionar coreógrafo(a)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome completo" maxLength={120} className={campo} />
          <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="E-mail" className={campo} />
          <button type="submit" disabled={ocupado === "novo"} className="inline-flex items-center justify-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">
            {ocupado === "novo" ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Convidar
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">A pessoa recebe um e-mail para criar a senha e entra pelo mesmo login do ARXUM Fest.</p>
      </form>

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h3 className="border-b border-axon-border px-5 py-3.5 font-semibold text-white">Pessoas com acesso ({pessoas.length})</h3>
        <ul className="divide-y divide-axon-border">
          {pessoas.map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${p.ativo ? "" : "opacity-50"}`}>
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-medium text-white">{p.nome ?? p.email} {p.id === euId && <span className="text-xs text-gray-500">(você)</span>}</p>
                <p className="text-xs text-gray-500">{p.diretor ? "Diretor(a)" : "Coreógrafo(a)"} · {p.email}{!p.ativo ? " · desativado" : p.pendente ? " · ainda não acessou" : ""}</p>
              </div>
              {!p.diretor && (
                <span className="flex items-center gap-1">
                  {ocupado === p.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                  {p.pendente && p.ativo && (
                    <button type="button" onClick={() => executar(p.id, { acao: "reenviar", userId: p.id }, "Link de acesso reenviado.")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-axon-gold hover:bg-axon-gold/10"><Mail size={12} /> Reenviar</button>
                  )}
                  <button type="button" onClick={() => executar(p.id, { acao: "ativo", userId: p.id, ativo: !p.ativo }, p.ativo ? "Acesso desativado." : "Acesso reativado.")}
                    className="rounded-lg px-2 py-1.5 text-xs text-gray-300 hover:bg-white/5">{p.ativo ? "Desativar" : "Reativar"}</button>
                  <button type="button" title="Remover" onClick={() => window.confirm(`Remover ${p.nome ?? p.email}? As coreografias que cadastrou continuam no grupo.`) && executar(p.id, { acao: "remover", userId: p.id }, "Removido(a) da equipe.")}
                    className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
