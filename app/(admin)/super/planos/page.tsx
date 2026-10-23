import { createAdminClient } from "@/lib/supabase/server";
import { FormularioGrupo } from "../PainelSuper";
import { Cabecalho } from "../_ui";
import { Catalogo, type ItemCatalogo } from "./Catalogo";

export default async function SuperPlanos() {
  const admin = createAdminClient();
  const [{ data: itens }, { data: config }] = await Promise.all([
    admin.from("planos_catalogo").select("*").order("tipo").order("ordem"),
    admin.from("configuracoes_sistema").select("valor").eq("chave", "precos").maybeSingle(),
  ]);
  return (
    <>
      <Cabecalho titulo="Planos e taxas" texto="O catálogo aparece na página de Preços do site. As taxas valem para todas as produtoras." />
      <Catalogo itens={(itens ?? []) as ItemCatalogo[]} />
      <FormularioGrupo chave="precos" inicial={(config?.valor as Record<string, unknown>) ?? {}} />
    </>
  );
}
