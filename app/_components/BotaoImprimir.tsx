"use client";

import { Printer } from "lucide-react";

// "Baixar PDF": abre a impressão do navegador, onde a pessoa escolhe "Salvar como PDF"
export function BotaoImprimir({ texto = "Baixar PDF" }: { texto?: string }) {
  return (
    <button type="button" onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black print:hidden">
      <Printer size={15} /> {texto}
    </button>
  );
}
