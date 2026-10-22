"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { urlAbsoluta } from "@/lib/base-path";

// Divulgação: página pública e formulário de inscrição
export function LinksEvento({ eventoId, slug }: { eventoId: string; slug: string | null }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await navigator.clipboard.writeText(urlAbsoluta(`/inscricao/${eventoId}`)).catch(() => undefined);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {slug && (
        <a href={urlAbsoluta(`/e/${slug}`)} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-xs text-gray-300 hover:text-white">
          <ExternalLink size={13} /> Página pública
        </a>
      )}
      <button type="button" onClick={copiar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold/10 px-3 py-2 text-xs font-medium text-axon-gold hover:bg-axon-gold/20">
        {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? "Link copiado" : "Copiar link de inscrição"}
      </button>
    </div>
  );
}
