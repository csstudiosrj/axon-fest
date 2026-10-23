import { createAdminClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { lerModelo, periodoPorExtenso } from "@/lib/certificados";
import { EditorCertificado } from "./EditorCertificado";

export const dynamic = "force-dynamic";

export default async function PaginaCertificados({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento } = await carregarEvento(id, "checkin");
  const admin = createAdminClient();
  const [{ data: modelo }, { data: produtora }, { count: checkins }, { data: exemplo }] = await Promise.all([
    admin.from("certificado_modelos").select("titulo, texto, cor, fundo_url, assinaturas, liberado").eq("evento_id", evento.id).maybeSingle(),
    admin.from("produtoras").select("nome").eq("id", evento.produtora_id ?? "").maybeSingle(),
    admin.from("checkins").select("id", { count: "exact", head: true }).eq("evento_id", evento.id),
    admin.from("apresentacoes").select("nome, grupos ( nome ), categorias:categoria_id ( nome )").eq("evento_id", evento.id).limit(1).maybeSingle(),
  ]);
  const um = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  return (
    <EditorCertificado
      eventoId={evento.id}
      slug={evento.slug}
      inicial={lerModelo(modelo)}
      liberado={modelo?.liberado ?? false}
      checkins={checkins ?? 0}
      exemplo={{
        nome: "Maria da Silva", coreografia: exemplo?.nome ?? "Nome da coreografia", categoria: um(exemplo?.categorias)?.nome ?? "Categoria",
        grupo: um(exemplo?.grupos)?.nome ?? "Nome do grupo", evento: evento.nome, data: periodoPorExtenso(evento.data_inicio, evento.data_fim) || "data do festival",
        local: evento.local ?? "", produtora: produtora?.nome ?? "",
      }}
    />
  );
}
