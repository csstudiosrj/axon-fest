import { carregarEvento } from "@/lib/eventos/painel";
import { createClient } from "@/lib/supabase/server";
import { DadosEvento } from "./DadosEvento";

export const dynamic = "force-dynamic";

export default async function PaginaDados({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, podeGerir, pode } = await carregarEvento(id, ["evento_dados", "evento_pagina"]);
  const supabase = await createClient();
  const { count } = await supabase.from("apresentacoes").select("id", { count: "exact", head: true }).eq("evento_id", evento.id);
  return <DadosEvento evento={evento} podeGerir={podeGerir} podePagina={pode("evento_pagina")} temInscricoes={(count ?? 0) > 0} />;
}
