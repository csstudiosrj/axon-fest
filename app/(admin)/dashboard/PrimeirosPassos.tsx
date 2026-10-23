import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Roteiro de início para a produtora nova; some quando tudo está feito.
export async function PrimeirosPassos({ produtoraId }: { produtoraId: string }) {
  const supabase = await createClient();
  const [{ data: produtora }, { data: pdv }, { data: eventos }, { count: categorias }, { count: jurados }] = await Promise.all([
    supabase.from("produtoras").select("documento, telefone").eq("id", produtoraId).maybeSingle(),
    supabase.from("pdv_config").select("pix_chave").eq("produtora_id", produtoraId).maybeSingle(),
    supabase.from("eventos").select("id, status").eq("produtora_id", produtoraId),
    supabase.from("categorias").select("id, eventos!inner ( produtora_id )", { count: "exact", head: true }).eq("eventos.produtora_id", produtoraId),
    supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("produtora_id", produtoraId).eq("role", "jurado"),
  ]);
  const lista = eventos ?? [];
  const primeiro = lista[0]?.id;
  const passos = [
    { feito: !!produtora?.documento && !!produtora.telefone, texto: "Complete os dados da produtora (CPF/CNPJ e telefone)", href: "/configuracoes" },
    { feito: lista.length > 0, texto: "Crie o seu primeiro evento", href: "/eventos" },
    { feito: (categorias ?? 0) > 0, texto: "Cadastre as categorias e os valores de inscrição", href: primeiro ? `/eventos/${primeiro}/categorias` : "/eventos" },
    { feito: lista.some((e) => e.status !== "Em Montagem"), texto: "Abra as inscrições e divulgue o link", href: primeiro ? `/eventos/${primeiro}/dados` : "/eventos" },
    { feito: !!pdv?.pix_chave, texto: "Cadastre a chave PIX do caixa e da bilheteria", href: "/pdv?aba=configuracoes" },
    { feito: (jurados ?? 0) > 0, texto: "Convide os jurados", href: "/jurados" },
  ];
  const feitos = passos.filter((p) => p.feito).length;
  if (feitos === passos.length) return null;

  return (
    <section className="rounded-xl border border-axon-gold/30 bg-axon-gold/5">
      <div className="flex items-center justify-between border-b border-axon-gold/20 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-white">Primeiros passos</h2>
        <span className="text-xs text-gray-400">{feitos} de {passos.length}</span>
      </div>
      <ul className="divide-y divide-axon-border">
        {passos.map((p) => (
          <li key={p.texto}>
            <Link href={p.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-white/[0.02]">
              {p.feito ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <Circle size={16} className="shrink-0 text-gray-500" />}
              <span className={p.feito ? "text-gray-500 line-through" : "text-gray-200"}>{p.texto}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
