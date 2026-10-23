import Link from "next/link";
import { Download, Search } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

// Peças comuns das listas do Super Admin (componentes de servidor)

export function Cabecalho({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-white">{titulo}</h2>
        <p className="mt-1 text-sm text-gray-400">{texto}</p>
      </div>
      {children}
    </div>
  );
}

// Busca via GET (?q=), funciona sem JavaScript
export function Busca({ q, placeholder, extra }: { q?: string; placeholder: string; extra?: React.ReactNode }) {
  return (
    <form className="flex flex-wrap gap-2">
      <label className="relative min-w-[240px] flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input name="q" defaultValue={q} placeholder={placeholder}
          className="w-full rounded-lg border border-axon-border bg-axon-bg py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-axon-gold" />
      </label>
      {extra}
      <button type="submit" className="rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-200 hover:border-axon-gold">Buscar</button>
      {q && <Link href="?" className="self-center text-xs text-gray-400 hover:text-white">Limpar</Link>}
    </form>
  );
}

export function Exportar({ tipo, q, cargo }: { tipo: string; q?: string; cargo?: string }) {
  const params = new URLSearchParams({ tipo, ...(q ? { q } : {}), ...(cargo ? { cargo } : {}) });
  return (
    <a href={`${BASE_PATH}/api/super/exportar?${params}`} className="inline-flex items-center gap-2 rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-200 hover:border-axon-gold">
      <Download size={15} /> Exportar planilha
    </a>
  );
}

export function Contagem({ mostrando, total }: { mostrando: number; total: number }) {
  return <p className="text-xs text-gray-500">{total === mostrando ? `${total} registro(s)` : `Mostrando ${mostrando} de ${total}. Refine a busca para ver os demais.`}</p>;
}

export const dataBR = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");
