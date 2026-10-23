import { createClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { Programacao, type ItemProgramacao } from "./Programacao";

export const dynamic = "force-dynamic";

function um<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default async function PaginaProgramacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, perfil, podeGerir } = await carregarEvento(id, "evento_programacao");
  const supabase = await createClient();
  const [{ data: aps }, { data: locais }] = await Promise.all([
    supabase.from("apresentacoes")
      .select("id, nome, tipo, ordem_apresentacao, data_apresentacao, local_id, created_at, grupos ( nome ), categorias ( nome ), apresentacao_elenco ( participantes ( id, nome ) )")
      .eq("evento_id", evento.id)
      .order("ordem_apresentacao", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase.from("locais_evento").select("id, nome_local, cep, endereco, numero, complemento, bairro, cidade, estado").eq("evento_id", evento.id).order("nome_local"),
  ]);
  const itens: ItemProgramacao[] = (aps ?? []).map((a) => ({
    id: a.id, nome: a.nome, tipo: a.tipo as ItemProgramacao["tipo"], ordem: a.ordem_apresentacao, data: a.data_apresentacao, local: a.local_id,
    grupo: um(a.grupos)?.nome ?? "—", categoria: um(a.categorias)?.nome ?? null,
    pessoas: (a.apresentacao_elenco ?? []).map((e) => um(e.participantes)).filter((p): p is { id: string; nome: string } => !!p),
  }));
  return (
    <Programacao eventoId={evento.id} perfilSlug={perfil.slug} itens={itens} locais={locais ?? []} podeGerir={podeGerir}
      dias={{ inicio: evento.data_inicio, fim: evento.data_fim }} />
  );
}
