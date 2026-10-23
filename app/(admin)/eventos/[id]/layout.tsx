import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { carregarEvento } from "@/lib/eventos/painel";
import { infoStatus } from "@/lib/eventos/status";
import { AbasEvento } from "./AbasEvento";
import { LinksEvento } from "./LinksEvento";
import { dataBR } from "./_ui";

export const dynamic = "force-dynamic";

export default async function LayoutEvento({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, perfil, pode } = await carregarEvento(id);
  const status = infoStatus(evento.status);
  const base = `/eventos/${evento.id}`;
  const periodo = [dataBR(evento.data_inicio), dataBR(evento.data_fim)].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <Link href="/eventos" aria-label="Voltar" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-axon-border text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{evento.nome}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${status.cor}`}>{status.rotulo}</span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {perfil.nome} · {periodo.length ? [...new Set(periodo)].join(" a ") : "Datas a definir"}{evento.local ? ` · ${evento.local}` : ""}
            </p>
          </div>
          <LinksEvento eventoId={evento.id} slug={evento.slug} />
        </div>
        <div className="border-b border-axon-border">
          <AbasEvento base={base} abas={[
            { caminho: "", nome: "Resumo", ver: true },
            { caminho: "/dados", nome: pode("evento_dados") ? "Dados e página" : "Página pública", ver: pode("evento_dados") || pode("evento_pagina") },
            { caminho: "/categorias", nome: "Categorias", ver: pode("evento_categorias") },
            { caminho: "/inscricoes", nome: pode("pagamentos") ? "Inscrições e pagamentos" : "Inscrições", ver: pode("evento_inscricoes") },
            { caminho: "/programacao", nome: "Programação", ver: pode("evento_programacao") },
            { caminho: "/jurados", nome: "Jurados", ver: pode("evento_jurados") },
          ].filter((a) => a.ver)} />
        </div>
      </div>
      {children}
    </div>
  );
}
