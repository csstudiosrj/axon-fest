import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { infoStatus } from "@/lib/eventos/status";
import { perfilPorSlug } from "@/lib/perfis";
import { NovoEvento } from "./NovoEvento";

export const dynamic = "force-dynamic";

const data = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : null);

export default async function ListaEventos() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = await createClient();
  let q = supabase.from("eventos").select("id, nome, status, data_inicio, data_fim, local, logo_url, perfis_festival:perfil_id ( slug )").order("data_inicio", { ascending: false, nullsFirst: true });
  if (usuario.role !== "super_admin") q = q.eq("produtora_id", usuario.produtora_id ?? "");
  const { data: eventos } = await q;
  const ids = (eventos ?? []).map((e) => e.id);
  const { data: aps } = ids.length ? await supabase.from("apresentacoes").select("evento_id").in("evento_id", ids) : { data: [] };
  const podeCriar = !!usuario.produtora_id && ["admin", "produtor", "produtora_admin", "super_admin"].includes(usuario.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Eventos</h1>
          <p className="mt-1 text-sm text-gray-400">Seus festivais: dados, categorias, inscrições, programação e jurados.</p>
        </div>
        {podeCriar && <NovoEvento />}
      </div>
      {(eventos ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-14 text-center text-sm text-gray-400">
          Nenhum evento ainda. {podeCriar ? "Clique em “Novo evento” para começar." : ""}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(eventos ?? []).map((e) => {
            const st = infoStatus(e.status);
            const pf = e.perfis_festival as { slug?: string } | { slug?: string }[] | null;
            const perfil = perfilPorSlug(Array.isArray(pf) ? pf[0]?.slug : pf?.slug);
            const n = (aps ?? []).filter((a) => a.evento_id === e.id).length;
            const periodo = [data(e.data_inicio), e.data_fim !== e.data_inicio ? data(e.data_fim) : null].filter(Boolean).join(" – ");
            return (
              <Link key={e.id} href={`/eventos/${e.id}`} className="flex flex-col rounded-xl border border-axon-border bg-axon-panel p-5 transition-colors hover:border-axon-gold/40">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-white">{e.nome}</p>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${st.cor}`}>{st.rotulo}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{perfil.nome}</p>
                <div className="mt-4 space-y-1 text-xs text-gray-400">
                  <p className="flex items-center gap-1.5"><CalendarDays size={12} /> {periodo || "Datas a definir"}</p>
                  <p className="flex items-center gap-1.5"><MapPin size={12} /> {e.local ?? "Local a definir"}</p>
                </div>
                <p className="mt-4 border-t border-axon-border pt-3 text-xs text-gray-400">{n} {n === 1 ? perfil.termos.apresentacao.singular : perfil.termos.apresentacao.plural} inscrit{perfil.termos.apresentacao.genero === "f" ? "a" : "o"}{n === 1 ? "" : "s"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
