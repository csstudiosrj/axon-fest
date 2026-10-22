"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { perfilPorSlug } from "@/lib/perfis";

export interface PerfilFestival { id: string; slug: string; nome: string }

// Tipo do festival: define o vocabulário e os arquivos técnicos do evento
export function SeletorPerfil({ valor, onChange, disabled, className = "" }: {
  valor: string | null | undefined;
  onChange: (perfil: PerfilFestival) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [perfis, setPerfis] = useState<PerfilFestival[]>([]);

  useEffect(() => {
    let vivo = true;
    createClient().from("perfis_festival").select("id, slug, nome").eq("ativo", true).order("ordem")
      .then(({ data }) => { if (vivo) setPerfis((data as PerfilFestival[]) ?? []); });
    return () => { vivo = false; };
  }, []);

  const atual = perfis.find((p) => p.id === valor);
  const exemplo = atual ? perfilPorSlug(atual.slug) : null;

  return (
    <div className="space-y-1.5">
      <select value={valor ?? ""} disabled={disabled}
        onChange={(e) => { const p = perfis.find((x) => x.id === e.target.value); if (p) onChange(p); }}
        className={`w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold disabled:opacity-50 ${className}`}>
        <option value="" disabled>Selecione o tipo do festival…</option>
        {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      {exemplo && (
        <p className="text-xs text-gray-500">
          O sistema vai falar em <span className="text-gray-300">{exemplo.termos.grupo.plural}</span>,{" "}
          <span className="text-gray-300">{exemplo.termos.participante.plural}</span> e{" "}
          <span className="text-gray-300">{exemplo.termos.apresentacao.plural}</span>, e pedir{" "}
          {exemplo.arquivos.map((a) => a.nome.toLowerCase()).join(", ")}.
        </p>
      )}
    </div>
  );
}
