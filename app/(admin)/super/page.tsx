import { exigirArea } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { situacaoPlano, taxaCaixa, type PlanoProdutora } from "@/lib/planos";
import { vendasCaixaDoMes } from "@/lib/planos-servidor";
import { PainelSuper } from "./PainelSuper";
import type { LinhaProdutora } from "./Produtoras";

export const dynamic = "force-dynamic";

// Painel do dono do SaaS: produtoras, valores comerciais, dados da empresa e demonstração
export default async function SuperAdminPage() {
  await exigirArea(["super_admin"], { login: "/login", area: "/super" });

  const admin = createAdminClient();
  const [{ data: config }, { data: demo }, { data: produtoras }, { data: eventos }, { precos }] = await Promise.all([
    admin.from("configuracoes_sistema").select("chave, valor"),
    admin.from("produtoras").select("id, nome, created_at").eq("demonstracao", true).maybeSingle(),
    admin.from("produtoras").select("id, nome, email, demonstracao, plano, plano_inicio, pro_ate").order("created_at", { ascending: false }),
    admin.from("eventos").select("produtora_id"),
    obterConfiguracoes(),
  ]);

  const vendas = await vendasCaixaDoMes(admin, (produtoras ?? []).map((p) => p.id as string));
  const linhas: LinhaProdutora[] = (produtoras ?? []).map((p) => {
    const s = situacaoPlano(p as PlanoProdutora, precos);
    const vendido = vendas.get(p.id as string) ?? 0;
    const caixa = taxaCaixa(vendido, precos);
    return {
      id: p.id as string,
      nome: p.nome as string,
      email: (p.email as string | null) ?? null,
      demonstracao: !!p.demonstracao,
      eventos: (eventos ?? []).filter((e) => e.produtora_id === p.id).length,
      fase: s.fase,
      ate: s.ate?.toISOString() ?? null,
      diasRestantes: s.diasRestantes,
      caixaVendido: vendido,
      caixaTaxa: caixa.taxa,
      caixaIsento: caixa.isento,
    };
  });

  return (
    <PainelSuper
      configuracoes={Object.fromEntries((config ?? []).map((c) => [c.chave as string, c.valor as Record<string, unknown>]))}
      demonstracao={demo as { id: string; nome: string; created_at: string } | null}
      produtoras={linhas}
    />
  );
}
