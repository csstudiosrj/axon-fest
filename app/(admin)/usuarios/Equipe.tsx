"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { CARGOS, nomeCargo } from "@/lib/auth/cargos";
import type { Membro } from "@/lib/equipe";
import { confirmar } from "@/app/_components/Dialogos";

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/invite"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as { error?: string; desativado?: boolean };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

export function Equipe({ membros, euId, atribuiveis, podeGerir }: { membros: Membro[]; euId: string; atribuiveis: string[]; podeGerir: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ nome: "", email: "", role: atribuiveis[0] ?? "" });
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const executar = async (id: string, corpo: Record<string, unknown>, sucesso: string) => {
    setOcupado(id);
    setAviso(null);
    try {
      const r = await chamar({ userId: id, ...corpo });
      setAviso({ ok: true, texto: r.desativado ? "A pessoa tem registros (vendas, notas) e foi desativada em vez de excluída." : sucesso });
      router.refresh();
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    }
    setOcupado(null);
  };

  const convidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      await chamar({ action: "invite", email: f.email, role: f.role, nome: f.nome || undefined });
      setAviso({ ok: true, texto: `Convite enviado para ${f.email}.` });
      setF({ ...f, nome: "", email: "" });
      router.refresh();
    } catch (err) {
      setAviso({ ok: false, texto: (err as Error).message });
    }
    setEnviando(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Equipe</h1>
        <p className="mt-1 text-sm text-gray-400">Quem trabalha com você no painel e no caixa. Jurados ficam em Jurados & Apuração; grupos entram pelo link de inscrição.</p>
      </div>

      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>{aviso.texto}</p>}

      {podeGerir && (
        <form onSubmit={convidar} className="rounded-xl border border-axon-border bg-axon-panel p-5">
          <h2 className="font-semibold text-white">Convidar pessoa</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
            <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome" maxLength={120} className={campo} />
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="E-mail" className={campo} />
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} aria-label="Cargo" className={campo}>
              {atribuiveis.map((r) => <option key={r} value={r}>{nomeCargo(r)}</option>)}
            </select>
            <button type="submit" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Convidar
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">{CARGOS[f.role]?.alcance}</p>
        </form>
      )}

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="border-b border-axon-border px-5 py-3.5 font-semibold text-white">Pessoas ({membros.length})</h2>
        <ul className="divide-y divide-axon-border">
          {membros.map((m) => {
            const eu = m.id === euId;
            const gerenciavel = podeGerir && !eu && atribuiveis.includes(m.role);
            return (
              <li key={m.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${m.ativo ? "" : "opacity-50"}`}>
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-medium text-white">{m.nome ?? m.email} {eu && <span className="text-xs text-gray-500">(você)</span>}</p>
                  <p className="text-xs text-gray-500">
                    {m.email} · {!m.ativo ? "acesso desativado" : m.pendente ? "ainda não acessou" : `último acesso ${new Date(m.ultimoAcesso!).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                {gerenciavel ? (
                  <select value={m.role} disabled={ocupado === m.id} aria-label={`Cargo de ${m.nome ?? m.email}`}
                    onChange={(e) => executar(m.id, { action: "update", role: e.target.value }, "Cargo alterado.")}
                    className="rounded-lg border border-axon-border bg-axon-bg px-2.5 py-1.5 text-xs text-white">
                    {atribuiveis.map((r) => <option key={r} value={r}>{nomeCargo(r)}</option>)}
                  </select>
                ) : (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${CARGOS[m.role]?.cor ?? "border-white/10 text-gray-300"}`}>{nomeCargo(m.role)}</span>
                )}
                {gerenciavel && (
                  <span className="flex items-center gap-1">
                    {ocupado === m.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                    {m.pendente && m.ativo && (
                      <button type="button" onClick={() => executar(m.id, { action: "reenviar" }, "Link de acesso reenviado.")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-axon-gold hover:bg-axon-gold/10"><Mail size={12} /> Reenviar</button>
                    )}
                    <button type="button" onClick={() => executar(m.id, { action: "ativo", ativo: !m.ativo }, m.ativo ? "Acesso desativado." : "Acesso reativado.")}
                      className="rounded-lg px-2 py-1.5 text-xs text-gray-300 hover:bg-white/5">{m.ativo ? "Desativar" : "Reativar"}</button>
                    <button type="button" title="Excluir" onClick={async () => (await confirmar(`Excluir ${m.nome ?? m.email}?`)) && executar(m.id, { action: "remove" }, "Pessoa excluída.")}
                      className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="border-b border-axon-border px-5 py-3.5 font-semibold text-white">O que cada cargo acessa</h2>
        <dl className="divide-y divide-axon-border">
          {["admin", "produtor", "financeiro", "marketing", "operador", "jurado"].map((r) => (
            <div key={r} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 text-sm">
              <dt className="w-28 shrink-0 font-medium text-white">{nomeCargo(r)}</dt>
              <dd className="flex-1 text-gray-400">{CARGOS[r].alcance}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
