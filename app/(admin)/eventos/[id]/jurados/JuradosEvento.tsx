"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { Aviso, Cartao, brl, campo } from "../_ui";
import { confirmar } from "@/app/_components/Dialogos";

interface Escalado {
  vinculoId: string; juradoId: string; nome: string; email: string; especialidade: string | null;
  cacheValor: number | null; cacheStatus: string; fichas: number; finalizadas: number;
}

function LinhaJurado({ j, podeGerir, onErro }: { j: Escalado; podeGerir: boolean; onErro: (m: string) => void }) {
  const router = useRouter();
  const [esp, setEsp] = useState(j.especialidade ?? "");
  const [cache, setCache] = useState(j.cacheValor != null ? String(j.cacheValor).replace(".", ",") : "");
  const [status, setStatus] = useState(j.cacheStatus);
  const [salvando, setSalvando] = useState(false);
  const alterado = esp !== (j.especialidade ?? "") || cache !== (j.cacheValor != null ? String(j.cacheValor).replace(".", ",") : "") || status !== j.cacheStatus;

  const salvar = async () => {
    const valor = cache.trim() ? Number(cache.replace(/\./g, "").replace(",", ".")) : null;
    if (valor != null && (!Number.isFinite(valor) || valor < 0)) return onErro("Cachê inválido.");
    setSalvando(true);
    const { error } = await createClient().from("evento_jurados").update({ especialidade: esp.trim() || null, cache_valor: valor, cache_status: status }).eq("id", j.vinculoId);
    setSalvando(false);
    if (error) onErro(error.message); else router.refresh();
  };
  const remover = async () => {
    if (j.fichas) return onErro(`${j.nome} já avaliou ${j.fichas} apresentação(ões) neste evento e não pode ser retirado: as notas fazem parte da apuração.`);
    if (!(await confirmar(`Tirar ${j.nome} deste evento?`))) return;
    const { error } = await createClient().from("evento_jurados").delete().eq("id", j.vinculoId);
    if (error) onErro(error.message); else router.refresh();
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="min-w-[180px] flex-1">
        <p className="text-sm font-medium text-white">{j.nome}</p>
        <p className="text-xs text-gray-500">{j.email} · {j.finalizadas}/{j.fichas} fichas finalizadas</p>
      </div>
      <input value={esp} onChange={(e) => setEsp(e.target.value)} disabled={!podeGerir} placeholder="Especialidade" maxLength={60} aria-label={`Especialidade de ${j.nome}`} className={`${campo} w-40`} />
      <div className="flex items-center gap-1"><span className="text-xs text-gray-500">R$</span>
        <input value={cache} onChange={(e) => setCache(e.target.value.replace(/[^\d,.]/g, ""))} disabled={!podeGerir} inputMode="decimal" placeholder="Cachê" aria-label={`Cachê de ${j.nome}`} className={`${campo} w-24`} /></div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={!podeGerir} aria-label={`Situação do cachê de ${j.nome}`} className={`${campo} w-28`}>
        <option value="pendente">A pagar</option>
        <option value="pago">Pago</option>
      </select>
      {podeGerir && (
        <span className="flex items-center gap-1">
          {alterado && <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1 rounded-lg bg-axon-gold px-3 py-1.5 text-xs font-semibold text-black">{salvando && <Loader2 size={12} className="animate-spin" />} Salvar</button>}
          <button type="button" onClick={remover} title="Tirar do evento" className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
        </span>
      )}
    </li>
  );
}

export function JuradosEvento({ eventoId, podeGerir, escalados, disponiveis, criterios, mostra }: {
  eventoId: string;
  podeGerir: boolean;
  escalados: Escalado[];
  disponiveis: { id: string; nome: string; email: string; especialidade: string | null }[];
  criterios: number;
  mostra: boolean;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const totalCache = escalados.reduce((s, j) => s + Number(j.cacheValor ?? 0), 0);
  const pagoCache = escalados.filter((j) => j.cacheStatus === "pago").reduce((s, j) => s + Number(j.cacheValor ?? 0), 0);

  const escalar = async (juradoId: string, especialidade: string | null) => {
    const { error } = await createClient().from("evento_jurados").insert({ evento_id: eventoId, jurado_id: juradoId, especialidade });
    if (error) setErro(error.message); else router.refresh();
  };

  const convidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setEnviando(true);
    const res = await fetch(apiUrl("/api/invite"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", email, role: "jurado", nome: nome || undefined }) });
    const json = (await res.json().catch(() => ({}))) as { error?: string; userId?: string };
    if (!res.ok || !json.userId) { setEnviando(false); return setErro(json.error ?? "Não foi possível convidar."); }
    await escalar(json.userId, null);
    setEnviando(false);
    setEmail("");
    setNome("");
    setOk("Convite enviado e jurado escalado. Ele cria a senha pelo link do e-mail.");
  };

  return (
    <div className="space-y-5">
      {mostra && <Aviso tipo="info">Este evento é uma mostra (sem avaliação). Jurados são opcionais.</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}

      <Cartao titulo={`Jurados do evento (${escalados.length})`} descricao={escalados.length ? `Cachês: ${brl(totalCache)} no total · ${brl(pagoCache)} pagos` : undefined}
        acao={<Link href={`/jurados/apuracao?evento=${eventoId}`} className="inline-flex items-center gap-1 text-sm text-axon-gold hover:underline">Critérios e apuração ({criterios} critérios) <ArrowRight size={14} /></Link>}>
        {escalados.length === 0 ? <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum jurado escalado.</p> : (
          <ul className="divide-y divide-axon-border">
            {escalados.map((j) => <LinhaJurado key={j.vinculoId} j={j} podeGerir={podeGerir} onErro={setErro} />)}
          </ul>
        )}
      </Cartao>

      {podeGerir && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao titulo="Escalar do cadastro" descricao="Jurados que já têm conta na sua produtora.">
            {disponiveis.length === 0 ? <p className="px-5 py-6 text-sm text-gray-400">Nenhum outro jurado cadastrado. Convide ao lado.</p> : (
              <ul className="divide-y divide-axon-border">
                {disponiveis.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0"><span className="block truncate text-sm text-white">{u.nome}</span><span className="text-xs text-gray-500">{u.especialidade ?? u.email}</span></span>
                    <button type="button" onClick={() => escalar(u.id, u.especialidade)} className="inline-flex items-center gap-1 rounded-lg bg-axon-gold px-3 py-1.5 text-xs font-semibold text-black"><Plus size={12} /> Escalar</button>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
          <Cartao titulo="Convidar jurado novo" descricao="Ele recebe um e-mail para criar a senha e já fica escalado neste evento.">
            <form onSubmit={convidar} className="space-y-3 px-5 py-4">
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (opcional)" maxLength={120} className={campo} />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={campo} />
              <button type="submit" disabled={enviando} className="inline-flex items-center gap-2 rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-200 disabled:opacity-50">
                {enviando ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Convidar e escalar
              </button>
            </form>
          </Cartao>
        </div>
      )}
    </div>
  );
}
