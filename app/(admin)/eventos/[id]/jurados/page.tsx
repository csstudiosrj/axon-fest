import { createClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { JuradosEvento } from "./JuradosEvento";

export const dynamic = "force-dynamic";

function um<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default async function PaginaJurados({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, podeGerir } = await carregarEvento(id);
  const supabase = await createClient();
  const [{ data: escala }, { data: cadastro }, { data: fichas }, { count: criterios }] = await Promise.all([
    supabase.from("evento_jurados").select("id, jurado_id, especialidade, cache_valor, cache_status, usuarios ( nome, email )").eq("evento_id", evento.id),
    supabase.from("usuarios").select("id, nome, email, especialidade, ativo").eq("produtora_id", evento.produtora_id ?? "").eq("role", "jurado").order("nome"),
    supabase.from("avaliacoes_fichas").select("avaliador_id, finalizada_em").eq("evento_id", evento.id),
    supabase.from("criterios_avaliacao").select("id", { count: "exact", head: true }).eq("evento_id", evento.id),
  ]);
  const escalados = (escala ?? []).map((e) => {
    const u = um(e.usuarios);
    const minhas = (fichas ?? []).filter((f) => f.avaliador_id === e.jurado_id);
    return {
      vinculoId: e.id, juradoId: e.jurado_id, nome: u?.nome || u?.email || "Jurado(a)", email: u?.email ?? "",
      especialidade: e.especialidade, cacheValor: e.cache_valor, cacheStatus: e.cache_status ?? "pendente",
      fichas: minhas.length, finalizadas: minhas.filter((f) => f.finalizada_em).length,
    };
  });
  const ids = new Set(escalados.map((e) => e.juradoId));
  return (
    <JuradosEvento eventoId={evento.id} podeGerir={podeGerir} escalados={escalados} criterios={criterios ?? 0}
      disponiveis={(cadastro ?? []).filter((u) => !ids.has(u.id) && u.ativo).map((u) => ({ id: u.id, nome: u.nome || u.email, email: u.email, especialidade: u.especialidade }))}
      mostra={evento.formato === "mostra"} />
  );
}
