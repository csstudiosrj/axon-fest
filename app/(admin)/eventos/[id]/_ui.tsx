// Peças visuais das abas do evento (painel da produção)

export const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold disabled:opacity-60";

export const brl = (v: number | null | undefined) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function dataBR(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

export function Cartao({ titulo, descricao, acao, children, className = "" }: {
  titulo?: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-axon-border bg-axon-panel ${className}`}>
      {(titulo || acao) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-axon-border px-5 py-4">
          <div>
            {titulo && <h2 className="font-semibold text-white">{titulo}</h2>}
            {descricao && <p className="mt-1 text-xs text-gray-400">{descricao}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function Rotulo({ texto, ajuda, children }: { texto: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-400">{texto}</span>
      <div className="mt-1.5">{children}</div>
      {ajuda && <span className="mt-1 block text-[11px] text-gray-500">{ajuda}</span>}
    </label>
  );
}

export function Aviso({ tipo, children }: { tipo: "ok" | "erro" | "info"; children: React.ReactNode }) {
  const cor = tipo === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : tipo === "erro" ? "border-red-400/30 bg-red-400/10 text-red-200"
    : "border-axon-gold/30 bg-axon-gold/10 text-axon-gold";
  return <p className={`rounded-lg border px-4 py-3 text-sm ${cor}`}>{children}</p>;
}
