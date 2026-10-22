import { carregarEvento } from "@/lib/eventos/painel";
import { createClient } from "@/lib/supabase/server";
import { Categorias } from "./Categorias";

export const dynamic = "force-dynamic";

export default async function PaginaCategorias({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, perfil, podeGerir } = await carregarEvento(id);
  const supabase = await createClient();
  const [{ data: cats }, { data: aps }] = await Promise.all([
    supabase.from("categorias").select("*").eq("evento_id", evento.id).order("nome"),
    supabase.from("apresentacoes").select("categoria_id").eq("evento_id", evento.id),
  ]);
  const usos: Record<string, number> = {};
  for (const a of aps ?? []) if (a.categoria_id) usos[a.categoria_id] = (usos[a.categoria_id] ?? 0) + 1;
  return (
    <Categorias eventoId={evento.id} produtoraId={evento.produtora_id} perfilSlug={perfil.slug} categorias={cats ?? []}
      usos={usos} podeGerir={podeGerir} premioEmDinheiro={evento.tipo_premiacao === "com_premiacao_dinheiro"} misto={evento.formato === "misto"} />
  );
}
