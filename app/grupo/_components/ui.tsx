// Peças visuais compartilhadas do portal do grupo

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function periodo(inicio: string | null, fim: string | null) {
  const a = dataCurta(inicio);
  const b = dataCurta(fim);
  if (!a) return "Data a definir";
  return b && b !== a ? `${a} – ${b}` : a;
}

export const brl = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TONS = {
  neutro: "border-white/10 bg-white/5 text-gray-300",
  ouro: "border-axon-gold/30 bg-axon-gold/10 text-axon-gold",
  verde: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  vermelho: "border-red-400/30 bg-red-400/10 text-red-300",
  azul: "border-sky-400/30 bg-sky-400/10 text-sky-300",
} as const;

export type Tom = keyof typeof TONS;

export function Selo({ tom = "neutro", children }: { tom?: Tom; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONS[tom]}`}>
      {children}
    </span>
  );
}

export function tomDoEvento(status: string | null): Tom {
  if (status === "inscricoes_abertas") return "verde";
  if (status === "em_andamento") return "azul";
  if (status === "finalizado") return "neutro";
  return "ouro";
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-axon-border bg-axon-panel ${className}`}>{children}</section>;
}

export function Vazio({ icone, titulo, texto, children }: { icone: React.ReactNode; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-axon-border bg-axon-bg text-gray-500">{icone}</div>
      <p className="font-semibold text-white">{titulo}</p>
      <p className="max-w-md text-sm text-gray-400">{texto}</p>
      {children}
    </div>
  );
}
