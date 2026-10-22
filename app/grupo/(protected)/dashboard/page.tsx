import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { exigirUsuarioGrupo, perfilDoEvento, situacaoEvento } from "@/lib/grupo/contexto";
import { contar, maiuscula } from "@/lib/perfis";
import { Cartao, Selo, Vazio, periodo, tomDoEvento } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function MeusFestivais() {
  const usuario = await exigirUsuarioGrupo();
  const supabase = await createClient();

  const { data: inscricoes } = await supabase
    .from("inscricoes_grupo_evento")
    .select("id, evento_id, eventos ( id, nome, data_inicio, data_fim, local, status, logo_url, cor_primaria, perfis_festival:perfil_id ( slug ) )")
    .eq("grupo_id", usuario.organizacao_id)
    .order("created_at", { ascending: false });

  const eventoIds = (inscricoes ?? []).map((i) => i.evento_id as string);
  const { data: aps } = eventoIds.length
    ? await supabase.from("apresentacoes").select("evento_id").eq("grupo_id", usuario.organizacao_id).in("evento_id", eventoIds)
    : { data: [] as { evento_id: string }[] };
  const qtd = new Map<string, number>();
  for (const a of aps ?? []) qtd.set(a.evento_id as string, (qtd.get(a.evento_id as string) ?? 0) + 1);

  const festivais = (inscricoes ?? [])
    .map((i) => (Array.isArray(i.eventos) ? i.eventos[0] : i.eventos) as Record<string, unknown> | null)
    .filter((e): e is Record<string, unknown> => !!e);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Meus festivais</h1>
        <p className="mt-1 text-sm text-gray-400">Festivais em que o grupo está inscrito.</p>
      </div>

      {festivais.length === 0 ? (
        <Cartao>
          <Vazio icone={<Ticket size={22} />} titulo="Nenhuma inscrição ainda"
            texto="Para participar, use o link de inscrição divulgado pela produção do festival. Depois de inscrito, o festival aparece aqui." />
        </Cartao>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {festivais.map((e) => {
            const perfil = perfilDoEvento(e);
            const situacao = situacaoEvento(e.status as string | null);
            const n = qtd.get(e.id as string) ?? 0;
            return (
              <Link key={e.id as string} href={`/grupo/${e.id}/inicio`}
                className="group flex flex-col rounded-xl border border-axon-border bg-axon-panel p-5 transition-colors hover:border-axon-gold/40"
                style={{ borderTopColor: (e.cor_primaria as string) || undefined, borderTopWidth: 3 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {e.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.logo_url as string} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-axon-border bg-axon-bg object-contain" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-axon-border bg-axon-bg text-axon-gold"><Ticket size={15} /></div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{e.nome as string}</p>
                      <p className="text-xs text-gray-500">{perfil.nome}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                  <p className="flex items-center gap-1.5"><CalendarDays size={12} className="text-gray-500" /> {periodo(e.data_inicio as string | null, e.data_fim as string | null)}</p>
                  {!!e.local && <p className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-500" /> <span className="truncate">{e.local as string}</span></p>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-axon-border pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Selo tom={tomDoEvento(e.status as string | null)}>{situacao.rotulo}</Selo>
                    <Selo>{maiuscula(contar(n, perfil.termos.apresentacao))}</Selo>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-gray-500 transition-colors group-hover:text-axon-gold" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
