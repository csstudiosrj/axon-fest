"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { novoSlug } from "@/lib/eventos/slug";
import { SeletorPerfil } from "../_components/SeletorPerfil";

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

export function NovoEvento() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: "", inicio: "", fim: "", perfil: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.perfil) return setErro("Escolha o tipo do festival.");
    if (f.fim && f.inicio && f.fim < f.inicio) return setErro("A data de fim é anterior à de início.");
    setSalvando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: eu } = await supabase.from("usuarios").select("produtora_id").eq("id", user?.id ?? "").single();
    const { data, error } = await supabase.from("eventos").insert({
      nome: f.nome.trim(), data_inicio: f.inicio || null, data_fim: f.fim || f.inicio || null, perfil_id: f.perfil,
      status: "Em Montagem", slug: novoSlug(f.nome), produtora_id: eu?.produtora_id ?? null, formato: "competitivo",
    }).select("id").single();
    if (error || !data) { setErro(error?.message ?? "Não foi possível criar."); setSalvando(false); return; }
    router.push(`/eventos/${data.id}/dados`);
  };

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black"><Plus size={15} /> Novo evento</button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={() => setAberto(false)}>
          <form onSubmit={criar} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
              <h2 className="font-semibold text-white">Novo evento</h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <label className="block"><span className="text-xs text-gray-400">Nome do festival</span>
                <input required autoFocus value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={140} className={`${campo} mt-1.5`} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs text-gray-400">Início</span>
                  <input required type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} className={`${campo} mt-1.5`} style={{ colorScheme: "dark" }} /></label>
                <label className="block"><span className="text-xs text-gray-400">Fim</span>
                  <input type="date" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} className={`${campo} mt-1.5`} style={{ colorScheme: "dark" }} /></label>
              </div>
              <div><span className="text-xs text-gray-400">Tipo do festival</span>
                <div className="mt-1.5"><SeletorPerfil valor={f.perfil} onChange={(p) => setF({ ...f, perfil: p.id })} /></div></div>
              {erro && <p className="text-sm text-red-300">{erro}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg px-4 py-2 text-sm text-gray-300">Cancelar</button>
              <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
                {salvando && <Loader2 size={15} className="animate-spin" />} Criar evento
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
