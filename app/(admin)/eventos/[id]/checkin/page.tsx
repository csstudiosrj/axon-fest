import { createAdminClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { Checkin, type ApresentacaoCheckin } from "./Checkin";

export const dynamic = "force-dynamic";

const um = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export default async function PaginaCheckin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ap?: string }> }) {
  const { id } = await params;
  const { ap } = await searchParams;
  const { evento, perfil } = await carregarEvento(id, "checkin");
  // Leitura pelo servidor depois da checagem de acesso acima (elenco de vários grupos)
  const admin = createAdminClient();
  const [{ data: aps }, { data: feitos }] = await Promise.all([
    admin.from("apresentacoes")
      .select("id, nome, ordem_apresentacao, data_apresentacao, grupos ( nome ), categorias:categoria_id ( nome ), apresentacao_elenco ( participante_id, participantes ( nome, nome_artistico ) )")
      .eq("evento_id", evento.id).order("data_apresentacao", { nullsFirst: false }).order("ordem_apresentacao", { nullsFirst: false }).order("nome"),
    admin.from("checkins").select("apresentacao_id, participante_id").eq("evento_id", evento.id),
  ]);
  const lista: ApresentacaoCheckin[] = (aps ?? []).map((a) => ({
    id: a.id, nome: a.nome, ordem: a.ordem_apresentacao, data: a.data_apresentacao,
    grupo: um(a.grupos)?.nome ?? "—", categoria: um(a.categorias)?.nome ?? "",
    pessoas: (a.apresentacao_elenco ?? []).map((e) => {
      const p = um(e.participantes);
      return { id: e.participante_id, nome: p?.nome_artistico || p?.nome || "—", presente: (feitos ?? []).some((f) => f.apresentacao_id === a.id && f.participante_id === e.participante_id) };
    }).sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")),
  }));
  return <Checkin apresentacoes={lista} destaque={ap ?? null} termoApresentacao={perfil.termos.apresentacao.singular} />;
}
