"use client";

import { Copy, ExternalLink } from "lucide-react";
import { urlAbsoluta } from "@/lib/base-path";

// Links para divulgar o evento: página pública e formulário de inscrição
export function LinksDivulgacao({ eventoId, slug, addToast }: {
  eventoId: string;
  slug: string | null;
  addToast: (tipo: "sucesso" | "erro" | "info", mensagem: string) => void;
}) {
  const inscricao = urlAbsoluta(`/inscricao/${eventoId}`);
  const publica = slug ? urlAbsoluta(`/e/${slug}`) : null;

  const copiar = async (texto: string, rotulo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      addToast("sucesso", `${rotulo} copiado.`);
    } catch {
      addToast("erro", "Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      {publica && (
        <a href={publica} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-xs text-gray-300 hover:border-axon-gold/40 hover:text-white">
          <ExternalLink size={13} /> Página pública
        </a>
      )}
      <button type="button" onClick={() => copiar(inscricao, "Link de inscrição")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold/10 px-3 py-2 text-xs font-medium text-axon-gold hover:bg-axon-gold/20">
        <Copy size={13} /> Copiar link de inscrição
      </button>
    </div>
  );
}
