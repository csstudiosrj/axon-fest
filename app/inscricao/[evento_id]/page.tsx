import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InscricaoForm from "./InscricaoForm";

interface EventoInscricao {
  id: string;
  nome: string;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  tema_escuro: boolean;
  logo_url: string | null;
  status: string;
}

interface PageProps {
  params: { evento_id: string };
}

export default async function InscricaoPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("eventos")
    .select("id, nome, cor_primaria, cor_secundaria, tema_escuro, logo_url, status")
    .eq("id", params.evento_id)
    .single();

  if (error || !row) notFound();

  const evento: EventoInscricao = {
    id: row.id,
    nome: row.nome,
    cor_primaria: row.cor_primaria ?? null,
    cor_secundaria: row.cor_secundaria ?? null,
    tema_escuro: row.tema_escuro ?? true,
    logo_url: row.logo_url ?? null,
    status: row.status,
  };

  const accent = evento.cor_primaria ?? "var(--fallback-accent)";
  const isDark = evento.tema_escuro;

  const pageClass = isDark ? "bg-axon-bg" : "bg-white";
  const panelClass = isDark ? "bg-axon-panel" : "bg-white";
  const borderClass = isDark ? "border-axon-border" : "border-axon-border";
  const headingClass = isDark ? "text-white" : "text-black";
  const textClass = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div
      className={`min-h-screen ${pageClass}`}
      style={{ "--fallback-accent": "var(--bg-axon-gold)" } as CSSProperties}
    >
      <div className={`border-b ${borderClass} ${panelClass}`} style={{ borderBottomColor: `${accent}30` }}>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-5 sm:px-6">
          {evento.logo_url ? (
            <img
              src={evento.logo_url}
              alt={evento.nome}
              width={52}
              height={52}
              className="h-13 w-13 rounded-2xl border border-axon-border object-contain bg-axon-panel p-2"
              style={{ borderColor: `${accent}35` }}
            />
          ) : (
            <div
              className="flex h-13 w-13 items-center justify-center rounded-2xl border border-axon-border bg-axon-panel text-sm font-bold text-axon-gold"
              style={{ borderColor: `${accent}35` }}
            >
              {evento.nome.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${textClass}`}>Inscrição pública</p>
            <h1 className={`truncate text-lg font-bold sm:text-xl ${headingClass}`}>{evento.nome}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full">
          {evento.status !== "inscricoes_abertas" ? (
            <div className={`rounded-3xl border ${borderClass} ${panelClass} p-8 sm:p-10`} style={{ borderColor: `${accent}24` }}>
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-axon-border bg-axon-gold-dim"
                style={{ borderColor: `${accent}30`, color: accent }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold ${headingClass}`}>Inscrições indisponíveis</h2>
              <p className={`mt-2 text-sm leading-relaxed ${textClass}`}>
                {evento.status === "inscricoes_encerradas"
                  ? "O período de inscrições para este festival foi encerrado."
                  : evento.status === "em_andamento"
                    ? "Este festival já está em andamento e não aceita novas inscrições."
                    : evento.status === "finalizado"
                      ? "Este festival foi finalizado."
                      : evento.status === "cancelado"
                        ? "Este festival foi cancelado."
                        : "As inscrições para este festival ainda não estão abertas."}
              </p>
            </div>
          ) : (
            <InscricaoForm eventoId={evento.id} evento={evento} />
          )}
        </div>
      </div>
    </div>
  );
}