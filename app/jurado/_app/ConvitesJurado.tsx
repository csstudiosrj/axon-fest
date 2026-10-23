"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";

interface Convite { id: string; produtora: string }

// Produtoras que convidaram o jurado (ele é único no ARXUM Fest e escolhe com quem trabalha)
export function ConvitesJurado() {
  const [convites, setConvites] = useState<Convite[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/jurado/convites")).then((r) => r.json()).then((j: { convites?: Convite[] }) => setConvites(j.convites ?? [])).catch(() => {});
  }, []);

  const responder = async (id: string, aceitar: boolean) => {
    setOcupado(id);
    const r = await fetch(apiUrl("/api/jurado/convites"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, aceitar }) }).catch(() => null);
    setOcupado(null);
    if (r?.ok) setConvites((c) => c.filter((x) => x.id !== id));
  };

  if (!convites.length) return null;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 px-4 pt-4">
      {convites.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="min-w-0 flex-1"><strong>{c.produtora}</strong> convidou você para ser jurado(a) nos festivais dela.</p>
          {ocupado === c.id ? <Loader2 size={16} className="animate-spin" /> : (
            <span className="flex gap-2">
              <button type="button" onClick={() => responder(c.id, true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black"><Check size={13} /> Aceitar</button>
              <button type="button" onClick={() => responder(c.id, false)} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs"><X size={13} /> Recusar</button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
