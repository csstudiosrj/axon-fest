import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { infoStatus } from "@/lib/eventos/status";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Inscrições ficam dentro de cada evento; aqui o organizador escolhe qual
export default async function InscricoesPorEvento() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = await createClient();
  let q = supabase.from("eventos").select("id, nome, status, data_inicio").order("data_inicio", { ascending: false, nullsFirst: false });
  if (usuario.role !== "super_admin") q = q.eq("produtora_id", usuario.produtora_id ?? "");
  const { data: eventos } = await q;
  const ids = (eventos ?? []).map((e) => e.id);
  const [{ data: insc }, { data: aps }] = ids.length
    ? await Promise.all([
        supabase.from("inscricoes_grupo_evento").select("evento_id").in("evento_id", ids),
        supabase.from("apresentacoes").select("evento_id, valor_total, status_pagamento").in("evento_id", ids),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Inscrições & Elenco</h1>
        <p className="mt-1 text-sm text-gray-400">Escolha o evento para ver grupos, apresentações, pagamentos e elenco.</p>
      </div>
      {(eventos ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-12 text-center text-sm text-gray-400">
          Nenhum evento ainda. <Link href="/eventos" className="text-axon-gold hover:underline">Criar evento</Link>
        </p>
      ) : (
        <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
          {(eventos ?? []).map((e) => {
            const grupos = (insc ?? []).filter((i) => i.evento_id === e.id).length;
            const minhas = (aps ?? []).filter((a) => a.evento_id === e.id);
            const pendente = minhas.filter((a) => (a.status_pagamento ?? "Pendente") === "Pendente").reduce((s, a) => s + Number(a.valor_total ?? 0), 0);
            const st = infoStatus(e.status);
            return (
              <li key={e.id}>
                <Link href={`/eventos/${e.id}/inscricoes`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{e.nome}</p>
                    <p className="text-xs text-gray-400">{grupos} grupo(s) · {minhas.length} apresentação(ões){pendente ? ` · ${brl(pendente)} a receber` : ""}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${st.cor}`}>{st.rotulo}</span>
                  <ArrowRight size={15} className="text-gray-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
